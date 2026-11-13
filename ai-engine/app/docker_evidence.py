"""Read-only Docker daemon and container evidence collection."""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Sequence


@dataclass(frozen=True)
class DockerContainerObservation:
    """Observed fields from one Docker container."""

    name: str
    status: str
    health_status: str
    image: str | None
    uptime_seconds: float | None


@dataclass(frozen=True)
class DockerEvidence:
    """Docker connectivity result and observed container evidence."""

    connected: bool
    containers: list[DockerContainerObservation] | None
    error: str | None


def _uptime_seconds(created: Any) -> float | None:
    """Convert a Docker creation timestamp into an observed uptime."""
    if not isinstance(created, str):
        return None
    try:
        timestamp = datetime.fromisoformat(created.replace("Z", "+00:00"))
    except ValueError:
        return None
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    return max(0.0, (datetime.now(timezone.utc) - timestamp).total_seconds())


def _container_observation(container: Any) -> DockerContainerObservation:
    """Read container metadata without invoking container operations."""
    attrs = getattr(container, "attrs", {}) or {}
    state = attrs.get("State", {}) or {}
    health = state.get("Health", {}) or {}
    config = attrs.get("Config", {}) or {}
    image = config.get("Image")
    if not image:
        tags = getattr(getattr(container, "image", None), "tags", [])
        image = tags[0] if tags else None
    return DockerContainerObservation(
        name=str(getattr(container, "name", "") or attrs.get("Name", "")).lstrip("/"),
        status=str(getattr(container, "status", None) or state.get("Status", "unknown")),
        health_status=str(health.get("Status", "no_healthcheck")),
        image=image,
        uptime_seconds=_uptime_seconds(attrs.get("Created")),
    )


def collect_docker_evidence(
    container_names: Sequence[str] = (),
    require_health_checks: bool = True,
    client: Any = None,
) -> DockerEvidence:
    """Collect Docker state using only daemon reads.

    A missing daemon or SDK is represented as unavailable evidence rather than
    an empty healthy service list. No container lifecycle operation is called.
    """
    try:
        if client is None:
            import docker

            client = docker.from_env()
        client.ping()
        containers = client.containers.list(all=True)
    except Exception as error:
        return DockerEvidence(
            connected=False,
            containers=None,
            error=str(error),
        )

    selected_names = set(container_names)
    observations = []
    for container in containers:
        observation = _container_observation(container)
        if not selected_names or observation.name in selected_names:
            observations.append(observation)
    return DockerEvidence(
        connected=True,
        containers=observations,
        error=None,
    )


def classify_docker_condition(
    evidence: DockerEvidence,
    require_health_checks: bool = True,
) -> tuple[str, str, list[str]]:
    """Classify Docker state deterministically from observed evidence."""
    if not evidence.connected or evidence.containers is None:
        return (
            "DOCKER_OFFLINE",
            "unknown",
            ["Docker daemon connectivity or container discovery failed"],
        )
    if not evidence.containers:
        return (
            "NO_SERVICES_FOUND",
            "unknown",
            ["Docker is connected but no monitored containers were found"],
        )

    anomalies: list[str] = []
    unhealthy = False
    for container in evidence.containers:
        if container.status != "running":
            unhealthy = True
            anomalies.append(
                f"{container.name} status is {container.status}"
            )
        elif container.health_status == "unhealthy":
            unhealthy = True
            anomalies.append(f"{container.name} reports unhealthy")
        elif (
            require_health_checks
            and container.health_status == "no_healthcheck"
        ):
            unhealthy = True
            anomalies.append(f"{container.name} has no Docker health check")

    if unhealthy:
        return "SERVICE_UNHEALTHY", "unhealthy", anomalies
    return "ALL_SERVICES_HEALTHY", "healthy", anomalies
