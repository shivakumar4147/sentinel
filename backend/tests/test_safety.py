"""Tests for the Deterministic Safety Policy Engine."""

import pytest
from app.safety.policy_engine import SafetyPolicyEngine
from app.safety.risk_assessment import RiskLevel, assess_action_risk


def test_reject_unwhitelisted_actions():
    engine = SafetyPolicyEngine()
    result = engine.evaluate(
        recommended_action="drop_database",
        target_service="demo-api",
        ai_risk_level="low",
        confidence=0.95,
    )
    assert result.is_allowed is False
    assert "not present in permitted whitelist" in result.rejection_reason


def test_approve_whitelisted_action():
    engine = SafetyPolicyEngine()
    result = engine.evaluate(
        recommended_action="check_database_connectivity",
        target_service="demo-api",
        ai_risk_level="low",
        confidence=0.90,
    )
    assert result.is_allowed is True
    assert result.action_type == "check_database_connectivity"


def test_approval_required_for_medium_and_high_risk():
    engine = SafetyPolicyEngine()
    result = engine.evaluate(
        recommended_action="restart_container",
        target_service="demo-api",
        ai_risk_level="medium",
        confidence=0.85,
    )
    assert result.is_allowed is True
    assert result.requires_approval is True


def test_critical_service_elevates_risk():
    risk = assess_action_risk(
        action_type="restart_container",
        target_service="postgres-database",
        ai_risk_level="low",
        confidence=0.95,
    )
    # Restarting a database target should deterministically elevate to high risk
    assert risk == RiskLevel.HIGH

