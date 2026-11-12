"""Remediation Executor.

Executes only predefined permitted actions.
Enforces safety checks, operator approval verification, and recovery validation.
"""

import logging
from typing import Any, Dict
from app.connectors.docker.connector import DockerConnector
from app.core.config import settings
from app.remediation.actions import ACTION_DISPATCH_REGISTRY
from app.remediation.rollback import RollbackCoordinator
from app.safety.policy_engine import safety_engine

logger = logging.getLogger("sentinel.remediation.executor")


class RemediationExecutor:
    def __init__(self, connector: DockerConnector):
        self.connector = connector
        self.rollback = RollbackCoordinator(connector)

    def execute(
        self,
        action_type: str,
        target_service: str,
        risk_level: str,
        confidence: float,
        is_approved: bool = False,
        approved_by: str = "",
        dry_run: bool = True,
    ) -> Dict[str, Any]:
        """Validates safety and executes the whitelisted remediation action."""
        # 1. Deterministic safety check
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
            }

        # 2. Human approval verification gate
        if eval_result.requires_approval and not is_approved:
            logger.warning(
                "Execution rejected: Action '%s' has risk '%s' and requires explicit operator approval.",
                action_type,
                eval_result.risk_level.value,
            )
            return {
                "success": False,
                "executed": False,
                "error": f"Action '{action_type}' requires human approval before execution.",
            }

        # 3. Lookup handler in dispatch registry
        handler = ACTION_DISPATCH_REGISTRY.get(action_type)
        if not handler:
            return {
                "success": False,
                "executed": False,
                "error": f"No implementation handler found for action '{action_type}'.",
            }

        # 4. Execute predefined handler
        effective_dry_run = dry_run or settings.SAFETY_DRY_RUN
        try:
            result = handler(target=target_service, dry_run=effective_dry_run, connector=self.connector)
            return {
                "success": True,
                "executed": True,
                "dry_run": effective_dry_run,
                "approved_by": approved_by if is_approved else "system_auto",
                "details": result,
            }
        except Exception as e:
            logger.error("Remediation execution failed: %s", str(e))
            self.rollback.revert_action(action_type, target_service, dry_run=effective_dry_run)
            return {
                "success": False,
                "executed": False,
                "error": f"Remediation failure: {str(e)}",
            }


# Singleton remediation executor with Docker connector
docker_connector = DockerConnector()
remediation_executor = RemediationExecutor(connector=docker_connector)
