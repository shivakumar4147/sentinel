"""Tests for Sentinel Hardened Remediation Executor and Safety Policy Engine.

Verifies:
1. Successful execution and result reporting.
2. Failed handlers propagate success=False and actual error.
3. Unauthorized targets and AI-generated container names are rejected.
4. Missing approvals block medium/high risk actions.
5. Configurable execution timeouts trigger failure and rollback.
6. Retry limits block excessive attempts.
7. Cooldown timers prevent rapid retry storms.
8. Concurrent duplicate executions for the same incident/target are blocked.
9. Read-only restart rejection is not masked as success.
10. API endpoint raises HTTP 400 on failed or unapproved executions.
"""

import time
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
import pytest

from app.api.routes.remediation import execute_remediation
from app.connectors.docker.connector import DockerConnector
from app.incidents.manager import IncidentManager, incident_manager
from app.remediation.actions import ACTION_DISPATCH_REGISTRY
from app.remediation.executor import RemediationExecutor
from app.safety.policy_engine import SafetyPolicyEngine


@pytest.fixture
def mock_connector():
    connector = MagicMock(spec=DockerConnector)
    connector.restart_service.return_value = {
        "success": False,
        "dry_run": False,
        "target": "demo-api",
        "error": "READ-ONLY SAFETY POLICY: Mutating container operations (restart) are strictly disallowed.",
    }
    return connector


@pytest.fixture
def test_executor(mock_connector):
    executor = RemediationExecutor(connector=mock_connector)
    executor.reset_history()
    return executor


# =====================================================================
# 1. SUCCESSFUL EXECUTION
# =====================================================================

def test_successful_remediation_execution(test_executor):
    """Allowlisted target, whitelisted action, approved, dry-run succeeds."""
    res = test_executor.execute(
        action_type="check_database_connectivity",
        target_service="demo-api",
        risk_level="low",
        confidence=0.95,
        is_approved=True,
        dry_run=True,
        incident_id="INC-SUCCESS-1",
        cooldown_seconds=0,
    )
    assert res["success"] is True
    assert res["executed"] is True
    assert res["dry_run"] is True
    assert "details" in res
    assert res["details"]["success"] is True

    # History was recorded as success
    history = test_executor.get_history("demo-api")
    assert len(history) == 1
    assert history[0]["success"] is True
    assert history[0]["action"] == "check_database_connectivity"


# =====================================================================
# 2. FAILED HANDLER ERROR PROPAGATION
# =====================================================================

def test_failed_action_handler_propagates_error_and_returns_success_false(test_executor):
    """When an action handler returns success=False, executor must return success=False."""
    def failing_handler(target, dry_run, connector):
        return {
            "success": False,
            "error": "Failed to connect to PostgreSQL socket: connection refused on port 5432",
        }

    with patch.dict(ACTION_DISPATCH_REGISTRY, {"custom_failing_action": failing_handler}):
        with patch.object(test_executor.rollback, "revert_action") as mock_revert:
            # Temporarily allow action in policy engine
            with patch.object(SafetyPolicyEngine, "evaluate") as mock_eval:
                mock_eval.return_value = MagicMock(
                    is_allowed=True,
                    requires_approval=False,
                    risk_level=MagicMock(value="low"),
                )
                res = test_executor.execute(
                    action_type="custom_failing_action",
                    target_service="demo-api",
                    risk_level="low",
                    confidence=0.9,
                    is_approved=True,
                    cooldown_seconds=0,
                )

                assert res["success"] is False
                assert res["executed"] is True
                assert "connection refused" in res["error"]
                assert mock_revert.called
                # History records failure
                history = test_executor.get_history("demo-api")
                assert len(history) == 1
                assert history[0]["success"] is False


# =====================================================================
# 3. STRICT TARGET ALLOWLISTING
# =====================================================================

def test_unauthorized_target_rejected_by_policy(test_executor):
    """Target service not in allowlist must be deterministically rejected."""
    unauthorized_targets = [
        "production-database",
        "auth-service-master",
        "host-docker-daemon",
        "banking-core",
        "../../etc/passwd",
    ]
    for target in unauthorized_targets:
        res = test_executor.execute(
            action_type="check_database_connectivity",
            target_service=target,
            risk_level="low",
            confidence=0.9,
            is_approved=True,
        )
        assert res["success"] is False
        assert res["executed"] is False
        assert "not present in permitted target allowlist" in res["error"]


def test_ai_generated_target_cannot_bypass_allowlist():
    """AI engine cannot invent or hallucinate arbitrary container names."""
    engine = SafetyPolicyEngine(
        whitelisted_actions=["restart_container"],
        allowed_targets=["demo-api", "sentinel-demo-api"],
    )
    eval_res = engine.evaluate(
        recommended_action="restart_container",
        target_service="hallucinated-production-cluster-01",
        ai_risk_level="low",
        confidence=0.99,
    )
    assert eval_res.is_allowed is False
    assert "not present in permitted target allowlist" in eval_res.rejection_reason


# =====================================================================
# 4. APPROVAL ENFORCEMENT
# =====================================================================

def test_missing_approval_blocked_for_medium_and_high_risk(test_executor):
    """Actions requiring human approval must be blocked if is_approved=False."""
    # Medium risk: restart_container on demo-api
    res_medium = test_executor.execute(
        action_type="restart_container",
        target_service="demo-api",
        risk_level="medium",
        confidence=0.85,
        is_approved=False,
    )
    assert res_medium["success"] is False
    assert res_medium["executed"] is False
    assert "requires human approval" in res_medium["error"]

    # High risk: rollback_deployment on demo-api
    res_high = test_executor.execute(
        action_type="rollback_deployment",
        target_service="demo-api",
        risk_level="high",
        confidence=0.9,
        is_approved=False,
    )
    assert res_high["success"] is False
    assert res_high["executed"] is False
    assert "requires human approval" in res_high["error"]


# =====================================================================
# 5. CONFIGURABLE EXECUTION TIMEOUT
# =====================================================================

def test_execution_timeout_triggers_failure_and_rollback(test_executor):
    """Slow action handlers exceeding timeout must fail with timeout error and trigger rollback."""
    def slow_handler(target, dry_run, connector):
        time.sleep(1.0)
        return {"success": True}

    with patch.dict(ACTION_DISPATCH_REGISTRY, {"slow_action": slow_handler}):
        with patch.object(SafetyPolicyEngine, "evaluate") as mock_eval:
            mock_eval.return_value = MagicMock(
                is_allowed=True,
                requires_approval=False,
                risk_level=MagicMock(value="low"),
            )
            with patch.object(test_executor.rollback, "revert_action") as mock_revert:
                res = test_executor.execute(
                    action_type="slow_action",
                    target_service="demo-api",
                    risk_level="low",
                    confidence=0.9,
                    is_approved=True,
                    timeout_seconds=0.1,  # Short timeout of 100ms
                    cooldown_seconds=0,
                )
                assert res["success"] is False
                assert res["executed"] is False
                assert res.get("timed_out") is True
                assert "timed out after 0.1 seconds" in res["error"]
                assert mock_revert.called


# =====================================================================
# 6. RETRY LIMITS
# =====================================================================

def test_retry_limit_blocks_excessive_attempts(test_executor):
    """When failures reach max_retries, subsequent executions must be rejected."""
    def failing_handler(target, dry_run, connector):
        return {"success": False, "error": "Transient failure"}

    with patch.dict(ACTION_DISPATCH_REGISTRY, {"failing_action": failing_handler}):
        with patch.object(SafetyPolicyEngine, "evaluate") as mock_eval:
            mock_eval.return_value = MagicMock(
                is_allowed=True,
                requires_approval=False,
                risk_level=MagicMock(value="low"),
            )
            # Perform 2 failed attempts with max_retries=2 and cooldown=0
            r1 = test_executor.execute("failing_action", "demo-api", "low", 0.9, is_approved=True, max_retries=2, cooldown_seconds=0)
            assert r1["success"] is False

            r2 = test_executor.execute("failing_action", "demo-api", "low", 0.9, is_approved=True, max_retries=2, cooldown_seconds=0)
            assert r2["success"] is False

            # 3rd attempt must be blocked by retry limit
            r3 = test_executor.execute("failing_action", "demo-api", "low", 0.9, is_approved=True, max_retries=2, cooldown_seconds=0)
            assert r3["success"] is False
            assert r3["executed"] is False
            assert "maximum attempts (2) exceeded" in r3["error"]


# =====================================================================
# 7. COOLDOWN ENFORCEMENT
# =====================================================================

def test_cooldown_blocks_rapid_retry(test_executor):
    """Consecutive executions within the cooldown window must be rejected."""
    # First execution succeeds
    r1 = test_executor.execute(
        action_type="check_database_connectivity",
        target_service="demo-api",
        risk_level="low",
        confidence=0.95,
        is_approved=True,
        cooldown_seconds=5,
    )
    assert r1["success"] is True

    # Immediate second execution should hit cooldown
    r2 = test_executor.execute(
        action_type="check_database_connectivity",
        target_service="demo-api",
        risk_level="low",
        confidence=0.95,
        is_approved=True,
        cooldown_seconds=5,
    )
    assert r2["success"] is False
    assert r2["executed"] is False
    assert "cooldown active" in r2["error"].lower()
    assert "cooldown_remaining" in r2
    assert r2["cooldown_remaining"] > 0


# =====================================================================
# 8. CONCURRENT DUPLICATE EXECUTION PREVENTION
# =====================================================================

def test_duplicate_concurrent_execution_blocked(test_executor):
    """Simultaneous remediation on the same incident key is blocked."""
    # Artificially insert active execution key
    test_executor._active_executions.add("incident:INC-CONCURRENT-1")

    res = test_executor.execute(
        action_type="check_database_connectivity",
        target_service="demo-api",
        risk_level="low",
        confidence=0.9,
        is_approved=True,
        incident_id="INC-CONCURRENT-1",
    )
    assert res["success"] is False
    assert res["executed"] is False
    assert "Concurrent execution blocked" in res["error"]


# =====================================================================
# 9. READ-ONLY RESTART FAILURE IS NOT MASKED AS SUCCESS
# =====================================================================

def test_read_only_restart_failure_is_not_masked_as_success():
    """In live mode (dry_run=False), restart rejection must not return success=True."""
    mgr = IncidentManager()
    mgr._seed_initial_incident()
    rem_id = "REM-TEST-RO"
    inc_id = "INC-001"

    mgr._remediations[rem_id] = {
        "remediation_id": rem_id,
        "incident_id": inc_id,
        "action_type": "restart_container",
        "target_service": "demo-api",
        "risk_level": "medium",
        "status": "approved",
        "dry_run": False,  # Non-dry-run triggers read-only block
        "requires_approval": True,
        "is_approved": True,
        "confidence": 0.88,
        "created_at": "2026-11-13T00:00:00Z",
    }

    # Reset executor cooldown/history for demo-api
    from app.core.config import settings
    from app.remediation.executor import remediation_executor
    remediation_executor.reset_history("demo-api")

    with patch.object(settings, "SAFETY_DRY_RUN", False):
        res = mgr.execute_remediation(remediation_id=rem_id)
        assert res is not None
        assert res["success"] is False  # Must NOT be masked as True!
        assert "READ-ONLY SAFETY POLICY" in res["error"]
        assert mgr._remediations[rem_id]["status"] == "failed"
        assert mgr._incidents[inc_id]["status"] == "remediation_failed"


# =====================================================================
# 10. API ROUTE ERROR HANDLING (HTTP 400 ON FAILED EXECUTION)
# =====================================================================

def test_api_remediation_execute_returns_400_on_failure():
    """Calling POST /api/remediations/{id}/execute on unapproved remediation raises HTTP 400."""
    mgr = IncidentManager()
    rem_id = "REM-UNAPPROVED"
    mgr._remediations[rem_id] = {
        "remediation_id": rem_id,
        "incident_id": "INC-001",
        "action_type": "restart_container",
        "target_service": "demo-api",
        "risk_level": "medium",
        "status": "pending_approval",
        "dry_run": True,
        "requires_approval": True,
        "is_approved": False,  # NOT approved
        "confidence": 0.85,
        "created_at": "2026-11-13T00:00:00Z",
    }

    with patch("app.api.routes.remediation.incident_manager", mgr):
        with pytest.raises(HTTPException) as exc_info:
            execute_remediation(remediation_id=rem_id)
        assert exc_info.value.status_code == 400
        assert "requires human approval" in exc_info.value.detail
