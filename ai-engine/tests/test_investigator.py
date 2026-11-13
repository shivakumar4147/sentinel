from unittest.mock import patch

import pytest

from app.investigator import (
    IncidentInvestigationError,
    investigate_incident,
)
from app.schemas import IncidentDiagnosis


def test_investigate_incident_processes_evidence_and_calls_ollama():
    diagnosis = IncidentDiagnosis(
        summary="Database outage",
        root_cause="Database timeout",
        supporting_evidence=["Database timeout"],
        contradicting_evidence=[],
        confidence=0.8,
        action="investigate_dependency",
        escalation=False,
        missing_information=[],
    )
    incident = {
        "description": "API is unavailable",
        "logs": ["API started", "Database timeout", "API started"],
        "metrics": {"error_rate": "25%"},
        "deployment": "release=1.2.3",
        "dependencies": "database=unhealthy",
    }

    with patch("app.investigator.generate_response", return_value=diagnosis) as mock:
        result = investigate_incident(incident, max_logs=10)

    assert result is diagnosis
    prompt = mock.call_args.args[0]
    assert "Database timeout" in prompt
    assert prompt.count("API started") == 1
    assert "error_rate=25%" in prompt


def test_investigate_incident_reports_invalid_input():
    with pytest.raises(IncidentInvestigationError, match="description and logs"):
        investigate_incident({"description": "API is unavailable"})


def test_investigate_incident_blocks_low_confidence_action():
    diagnosis = IncidentDiagnosis(
        summary="Unclear outage",
        root_cause="The cause is uncertain",
        supporting_evidence=[],
        contradicting_evidence=[],
        confidence=0.4,
        action="restart_service",
        escalation=False,
        missing_information=["Recent deployment"],
    )

    with patch("app.investigator.generate_response", return_value=diagnosis):
        result = investigate_incident(
            {"description": "API is unavailable", "logs": []}
        )

    assert result.action == "none"
    assert result.escalation is True


def test_investigate_incident_preserves_high_confidence_action():
    diagnosis = IncidentDiagnosis(
        summary="Database outage",
        root_cause="Database dependency is unavailable",
        supporting_evidence=["Connection refused"],
        contradicting_evidence=[],
        confidence=0.9,
        action="investigate_dependency",
        escalation=False,
        missing_information=[],
    )

    with patch("app.investigator.generate_response", return_value=diagnosis):
        result = investigate_incident(
            {
                "description": "API is unavailable",
                "logs": ["Database connection refused"],
            }
        )

    assert result.action == "investigate_dependency"
    assert result.escalation is False