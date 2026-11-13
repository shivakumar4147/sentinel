from unittest.mock import patch

import pytest

from app import model_router
from app.docker_evidence import (
    DockerEvidence,
    DockerContainerObservation,
    classify_docker_condition,
    collect_docker_evidence,
)
from app.docker_investigator import investigate_docker
from app.schemas import IncidentDiagnosis


class FakeContainer:
    """Minimal Docker SDK container stand-in for read-only tests."""

    def __init__(
        self,
        name: str,
        status: str,
        health_status: str | None,
    ):
        self.name = name
        self.status = status
        self.attrs = {
            "Config": {"Image": "checkout:demo"},
            "State": {
                "Status": status,
                **(
                    {"Health": {"Status": health_status}}
                    if health_status
                    else {}
                ),
            },
            "Created": "2026-11-13T00:00:00Z",
        }


class FakeDockerClient:
    """Minimal daemon client exposing only read operations."""

    def __init__(self, containers):
        self.containers = type(
            "Containers",
            (),
            {"list": lambda _self, all=True: containers},
        )()
        self.ping_calls = 0

    def ping(self):
        self.ping_calls += 1
        return True


def make_diagnosis(action="none") -> IncidentDiagnosis:
    """Create a valid mocked diagnosis for Docker prompt routing."""
    return IncidentDiagnosis(
        summary="Docker assessment",
        root_cause="Observed container state",
        supporting_evidence=["Docker evidence"],
        contradicting_evidence=[],
        confidence=0.8,
        action=action,
        escalation=False,
        missing_information=[],
    )


def test_docker_unreachable_is_unknown_and_has_no_containers():
    class UnreachableClient:
        def ping(self):
            raise RuntimeError("daemon unavailable")

    evidence = collect_docker_evidence(client=UnreachableClient())

    assert evidence.connected is False
    assert evidence.containers is None
    condition, status, _ = classify_docker_condition(evidence)
    assert condition == "DOCKER_OFFLINE"
    assert status == "unknown"


def test_unhealthy_container_is_classified_from_actual_state():
    client = FakeDockerClient([FakeContainer("checkout", "running", "unhealthy")])

    evidence = collect_docker_evidence(client=client)
    condition, status, anomalies = classify_docker_condition(evidence)

    assert condition == "SERVICE_UNHEALTHY"
    assert status == "unhealthy"
    assert "checkout reports unhealthy" in anomalies


def test_all_explicitly_healthy_containers_are_healthy():
    client = FakeDockerClient([FakeContainer("checkout", "running", "healthy")])

    evidence = collect_docker_evidence(client=client)
    condition, status, anomalies = classify_docker_condition(evidence)

    assert condition == "ALL_SERVICES_HEALTHY"
    assert status == "healthy"
    assert anomalies == []


def test_empty_container_list_is_not_healthy():
    evidence = collect_docker_evidence(client=FakeDockerClient([]))

    condition, status, _ = classify_docker_condition(evidence)

    assert condition == "NO_SERVICES_FOUND"
    assert status == "unknown"


def test_running_container_without_health_check_is_not_explicitly_healthy():
    client = FakeDockerClient([FakeContainer("checkout", "running", None)])

    evidence = collect_docker_evidence(client=client)
    condition, status, anomalies = classify_docker_condition(evidence)

    assert condition == "SERVICE_UNHEALTHY"
    assert status == "unhealthy"
    assert "checkout has no Docker health check" in anomalies


def test_docker_sdk_exception_is_graceful():
    class BrokenClient:
        @property
        def containers(self):
            raise RuntimeError("sdk failure")

        def ping(self):
            return True

    evidence = collect_docker_evidence(client=BrokenClient())

    assert evidence.connected is False
    assert evidence.containers is None
    assert evidence.error == "sdk failure"


def test_docker_investigation_passes_condition_evidence_to_router():
    client = FakeDockerClient([FakeContainer("checkout", "running", "unhealthy")])
    with patch(
        "app.docker_investigator.generate_response",
        return_value=make_diagnosis("restart_service"),
    ) as generate:
        report = investigate_docker(
            "Checkout incident",
            ["request failed"],
            {"error_rate": "20%"},
            {"version": "1.0"},
            {"database": "healthy"},
            client=client,
        )

    assert report.condition == "SERVICE_UNHEALTHY"
    assert report.containers[0].name == "checkout"
    prompt = generate.call_args.args[0]
    assert "SERVICE_UNHEALTHY" in prompt
    assert "checkout" in prompt


def test_healthy_docker_condition_forces_no_recommendation():
    client = FakeDockerClient([FakeContainer("checkout", "running", "healthy")])
    with patch(
        "app.docker_investigator.generate_response",
        return_value=make_diagnosis("restart_service"),
    ):
        report = investigate_docker(
            "No known incident",
            [],
            None,
            None,
            None,
            client=client,
        )

    assert report.condition == "ALL_SERVICES_HEALTHY"
    assert report.recommended_action == "none"
    assert report.requires_approval is False


def test_offline_docker_does_not_claim_application_failure():
    class UnreachableClient:
        def ping(self):
            raise ConnectionError("offline")

    with patch(
        "app.docker_investigator.generate_response",
        return_value=make_diagnosis("restart_service"),
    ):
        report = investigate_docker(
            "Investigate Docker",
            [],
            None,
            None,
            None,
            client=UnreachableClient(),
        )

    assert report.condition == "DOCKER_OFFLINE"
    assert report.overall_status == "unknown"
    assert report.containers is None
    assert report.root_cause is None
    assert report.recommended_action == "none"


def test_existing_model_router_fallback_is_used_for_docker():
    diagnosis = make_diagnosis()
    with patch(
        "app.model_router.groq_client.generate_response",
        side_effect=ConnectionError("Groq failed"),
    ):
        with patch(
            "app.model_router.ollama_client.generate_response",
            return_value=diagnosis,
        ) as ollama:
            result = model_router.generate_response("docker prompt")

    assert result is diagnosis
    ollama.assert_called_once_with("docker prompt")
