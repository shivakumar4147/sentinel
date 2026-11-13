"""Full lifecycle integration tests for Sentinel incident and remediation workflows."""

from datetime import datetime, timezone
from app.core.config import settings
from app.incidents.manager import incident_manager
from app.integrations.ollama_client import ollama_client


def test_incident_lifecycle_contracts():
    settings.MOCK_SERVICES_FALLBACK = True

    # 1. Fetch initial incidents
    incidents = incident_manager.list_incidents()
    assert len(incidents) >= 1
    inc_id = incidents[0].incident_id
    assert inc_id == "INC-001"

    # 2. Get incident details
    detail = incident_manager.get_incident(inc_id)
    assert detail is not None
    assert detail.incident_id == inc_id
    assert detail.evidence.logs == ["Database connection refused"]

    # 3. Simulate AI investigation response (Section 7 contract)
    ai_result = ollama_client._get_mock_response(detail.evidence)
    assert ai_result.root_cause == "Database connection failure"
    assert ai_result.confidence == 0.87
    assert ai_result.recommended_action == "check_database_connectivity"
    assert ai_result.requires_approval is True

    # Store investigation into incident state
    incident = incident_manager._incidents[inc_id]
    incident["investigation"] = ai_result
    rem_id = "REM-101"
    incident["remediation_id"] = rem_id
    incident_manager._remediations[rem_id] = {
        "remediation_id": rem_id,
        "incident_id": inc_id,
        "action_type": ai_result.recommended_action,
        "target_service": incident["service"],
        "risk_level": "medium",
        "status": "pending_approval",
        "dry_run": True,
        "requires_approval": True,
        "is_approved": False,
        "confidence": ai_result.confidence,
        "approval_notes": None,
        "output": None,
        "created_at": datetime.now(timezone.utc),
    }

    # 4. Approve remediation
    appr_resp = incident_manager.approve_remediation(
        remediation_id=rem_id,
        approver="lead-engineer@sentinel.internal",
        notes="Approved for testing.",
    )
    assert appr_resp is not None
    assert appr_resp.status == "approved"

    # 5. Execute remediation
    exec_data = incident_manager.execute_remediation(remediation_id=rem_id)
    assert exec_data is not None
    assert exec_data["success"] is True

    # 6. Verify recovery
    ver_resp = incident_manager.verify_recovery(incident_id=inc_id)
    assert ver_resp is not None
    assert ver_resp.recovered is True

    # 7. Query audit logs
    logs = incident_manager.get_audit_logs()
    assert len(logs) >= 3
    event_types = [l["action"] for l in logs]
    assert "INCIDENT_TRIGGERED" in event_types
    assert "REMEDIATION_APPROVED" in event_types
    assert "REMEDIATION_EXECUTED" in event_types
