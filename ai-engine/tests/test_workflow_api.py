from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.workflow import FullInvestigationError
from app.schemas import FullInvestigationReport, IncidentDiagnosis


client = TestClient(app)


def test_full_workflow_endpoint_returns_structured_report():
    report = FullInvestigationReport(
        diagnosis=IncidentDiagnosis(
            summary="Outage",
            root_cause="Unknown",
            supporting_evidence=[],
            contradicting_evidence=[],
            confidence=0.2,
            action="none",
            escalation=True,
            missing_information=["logs"],
        ),
        stage_status={
            "diagnosis": {"status": "succeeded"},
            "code_inspection": {"status": "skipped"},
            "patch_generation": {"status": "skipped"},
            "test_generation": {"status": "skipped"},
            "test_result_analysis": {"status": "skipped"},
        },
    )
    with patch("app.main.run_full_investigation", return_value=report):
        response = client.post(
            "/investigate/full",
            json={"description": "Outage", "logs": []},
        )

    assert response.status_code == 200
    assert response.json()["diagnosis"]["action"] == "none"


def test_full_workflow_endpoint_hides_internal_failure_details():
    with patch(
        "app.main.run_full_investigation",
        side_effect=FullInvestigationError("provider secret details"),
    ):
        response = client.post(
            "/investigate/full",
            json={"description": "Outage", "logs": []},
        )

    assert response.status_code == 502
    assert response.json()["detail"] == "Unable to complete investigation workflow"
