from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.investigator import IncidentInvestigationError
from app.schemas import IncidentDiagnosis


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_investigate_endpoint_returns_diagnosis():
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

    with patch("app.main.investigate_incident", return_value=diagnosis) as mock:
        response = client.post(
            "/investigate",
            json={
                "description": "API is unavailable",
                "logs": ["Database timeout"],
            },
        )

    assert response.status_code == 200
    assert response.json()["root_cause"] == "Database timeout"
    mock.assert_called_once()


def test_investigate_endpoint_rejects_invalid_request():
    response = client.post("/investigate", json={"logs": ["missing description"]})

    assert response.status_code == 422


def test_investigate_endpoint_returns_error_for_investigation_failure():
    with patch(
        "app.main.investigate_incident",
        side_effect=IncidentInvestigationError("model unavailable"),
    ):
        response = client.post(
            "/investigate",
            json={"description": "API is unavailable", "logs": []},
        )

    assert response.status_code == 502
    assert response.json()["detail"] == "model unavailable"
