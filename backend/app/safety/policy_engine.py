"""Deterministic Safety Policy Engine.

Enforces strict safety invariants:
1. Whitelist validation: AI cannot invent actions outside the catalog.
2. Parameter validation: Targets must be valid known services.
3. Deterministic approval gates: Medium and High risk actions require human authorization.
4. Dry-run enforcement.
"""

import logging
from typing import List, Optional
from pydantic import BaseModel

from app.core.config import settings
from app.safety.risk_assessment import RiskLevel, assess_action_risk

logger = logging.getLogger("sentinel.safety.policy_engine")


class PolicyEvaluationResult(BaseModel):
    is_allowed: bool
    action_type: str
    target_service: str
    risk_level: RiskLevel
    requires_approval: bool
    dry_run: bool
    rejection_reason: Optional[str] = None


class SafetyPolicyEngine:
    def __init__(self, whitelisted_actions: Optional[List[str]] = None):
        self.whitelisted_actions = set(whitelisted_actions or settings.WHITELISTED_ACTIONS)

    def evaluate(
        self,
        recommended_action: str,
        target_service: str,
        ai_risk_level: str,
        confidence: float,
    ) -> PolicyEvaluationResult:
        """Evaluates whether an action is permitted and whether it requires human approval."""
        action_clean = recommended_action.strip()

        # Rule 1: Action Whitelist Check
        if action_clean not in self.whitelisted_actions:
            logger.warning("SAFETY VIOLATION: Action '%s' is not in whitelist", action_clean)
            return PolicyEvaluationResult(
                is_allowed=False,
                action_type=action_clean,
                target_service=target_service,
                risk_level=RiskLevel.HIGH,
                requires_approval=True,
                dry_run=settings.SAFETY_DRY_RUN,
                rejection_reason=f"Action '{action_clean}' rejected: not present in permitted whitelist.",
            )

        # Rule 2: Compute Deterministic Risk Level
        computed_risk = assess_action_risk(
            action_type=action_clean,
            target_service=target_service,
            ai_risk_level=ai_risk_level,
            confidence=confidence,
        )

        # Rule 3: Determine Human Approval Requirement
        requires_approval = False
        if computed_risk == RiskLevel.HIGH and settings.REQUIRE_HUMAN_APPROVAL_FOR_HIGH:
            requires_approval = True
        elif computed_risk == RiskLevel.MEDIUM and settings.REQUIRE_HUMAN_APPROVAL_FOR_MEDIUM:
            requires_approval = True

        logger.info(
            "Policy Evaluation: Action '%s' on '%s' -> Risk: %s, Requires Approval: %s",
            action_clean,
            target_service,
            computed_risk.value,
            requires_approval,
        )

        return PolicyEvaluationResult(
            is_allowed=True,
            action_type=action_clean,
            target_service=target_service,
            risk_level=computed_risk,
            requires_approval=requires_approval,
            dry_run=settings.SAFETY_DRY_RUN,
            rejection_reason=None,
        )


# Global singleton policy engine
safety_engine = SafetyPolicyEngine()
