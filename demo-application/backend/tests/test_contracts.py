"""Full lifecycle integration tests for Sentinel API contracts."""

import pytest
from fastapi.testclient import TestClient
from app.remediation.executor import remediation_executor
from app.main import app

client = TestClient(app)


def test_incident_lifecycle_contracts(monkeypatch):
    monkeypatch.setattr(
        remediation_executor.connector,
        "check_health",
        lambda service_name: {
            "service": service_name,
            "healthy": True,
            "status": "running",
            "simulated": True,
        },
    )
    # 1. Fetch initial incidents
    inc_resp = client.get("/api/incidents")
    assert inc_resp.status_code == 200
    incidents = inc_resp.json()["incidents"]
    assert len(incidents) >= 1
    inc_id = incidents[0]["incident_id"]
    assert inc_id == "INC-001"

    # 2. Get incident details
    detail_resp = client.get(f"/api/incidents/{inc_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["incident_id"] == inc_id
    assert "evidence" in detail
    assert detail["evidence"]["logs"] == ["Database connection refused"]

    # 3. Trigger AI investigation (Section 7 contract)
    inv_resp = client.post(f"/api/incidents/{inc_id}/investigate")
    assert inv_resp.status_code == 200
    inv_data = inv_resp.json()["data"]
    investigation = inv_data["investigation"]
    assert investigation["root_cause"] == "Database connection failure"
    assert investigation["confidence"] == 0.87
    assert investigation["recommended_action"] == "check_database_connectivity"
    assert "remediation" in inv_data
    rem_id = inv_data["remediation"]["remediation_id"]

    # 4. Approve remediation
    appr_resp = client.post(
        f"/api/remediations/{rem_id}/approve",
        json={"approver": "lead-engineer@sentinel.internal", "notes": "Approved for testing."},
    )
    assert appr_resp.status_code == 200
    assert appr_resp.json()["status"] == "approved"

    # 5. Execute remediation
    exec_resp = client.post(f"/api/remediations/{rem_id}/execute")
    assert exec_resp.status_code == 200
    exec_data = exec_resp.json()
    assert exec_data["success"] is True

    # 6. Verify recovery
    ver_resp = client.post(f"/api/incidents/{inc_id}/verify")
    assert ver_resp.status_code == 200
    assert ver_resp.json()["recovered"] is True

    # 7. Query audit logs
    audit_resp = client.get("/api/audit-logs")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()["logs"]
    assert len(logs) >= 3
    event_types = [l["action"] for l in logs]
    assert "INCIDENT_TRIGGERED" in event_types
    assert "INVESTIGATION_STARTED" in event_types
    assert "REMEDIATION_APPROVED" in event_types
