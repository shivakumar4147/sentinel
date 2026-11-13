"""Standalone foundation verification script for Sentinel Backend (Member 1).

Executes verification checks without requiring external network access or a live Ollama/Docker daemon.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
print(f"[PASS] 1. Config initialized: {settings.PROJECT_NAME} (version {settings.VERSION})")

from app.safety.policy_engine import safety_engine
res = safety_engine.evaluate("check_database_connectivity", "api", "low", 0.9)
assert res.is_allowed is True
print(f"[PASS] 2. Safety Engine Whitelist: allowed={res.is_allowed}, risk={res.risk_level.value}")

blocked = safety_engine.evaluate("delete_database", "api", "high", 0.9)
assert blocked.is_allowed is False
print(f"[PASS] 3. Safety Engine Blacklist: blocked successfully ({blocked.rejection_reason})")

from app.incidents.manager import incident_manager
incidents = incident_manager.list_incidents()
assert len(incidents) >= 1
print(f"[PASS] 4. Incident Manager: Found active baseline incident '{incidents[0].incident_id}'")

from app.integrations.ollama_client import ollama_client
mock_ai = ollama_client._get_mock_response(incidents[0])
assert mock_ai.root_cause == "Database connection failure"
assert mock_ai.recommended_action == "check_database_connectivity"
print(f"[PASS] 5. AI Integration Contract (Section 7): Validated schema and mock response")

from app.remediation.executor import remediation_executor
exec_res = remediation_executor.execute(
    action_type="check_database_connectivity",
    target_service="api",
    risk_level="low",
    confidence=0.9,
    is_approved=True,
    dry_run=True,
)
assert exec_res["success"] is True
print(f"[PASS] 6. Remediation Executor: Predefined action executed in dry-run mode")

ver = incident_manager.verify_recovery("INC-001")
assert ver.recovered is True
print(f"[PASS] 7. Health Verification: Service verified and marked {ver.current_status}")

audit = incident_manager.get_audit_logs()
assert len(audit) >= 1
print(f"[PASS] 8. Audit Logger: Recorded {len(audit)} immutable audit events")

print("\n>>> ALL SENTINEL FOUNDATION CHECKS PASSED SUCCESSFULLY! <<<")
