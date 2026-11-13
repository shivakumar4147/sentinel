"""Remediation Executor.

Executes only predefined permitted actions on strictly allowlisted target containers.
Enforces safety checks, operator approval verification, execution timeouts,
concurrency locks, retry limits, and cooldown timers.
"""

import concurrent.futures
import json
import logging
import threading
import time
from typing import Any, Dict, List, Optional, Set

from app.connectors.docker.connector import DockerConnector
from app.core.config import settings
from app.remediation.actions import ACTION_DISPATCH_REGISTRY
from app.remediation.rollback import RollbackCoordinator
from app.safety.policy_engine import safety_engine

logger = logging.getLogger("sentinel.remediation.executor")


class RemediationExecutor:
    """Hardened execution engine for automated recovery actions."""

    def __init__(self, connector: DockerConnector):
        self.connector = connector
        self.rollback = RollbackCoordinator(connector)
        self._state_lock = threading.Lock()
        self._active_executions: Set[str] = set()
        self._execution_history: Dict[str, List[Dict[str, Any]]] = {}

    def reset_history(self, target_service: Optional[str] = None) -> None:
        """Resets execution history and active lock state for testing or operational resets."""
        with self._state_lock:
            if target_service:
                self._execution_history.pop(target_service.strip().lower(), None)
            else:
                self._execution_history.clear()
            self._active_executions.clear()

    def get_history(self, target_service: str) -> List[Dict[str, Any]]:
        """Returns chronological execution attempts for a given target service."""
        with self._state_lock:
            return list(self._execution_history.get(target_service.strip().lower(), []))

    def _record_history(
        self,
        target_service: str,
        action_type: str,
        success: bool,
        incident_id: Optional[str] = None,
    ) -> None:
        """Appends an execution record to the internal history ledger."""
        with self._state_lock:
            target_key = target_service.strip().lower()
            if target_key not in self._execution_history:
                self._execution_history[target_key] = []
            self._execution_history[target_key].append({
                "timestamp": time.time(),
                "action": action_type,
                "success": success,
                "incident_id": incident_id,
            })

    def execute(
        self,
        action_type: str,
        target_service: str,
        risk_level: str,
        confidence: float,
        is_approved: bool = False,
        approved_by: str = "",
        dry_run: bool = True,
        incident_id: Optional[str] = None,
        remediation_id: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        max_retries: Optional[int] = None,
        cooldown_seconds: Optional[int] = None,
        diff: Optional[str] = None,
        target_file: Optional[str] = None,
        **extra_kwargs: Any,
    ) -> Dict[str, Any]:
        """Validates safety and executes the whitelisted remediation action with full safety guards."""
        target_clean = (target_service or "").strip().lower()

        # =====================================================================
        # 1. Deterministic Safety & Target Allowlist Policy Check
        # =====================================================================
        eval_result = safety_engine.evaluate(
            recommended_action=action_type,
            target_service=target_service,
            ai_risk_level=risk_level,
            confidence=confidence,
        )

        if not eval_result.is_allowed:
            logger.error("Blocked unauthorized action execution: %s", eval_result.rejection_reason)
            return {
                "success": False,
                "executed": False,
                "error": eval_result.rejection_reason,
                "target": target_service,
                "action": action_type,
                "remediation_id": remediation_id,
                "incident_id": incident_id,
            }

        # =====================================================================
        # 2. Human Approval Verification Gate
        # =====================================================================
        if eval_result.requires_approval and not is_approved:
            logger.warning(
                "Execution rejected: Action '%s' on '%s' has risk '%s' and requires explicit operator approval.",
                action_type,
                target_service,
                eval_result.risk_level.value,
            )
            return {
                "success": False,
                "executed": False,
                "error": f"Action '{action_type}' requires human approval before execution.",
                "risk_level": eval_result.risk_level.value,
                "target": target_service,
                "action": action_type,
                "remediation_id": remediation_id,
                "incident_id": incident_id,
            }

        # =====================================================================
        # 3. Concurrent Duplicate Remediation Prevention
        # =====================================================================
        exec_key = f"incident:{incident_id}" if incident_id else f"target:{target_clean}"

        with self._state_lock:
            if exec_key in self._active_executions:
                logger.warning("Blocked duplicate execution: remediation active for '%s'", exec_key)
                return {
                    "success": False,
                    "executed": False,
                    "error": f"Concurrent execution blocked: remediation already in progress for '{exec_key}'.",
                    "target": target_service,
                    "remediation_id": remediation_id,
                    "incident_id": incident_id,
                }
            self._active_executions.add(exec_key)

        try:
            # =================================================================
            # 4. Retry Limit Verification
            # =================================================================
            effective_max_retries = (
                max_retries if max_retries is not None else settings.REMEDIATION_MAX_RETRIES
            )
            history = self.get_history(target_clean)
            failed_attempts = [
                h for h in history
                if not h.get("success") or (incident_id and h.get("incident_id") == incident_id)
            ]

            if len(failed_attempts) >= effective_max_retries:
                logger.warning(
                    "Execution rejected: max retries (%d) reached for target '%s'",
                    effective_max_retries,
                    target_service,
                )
                return {
                    "success": False,
                    "executed": False,
                    "error": f"Remediation retry limit reached: maximum attempts ({effective_max_retries}) exceeded for target '{target_service}'.",
                    "target": target_service,
                    "remediation_id": remediation_id,
                    "incident_id": incident_id,
                }

            # =================================================================
            # 5. Cooldown Enforcement
            # =================================================================
            effective_cooldown = (
                cooldown_seconds if cooldown_seconds is not None else settings.REMEDIATION_COOLDOWN_SECONDS
            )
            if history and effective_cooldown > 0:
                last_attempt_time = history[-1]["timestamp"]
                elapsed = time.time() - last_attempt_time
                if elapsed < effective_cooldown:
                    remaining = round(effective_cooldown - elapsed, 1)
                    logger.warning(
                        "Execution rejected: cooldown active for '%s' (%.1fs remaining)",
                        target_service,
                        remaining,
                    )
                    return {
                        "success": False,
                        "executed": False,
                        "error": f"Remediation cooldown active for target '{target_service}'. Please wait {remaining}s before retrying.",
                        "cooldown_remaining": remaining,
                        "target": target_service,
                        "remediation_id": remediation_id,
                        "incident_id": incident_id,
                    }

            # =================================================================
            # 6. Lookup Handler in Dispatch Registry
            # =================================================================
            handler = ACTION_DISPATCH_REGISTRY.get(action_type)
            if not handler:
                logger.error("No implementation handler found for action '%s'", action_type)
                return {
                    "success": False,
                    "executed": False,
                    "error": f"No implementation handler found for action '{action_type}'.",
                    "target": target_service,
                    "remediation_id": remediation_id,
                    "incident_id": incident_id,
                }

            # =================================================================
            # 7. Execute Handler with Configurable Timeout
            # =================================================================
            effective_dry_run = dry_run or settings.SAFETY_DRY_RUN
            effective_timeout = (
                timeout_seconds if timeout_seconds is not None else settings.REMEDIATION_TIMEOUT_SECONDS
            )

            try:
                import inspect
                sig = inspect.signature(handler)
                call_args: Dict[str, Any] = {
                    "target": target_service,
                    "dry_run": effective_dry_run,
                    "connector": self.connector,
                }
                if "diff" in sig.parameters:
                    call_args["diff"] = diff
                if "target_file" in sig.parameters:
                    call_args["target_file"] = target_file
                if "remediation_id" in sig.parameters:
                    call_args["remediation_id"] = remediation_id
                if "incident_id" in sig.parameters:
                    call_args["incident_id"] = incident_id
                for k, v in extra_kwargs.items():
                    if k in sig.parameters:
                        call_args[k] = v

                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                    future = pool.submit(handler, **call_args)
                    result = future.result(timeout=float(effective_timeout))
            except concurrent.futures.TimeoutError:
                logger.error(
                    "Remediation execution timed out after %ds for action '%s' on '%s'",
                    effective_timeout,
                    action_type,
                    target_service,
                )
                self.rollback.revert_action(action_type, target_service, dry_run=effective_dry_run)
                self._record_history(target_clean, action_type, False, incident_id)
                return {
                    "success": False,
                    "executed": False,
                    "timed_out": True,
                    "error": f"Remediation action '{action_type}' timed out after {effective_timeout} seconds.",
                    "target": target_service,
                    "remediation_id": remediation_id,
                    "incident_id": incident_id,
                }
            except Exception as e:
                logger.error("Remediation execution raised exception: %s", str(e))
                self.rollback.revert_action(action_type, target_service, dry_run=effective_dry_run)
                self._record_history(target_clean, action_type, False, incident_id)
                return {
                    "success": False,
                    "executed": False,
                    "error": f"Remediation failure: {str(e)}",
                    "target": target_service,
                    "remediation_id": remediation_id,
                    "incident_id": incident_id,
                }

            # =================================================================
            # 8. Strict Result Validation & Error Propagation
            # =================================================================
            handler_success = False
            if isinstance(result, dict):
                handler_success = bool(result.get("success", False))
            elif isinstance(result, bool):
                handler_success = result

            if not handler_success:
                error_msg = None
                if isinstance(result, dict):
                    error_msg = result.get("error") or result.get("message")
                if not error_msg:
                    error_msg = f"Remediation action '{action_type}' reported failure."

                logger.warning(
                    "Remediation handler reported failure for '%s' on '%s': %s",
                    action_type,
                    target_service,
                    error_msg,
                )
                self.rollback.revert_action(action_type, target_service, dry_run=effective_dry_run)
                self._record_history(target_clean, action_type, False, incident_id)

                return {
                    "success": False,
                    "executed": True,
                    "dry_run": effective_dry_run,
                    "approved_by": approved_by if is_approved else "system_auto",
                    "error": error_msg,
                    "details": result,
                    "remediation_id": remediation_id,
                    "incident_id": incident_id,
                }

            # Success path
            self._record_history(target_clean, action_type, True, incident_id)
            return {
                "success": True,
                "executed": True,
                "dry_run": effective_dry_run,
                "approved_by": approved_by if is_approved else "system_auto",
                "details": result,
                "remediation_id": remediation_id,
                "incident_id": incident_id,
            }

        finally:
            with self._state_lock:
                self._active_executions.discard(exec_key)


# Singleton remediation executor with Docker connector
docker_connector = DockerConnector()
remediation_executor = RemediationExecutor(connector=docker_connector)
