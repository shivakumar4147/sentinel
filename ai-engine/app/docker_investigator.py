"""Condition-aware, recommendation-only Docker investigation."""

from collections.abc import Sequence

from app.docker_evidence import (
    DockerEvidence,
    classify_docker_condition,
    collect_docker_evidence,
)
from app.docker_prompt_builder import build_docker_investigation_prompt
from app.model_router import generate_response
from app.schemas import DockerInvestigationReport


def investigate_docker(
    incident_description: str,
    logs: list[str],
    metrics: object,
    deployment: object,
    dependencies: object,
    container_names: Sequence[str] = (),
    require_health_checks: bool = True,
    client: object = None,
) -> DockerInvestigationReport:
    """Collect Docker evidence and return an advisory condition assessment."""
    evidence = collect_docker_evidence(
        container_names=container_names,
        require_health_checks=require_health_checks,
        client=client,
    )
    condition, overall_status, anomalies = classify_docker_condition(
        evidence,
        require_health_checks=require_health_checks,
    )
    prompt = build_docker_investigation_prompt(
        condition,
        overall_status,
        evidence,
        incident_description,
        logs,
        metrics,
        deployment,
        dependencies,
        anomalies,
    )
    diagnosis = generate_response(prompt)
    action = diagnosis.action
    if condition in {"DOCKER_OFFLINE", "ALL_SERVICES_HEALTHY", "NO_SERVICES_FOUND"}:
        action = "none"
    if condition == "DOCKER_OFFLINE":
        root_cause = None
        confidence = min(diagnosis.confidence, 0.3)
    else:
        root_cause = diagnosis.root_cause
        confidence = diagnosis.confidence
    evidence_lines = [
        f"Docker connected: {evidence.connected}",
        *(evidence.error and [f"Docker error: {evidence.error}"] or []),
        *(
            f"Container {item.name}: status={item.status}, "
            f"health={item.health_status}, image={item.image}"
            for item in (evidence.containers or [])
        ),
    ]
    return DockerInvestigationReport(
        overall_status=overall_status,
        condition=condition,
        root_cause=root_cause,
        confidence=confidence,
        evidence=evidence_lines,
        anomalies=anomalies,
        recommended_action=action,
        requires_approval=action != "none",
        explanation=diagnosis.summary,
        verification=diagnosis.missing_information,
        containers=(
            None
            if evidence.containers is None
            else [
                {
                    "name": item.name,
                    "status": item.status,
                    "health_status": item.health_status,
                    "image": item.image,
                    "uptime_seconds": item.uptime_seconds,
                }
                for item in evidence.containers
            ]
        ),
    )
