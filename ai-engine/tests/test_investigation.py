from schemas.models import IncidentInput, InvestigationResponse
from investigator import AIInvestigator


def test_mock_investigation():
    investigator = AIInvestigator()
    sample = IncidentInput(
        incident_id="INC-001",
        service="api",
        logs=["Database connection refused"],
        metrics={"cpu_usage": 78, "error_rate": 45},
        recent_changes=["Deployment v2.1"],
        dependency_status={"database": "unreachable"}
    )
    res = investigator.mock_investigate(sample)
    assert isinstance(res, InvestigationResponse)
    assert res.root_cause == "Database connection failure"
    assert res.confidence == 0.87
    assert res.recommended_action == "check_database_connectivity"
    assert res.requires_approval is True
