"""End-to-End Pipeline & Hotfix Safety Integration Tests.

Validates:
1. Checkout failure records incident without duplicate proliferation.
2. apply_code_patch enforces path isolation, traversal defense, and AST validation.
3. Complete workflow: normal -> bad_deployment (500) -> incident -> approval -> patch -> recovered (200).
"""

import ast
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.api.routes.demo_app import (
    CheckoutSimulationRequest,
    ScenarioRequest,
    get_demo_app_status,
    get_demo_store_health,
    mark_demo_store_remediated,
    set_demo_app_scenario,
    simulate_checkout,
)
from app.incidents.manager import IncidentManager
from app.remediation.actions import action_apply_code_patch
from app.remediation.executor import RemediationExecutor
from app.safety.policy_engine import safety_engine


@pytest.fixture
def fresh_manager():
    mgr = IncidentManager()
    return mgr


# =====================================================================
# 1. INCIDENT RECORDING & DE-DUPLICATION
# =====================================================================

def test_checkout_failure_records_incident_without_duplicates(fresh_manager):
    """First checkout failure associates or creates incident; retries update without duplicating."""
    err_msg = "AttributeError: 'NoneType' object has no attribute 'lower'"
    
    # 1. First failure associates with INC-002
    inc_id1 = fresh_manager.record_checkout_failure(err_msg)
    assert inc_id1 == "INC-002"
    
    initial_count = fresh_manager.get_incident(inc_id1).evidence.metrics.get("checkout_failures", 1)
    
    # 2. Retry failure should update same incident, not create INC-003
    inc_id2 = fresh_manager.record_checkout_failure(err_msg)
    assert inc_id2 == inc_id1
    
    updated_count = fresh_manager.get_incident(inc_id1).evidence.metrics.get("checkout_failures", 1)
    assert updated_count >= initial_count


# =====================================================================
# 2. APPLY_CODE_PATCH SAFETY INVARIANTS
# =====================================================================

def test_apply_code_patch_rejects_path_traversal():
    """Attempts to traverse directories with '..' are rejected immediately."""
    res = action_apply_code_patch(
        target="api",
        dry_run=True,
        connector=MagicMock(),
        target_file="../../../etc/passwd",
    )
    assert res["success"] is False
    assert "Security violation" in res["error"]


def test_apply_code_patch_rejects_backend_files():
    """Attempts to modify core backend files are blocked."""
    res = action_apply_code_patch(
        target="api",
        dry_run=True,
        connector=MagicMock(),
        target_file="backend/app/main.py",
    )
    assert res["success"] is False
    assert "Security violation" in res["error"]


def test_apply_code_patch_dry_run_validates_ast():
    """Dry run validates AST syntax on target demo checkout file."""
    res = action_apply_code_patch(
        target="api",
        dry_run=True,
        connector=MagicMock(),
        target_file="sample_checkout/checkout.py",
    )
    assert res["success"] is True
    assert res.get("dry_run") is True or res.get("already_patched") is True


# =====================================================================
# 3. COMPLETE RECOVERY LIFECYCLE
# =====================================================================

def test_full_incident_recovery_lifecycle(fresh_manager):
    """End-to-end: healthy -> bad_deployment 500 -> approve -> patch -> healthy 200."""
    # Step 1: Set scenario to normal -> checkout succeeds (200)
    set_demo_app_scenario(ScenarioRequest(scenario="normal"))
    normal_res = simulate_checkout(CheckoutSimulationRequest(product_id=101, amount=128.0))
    assert normal_res["success"] is True
    assert normal_res["status"] == "confirmed"

    # Step 2: Set scenario to bad_deployment -> checkout raises HTTP 500
    set_demo_app_scenario(ScenarioRequest(scenario="bad_deployment"))
    with pytest.raises(Exception) as exc_info:
        simulate_checkout(CheckoutSimulationRequest(product_id=101, amount=128.0))
    assert "500" in str(exc_info.value) or "AttributeError" in str(exc_info.value)

    # Step 3: Check incident status in manager
    inc = fresh_manager.get_incident("INC-002")
    assert inc is not None
    assert "checkout" in inc.summary.lower() or "500" in inc.summary

    # Step 4: Approve remediation
    fresh_manager.approve_remediation("REM-102", approver="sec-lead", notes="Approved defensive null check hotfix")
    rem = fresh_manager.get_remediation("REM-102")
    assert rem["status"] == "approved"
    assert rem["is_approved"] is True

    # Step 5: Execute remediation (reset history cooldown first)
    from app.remediation.executor import remediation_executor
    remediation_executor.reset_history()
    exec_res = fresh_manager.execute_remediation("REM-102")
    assert exec_res is not None
    assert exec_res["success"] is True

    # Step 6: Verify recovery
    verif = fresh_manager.verify_recovery("INC-002")
    assert verif.recovered is True
    assert verif.current_status == "resolved"

    # Step 7: Retry checkout -> succeeds (200)
    retry_res = simulate_checkout(CheckoutSimulationRequest(product_id=101, amount=128.0))
    assert retry_res["success"] is True
    assert retry_res["status"] == "confirmed"
