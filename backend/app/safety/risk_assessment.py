"""Deterministic Risk Assessment for suggested remediation actions."""

from enum import Enum
from typing import Dict, Any, List


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# Baseline risk mapping for permitted action types
BASE_ACTION_RISK_MAP: Dict[str, RiskLevel] = {
    "check_database_connectivity": RiskLevel.LOW,
    "clear_cache": RiskLevel.LOW,
    "restart_container": RiskLevel.MEDIUM,
    "scale_replicas": RiskLevel.MEDIUM,
    "rollback_deployment": RiskLevel.HIGH,
    "isolate_traffic": RiskLevel.HIGH,
}

# Critical stateful services that automatically elevate risk
CRITICAL_SERVICES: List[str] = ["database", "postgres", "redis-primary", "auth-service"]


def assess_action_risk(
    action_type: str,
    target_service: str,
    ai_risk_level: str,
    confidence: float,
) -> RiskLevel:
    """Deterministically calculates risk level.

    Safety Rule: The final risk level is the HIGHEST between:
    1. Base action risk
    2. AI claimed risk
    3. Target service criticality elevation
    4. Confidence threshold penalty (confidence < 0.7 elevates risk)
    """
    # 1. Start with base action risk
    base_risk = BASE_ACTION_RISK_MAP.get(action_type, RiskLevel.HIGH)

    # 2. Check target criticality
    target_lower = target_service.lower()
    is_critical = any(crit in target_lower for crit in CRITICAL_SERVICES)

    # Risk ranking helper
    rank = {RiskLevel.LOW: 1, RiskLevel.MEDIUM: 2, RiskLevel.HIGH: 3}

    current_rank = rank.get(base_risk, 3)

    # AI suggested rank
    ai_rank = rank.get(RiskLevel(ai_risk_level.lower()), 2) if ai_risk_level.lower() in rank else 3
    current_rank = max(current_rank, ai_rank)

    # Criticality elevation: restarting a DB is high risk
    if is_critical and current_rank < 3:
        current_rank = 3

    # Low AI confidence elevates risk
    if confidence < 0.75 and current_rank < 2:
        current_rank = 2

    # Map back to enum
    inv_rank = {1: RiskLevel.LOW, 2: RiskLevel.MEDIUM, 3: RiskLevel.HIGH}
    return inv_rank[current_rank]
