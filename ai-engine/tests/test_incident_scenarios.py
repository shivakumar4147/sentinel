from unittest.mock import patch

import pytest

from app.investigator import investigate_incident
from app.schemas import IncidentDiagnosis


ALLOWED_ACTIONS = {
    "restart_service",
    "rollback_deployment",
    "restore_configuration",
    "investigate_dependency",
    "none",
}


def make_diagnosis(**overrides) -> IncidentDiagnosis:
    """Create a valid mocked model response for a scenario."""
    values = {
        "summary": "Incident needs investigation",
        "root_cause": "The supplied evidence is inconclusive",
        "supporting_evidence": [],
        "contradicting_evidence": [],
        "confidence": 0.4,
        "action": "none",
        "escalation": False,
        "missing_information": ["More diagnostic evidence"],
    }
    values.update(overrides)
    return IncidentDiagnosis(**values)


def run_scenario(incident, diagnosis):
    """Run the pipeline with Ollama replaced by a fixed diagnosis."""
    with patch(
        "app.investigator.generate_response",
        return_value=diagnosis,
    ) as mock_generate:
        result = investigate_incident(incident)

    # The test never calls a real model or any remediation action.
    mock_generate.assert_called_once()
    return result


def assert_valid_diagnosis(diagnosis: IncidentDiagnosis):
    """Check the common contract returned for every incident scenario."""
    assert isinstance(diagnosis, IncidentDiagnosis)
    assert diagnosis.action in ALLOWED_ACTIONS
    assert 0 <= diagnosis.confidence <= 1


def test_bad_deployment_can_recommend_rollback():
    """A failed release is represented by a valid, permitted rollback action."""
    incident = {
        "description": "API requests started failing after a release",
        "logs": ["Deployment failed health checks", "API returned 500"],
        "deployment": {"version": "2026.11.12", "changed": True},
    }
    diagnosis = run_scenario(
        incident,
        make_diagnosis(
            summary="The deployment likely caused API failures",
            root_cause="The latest deployment failed health checks",
            supporting_evidence=["Deployment failed health checks"],
            confidence=0.9,
            action="rollback_deployment",
        ),
    )

    assert_valid_diagnosis(diagnosis)
    assert diagnosis.action == "rollback_deployment"


def test_unavailable_database_can_recommend_dependency_investigation():
    """Database errors lead to the dependency investigation action."""
    incident = {
        "description": "API cannot load user data",
        "logs": ["Database connection refused"],
        "dependencies": {"database": "unavailable"},
    }
    diagnosis = run_scenario(
        incident,
        make_diagnosis(
            root_cause="The database dependency is unavailable",
            supporting_evidence=["Database connection refused"],
            confidence=0.88,
            action="investigate_dependency",
        ),
    )

    assert_valid_diagnosis(diagnosis)
    assert diagnosis.action == "investigate_dependency"


def test_configuration_error_can_recommend_configuration_restore():
    """A configuration-specific error can recommend restoring configuration."""
    incident = {
        "description": "Service will not start",
        "logs": ["Invalid configuration value for PORT"],
        "deployment": {"version": "2026.11.12"},
    }
    diagnosis = run_scenario(
        incident,
        make_diagnosis(
            root_cause="An invalid configuration value prevents startup",
            supporting_evidence=["Invalid configuration value for PORT"],
            confidence=0.86,
            action="restore_configuration",
        ),
    )

    assert_valid_diagnosis(diagnosis)
    assert diagnosis.action == "restore_configuration"


@pytest.mark.parametrize(
    "resource_log",
    ["CPU usage critical: 99%", "Memory exhaustion caused a crash"],
)
def test_resource_exhaustion_can_recommend_service_restart(resource_log):
    """CPU and memory exhaustion produce a permitted restart recommendation."""
    diagnosis = run_scenario(
        {
            "description": "The service is unhealthy under load",
            "logs": [resource_log],
            "metrics": {"resource_usage": "critical"},
        },
        make_diagnosis(
            root_cause="The service exhausted an available resource",
            supporting_evidence=[resource_log],
            confidence=0.82,
            action="restart_service",
        ),
    )

    assert_valid_diagnosis(diagnosis)
    assert diagnosis.action == "restart_service"


def test_conflicting_evidence_can_trigger_escalation():
    """Contradictory signals remain visible and can require human review."""
    incident = {
        "description": "API health is inconsistent",
        "logs": ["Health check failed", "Health check passed"],
        "metrics": {"error_rate": "0%"},
    }
    diagnosis = run_scenario(
        incident,
        make_diagnosis(
            root_cause="The evidence points to more than one possibility",
            supporting_evidence=["Health check failed"],
            contradicting_evidence=["Health check passed", "error_rate=0%"],
            confidence=0.35,
            escalation=True,
        ),
    )

    assert_valid_diagnosis(diagnosis)
    assert diagnosis.escalation is True
    assert diagnosis.contradicting_evidence


def test_insufficient_evidence_keeps_confidence_low():
    """Sparse evidence must not produce an unjustifiably high confidence."""
    diagnosis = run_scenario(
        {
            "description": "The API is behaving unexpectedly",
            "logs": [],
        },
        make_diagnosis(
            confidence=0.2,
            action="investigate_dependency",
            missing_information=["Recent deployment", "Dependency health"],
        ),
    )

    assert_valid_diagnosis(diagnosis)
    assert diagnosis.confidence <= 0.5
    assert diagnosis.missing_information


def test_unknown_root_cause_stays_uncertain():
    """Unknown causes use a safe permitted action and low confidence."""
    diagnosis = run_scenario(
        {
            "description": "Requests are failing for an unknown reason",
            "logs": ["Request failed"],
        },
        make_diagnosis(
            root_cause="Unknown from the supplied evidence",
            confidence=0.1,
            action="none",
            missing_information=["Application traces"],
        ),
    )

    assert_valid_diagnosis(diagnosis)
    assert diagnosis.root_cause.startswith("Unknown")
    assert diagnosis.confidence <= 0.5
    assert diagnosis.action == "none"
