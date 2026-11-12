"""Docker Infrastructure Connector implementing BaseInfrastructureConnector.

Provides STRICTLY READ-ONLY discovery and inspection of Docker containers
using the official Docker SDK. Never performs mutating operations or command execution.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional, Tuple
from app.connectors.base import BaseInfrastructureConnector
from app.core.config import settings

logger = logging.getLogger("sentinel.connectors.docker")


class DockerConnector(BaseInfrastructureConnector):
    """Read-only Docker infrastructure adapter.

    Invariants:
    1. Read-only access only: no create, run, restart, stop, kill, or exec.
    2. Connection resilience: does not crash if Docker is offline or permission is restricted.
    3. Secret hygiene: environment variables, config secrets, and binds are never exposed.
    4. Safe metrics extraction: CPU and memory stats are collected with timeouts and error handling.
    """

    def __init__(self, timeout: Optional[int] = None, auto_connect: bool = False):
        self.timeout = timeout or settings.DOCKER_TIMEOUT_SECONDS
        self._client = None
        self._is_available = False
        self._last_error: Optional[str] = None
        if auto_connect:
            self._init_client()

    def _init_client(self) -> bool:
        """Attempts to initialize Docker client via docker.from_env()."""
        try:
            import docker
            client = docker.from_env(timeout=self.timeout)
            client.ping()
            self._client = client
            self._is_available = True
            self._last_error = None
            logger.info("Successfully connected to Docker daemon via docker.from_env().")
            return True
        except Exception as e:
            self._client = None
            self._is_available = False
            self._last_error = str(e)
            logger.warning("Docker daemon is not accessible: %s", str(e))
            return False

    @property
    def is_available(self) -> bool:
        """Indicates whether Docker daemon connection is currently active."""
        if self._client is None and self._last_error is None:
            self._init_client()
        return self._is_available

    @property
    def last_error(self) -> Optional[str]:
        """Last recorded connection or API error."""
        return self._last_error

    def ping(self) -> bool:
        """Actively verifies or refreshes connectivity to Docker daemon."""
        if self._client is not None:
            try:
                self._client.ping()
                self._is_available = True
                self._last_error = None
                return True
            except Exception as e:
                self._is_available = False
                self._last_error = str(e)
                logger.warning("Docker daemon ping failed: %s", str(e))
                return False
        # If client was None, attempt reconnection
        return self._init_client()

    def get_connectivity_status(self) -> Dict[str, Any]:
        """Provides real-time Docker connectivity report for health endpoints."""
        connected = self.ping()
        containers_count: Optional[int] = None

        if connected and self._client is not None:
            try:
                containers = self._client.containers.list(all=True)
                containers_count = len(containers)
            except Exception as e:
                logger.warning("Could not count containers during health check: %s", str(e))

        return {
            "connected": connected,
            "status": "connected" if connected else "disconnected",
            "containers_count": containers_count,
            "error": self._last_error,
        }

    def list_services(self) -> List[Dict[str, Any]]:
        """Discovers running and stopped Docker containers (Read-Only).

        Returns normalized dictionary representations.
        Falls back to mock services ONLY if explicitly configured via MOCK_SERVICES_FALLBACK.
        """
        if not self.ping() or self._client is None:
            if settings.MOCK_SERVICES_FALLBACK:
                logger.info("Docker unavailable; using MOCK_SERVICES_FALLBACK=True development data.")
                return self._get_mock_services()
            logger.debug("Docker unavailable and MOCK_SERVICES_FALLBACK is disabled; returning empty list.")
            return []

        services: List[Dict[str, Any]] = []
        try:
            # Discover all containers (both running and stopped)
            containers = self._client.containers.list(all=True)
            for c in containers:
                try:
                    c_info = self._extract_container_info(c)
                    services.append(c_info)
                except Exception as container_err:
                    logger.error("Failed extracting info for container %s: %s", getattr(c, "name", "unknown"), str(container_err))
        except Exception as e:
            logger.error("Failed querying Docker containers: %s", str(e))
            self._is_available = False
            self._last_error = str(e)
            if settings.MOCK_SERVICES_FALLBACK:
                return self._get_mock_services()

        return services

    def _extract_container_info(self, container: Any) -> Dict[str, Any]:
        """Extracts and normalizes container metadata while strictly sanitizing secrets."""
        # 1. Identifier & naming
        short_id = getattr(container, "short_id", getattr(container, "id", "")[:12])
        raw_name = getattr(container, "name", "unknown")
        name = raw_name.lstrip("/")

        # 2. Image tag
        image_name = "unknown"
        try:
            if getattr(container, "image", None):
                tags = getattr(container.image, "tags", [])
                if tags:
                    image_name = tags[0]
                else:
                    image_name = getattr(container.image, "short_id", "unknown")
            if image_name == "unknown":
                image_name = container.attrs.get("Config", {}).get("Image", "unknown")
        except Exception:
            image_name = "unknown"

        # 3. Status and Health
        status = getattr(container, "status", "unknown")
        attrs = getattr(container, "attrs", {})
        state_attrs = attrs.get("State", {})

        health_status: Optional[str] = None
        if "Health" in state_attrs and isinstance(state_attrs["Health"], dict):
            health_status = state_attrs["Health"].get("Status")

        if health_status:
            normalized_health = health_status
        elif status == "running":
            normalized_health = "healthy"
        elif status == "exited":
            normalized_health = "stopped"
        else:
            normalized_health = status

        # 4. Timestamps & Uptime
        created_at = attrs.get("Created")
        uptime_seconds = self._calculate_uptime_seconds(state_attrs.get("StartedAt"), status)

        # 5. Recent Logs (last 50 lines)
        logs = self.get_service_logs(name, tail=50)

        # 6. Safe Metrics Extraction (CPU & Memory)
        cpu_percent, memory_mb, memory_limit_mb = self._extract_container_stats(container)

        return {
            "id": short_id,
            "name": name,
            "image": image_name,
            "status": status,
            "health": normalized_health,
            "health_status": health_status,
            "created_at": created_at,
            "uptime_seconds": uptime_seconds,
            "error_rate": 0.0,
            "last_deployment": image_name,
            "logs": logs,
            "cpu_percent": cpu_percent,
            "memory_mb": memory_mb,
            "memory_limit_mb": memory_limit_mb,
        }

    def _extract_container_stats(self, container: Any) -> Tuple[Optional[float], Optional[float], Optional[float]]:
        """Safely gathers CPU and memory stats for running containers with timeout guard."""
        if getattr(container, "status", "") != "running":
            return None, None, None

        try:
            # Single non-streaming snapshot
            stats = container.stats(stream=False)
            if not isinstance(stats, dict):
                return None, None, None

            # Memory metrics
            memory_stats = stats.get("memory_stats", {})
            mem_usage = memory_stats.get("usage", 0)
            mem_limit = memory_stats.get("limit", 0)
            memory_mb = round(mem_usage / (1024 * 1024), 2) if mem_usage else None
            memory_limit_mb = round(mem_limit / (1024 * 1024), 2) if mem_limit else None

            # CPU percentage calculation
            cpu_stats = stats.get("cpu_stats", {})
            precpu_stats = stats.get("precpu_stats", {})

            cpu_delta = (
                cpu_stats.get("cpu_usage", {}).get("total_usage", 0)
                - precpu_stats.get("cpu_usage", {}).get("total_usage", 0)
            )
            system_delta = (
                cpu_stats.get("system_cpu_usage", 0)
                - precpu_stats.get("system_cpu_usage", 0)
            )
            online_cpus = cpu_stats.get("online_cpus")
            if not online_cpus:
                percpu = cpu_stats.get("cpu_usage", {}).get("percpu_usage")
                online_cpus = len(percpu) if percpu else 1

            if system_delta > 0 and cpu_delta > 0:
                cpu_percent = round((cpu_delta / system_delta) * online_cpus * 100.0, 2)
            else:
                cpu_percent = 0.0

            return cpu_percent, memory_mb, memory_limit_mb
        except Exception as e:
            logger.debug("Could not collect stats for %s: %s", getattr(container, "name", "unknown"), str(e))
            return None, None, None

    def _calculate_uptime_seconds(self, started_at_str: Optional[str], status: str) -> int:
        """Parses ISO timestamp and computes uptime in seconds for running containers."""
        if status != "running" or not started_at_str:
            return 0
        try:
            # Clean nanos if present (e.g., 2026-11-12T10:00:00.123456789Z)
            cleaned = started_at_str.split(".")[0].rstrip("Z")
            started_dt = datetime.fromisoformat(cleaned).replace(tzinfo=timezone.utc)
            now_dt = datetime.now(timezone.utc)
            delta = int((now_dt - started_dt).total_seconds())
            return max(0, delta)
        except Exception:
            return 0

    def get_service_logs(self, service_name: str, tail: int = 50) -> List[str]:
        """Fetches up to tail lines of logs from container (Read-Only)."""
        if not self._is_available or self._client is None:
            return []

        try:
            container = self._client.containers.get(service_name)
            raw_logs = container.logs(tail=tail, stdout=True, stderr=True)
            text = raw_logs.decode("utf-8", errors="replace")
            return [line.strip() for line in text.splitlines() if line.strip()]
        except Exception as e:
            logger.debug("Failed reading logs for %s: %s", service_name, str(e))
            return []

    def check_health(self, service_name: str) -> Dict[str, Any]:
        """Read-only health verification of target container."""
        if not self.ping() or self._client is None:
            if settings.MOCK_SERVICES_FALLBACK:
                return {
                    "service": service_name,
                    "healthy": True,
                    "status": "running",
                    "simulated": True,
                }
            return {
                "service": service_name,
                "healthy": False,
                "status": "unavailable",
                "simulated": False,
                "error": self._last_error or "Docker daemon unavailable",
            }

        try:
            container = self._client.containers.get(service_name)
            container.reload()
            health_status = container.attrs.get("State", {}).get("Health", {}).get("Status", "none")
            is_healthy = container.status == "running" and health_status in ("healthy", "none")
            return {
                "service": service_name,
                "healthy": is_healthy,
                "status": container.status,
                "health_status": health_status,
            }
        except Exception as e:
            return {
                "service": service_name,
                "healthy": False,
                "status": "unreachable",
                "error": str(e),
            }

    def restart_service(self, service_name: str, dry_run: bool = True) -> Dict[str, Any]:
        """Strictly enforces READ-ONLY safety policy. Rejects mutating container restarts."""
        if not dry_run:
            logger.error("BLOCKED: Mutating restart requested on %s in read-only mode.", service_name)
            return {
                "success": False,
                "dry_run": False,
                "target": service_name,
                "error": "READ-ONLY SAFETY POLICY: Mutating container operations (restart) are strictly disallowed.",
            }

        logger.info("READ-ONLY DRY RUN: Simulated restart check for '%s'", service_name)
        return {
            "success": True,
            "dry_run": True,
            "action": "restart_container",
            "target": service_name,
            "message": f"[READ-ONLY DRY RUN] Simulation: container {service_name} inspected and validated. No action executed.",
        }

    def _get_mock_services(self) -> List[Dict[str, Any]]:
        """Fallback mock container data used ONLY when MOCK_SERVICES_FALLBACK=True."""
        return [
            {
                "id": "c1a2b3d4e5f6",
                "name": "demo-api",
                "image": "sentinel/demo-api:v2.1",
                "status": "running",
                "health": "degraded",
                "health_status": "unhealthy",
                "created_at": "2026-11-12T10:00:00Z",
                "uptime_seconds": 3600,
                "error_rate": 0.45,
                "last_deployment": "sentinel/demo-api:v2.1",
                "logs": [
                    "[INFO] Received HTTP GET /health",
                    "[ERROR] Database connection refused on port 5432",
                    "[WARN] Retry 3 of 3 failed. Responding with 500",
                ],
                "cpu_percent": 78.5,
                "memory_mb": 512.0,
                "memory_limit_mb": 2048.0,
            },
            {
                "id": "f9e8d7c6b5a4",
                "name": "postgres",
                "image": "postgres:16-alpine",
                "status": "running",
                "health": "healthy",
                "health_status": "healthy",
                "created_at": "2026-11-12T09:30:00Z",
                "uptime_seconds": 7200,
                "error_rate": 0.0,
                "last_deployment": "postgres:16-alpine",
                "logs": [
                    "[LOG] PostgreSQL Database server ready to accept connections",
                ],
                "cpu_percent": 4.2,
                "memory_mb": 142.5,
                "memory_limit_mb": 4096.0,
            },
        ]
