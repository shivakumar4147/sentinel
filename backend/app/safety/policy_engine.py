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
    def __init__(
        self,
        whitelisted_actions: Optional[List[str]] = None,
        allowed_targets: Optional[List[str]] = None,
    ):
        self.whitelisted_actions = set(whitelisted_actions or settings.WHITELISTED_ACTIONS)
        self.allowed_targets = set(
            target.strip().lower() for target in (allowed_targets or settings.ALLOWED_REMEDIATION_TARGETS)
        )

    def is_target_allowed(self, target_service: str) -> bool:
        """Checks if a target container/service is on the approved allowlist."""
        return (target_service or "").strip().lower() in self.allowed_targets

    def evaluate(
        self,
        recommended_action: Optional[str],
        target_service: str,
        ai_risk_level: str,
        confidence: float,
    ) -> PolicyEvaluationResult:
        """Evaluates whether an action is permitted and whether it requires human approval."""
        if not recommended_action or not recommended_action.strip() or recommended_action.strip().lower() in ("none", "null"):
            return PolicyEvaluationResult(
                is_allowed=False,
                action_type="none",
                target_service=target_service,
                risk_level=RiskLevel.LOW,
                requires_approval=False,
                dry_run=settings.SAFETY_DRY_RUN,
                rejection_reason="No remediation action specified or required.",
            )

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

        # Rule 2: Target Service Allowlist Check
        target_clean = (target_service or "").strip().lower()
        if not target_clean or target_clean not in self.allowed_targets:
            logger.warning("SAFETY VIOLATION: Target service '%s' is not in permitted allowlist", target_service)
            return PolicyEvaluationResult(
                is_allowed=False,
                action_type=action_clean,
                target_service=target_service,
                risk_level=RiskLevel.HIGH,
                requires_approval=True,
                dry_run=settings.SAFETY_DRY_RUN,
                rejection_reason=f"Target service '{target_service}' rejected: not present in permitted target allowlist.",
            )

        # Rule 3: Compute Deterministic Risk Level
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

