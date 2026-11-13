from app.remediation_safety import apply_remediation_safety
from app.schemas import IncidentDiagnosis


def make_diagnosis(**overrides) -> IncidentDiagnosis:
    """Create a valid diagnosis for remediation safety tests."""
    values = {
        "summary": "API outage",
        "root_cause": "Database is unavailable",
        "supporting_evidence": ["Database connection refused"],
        "contradicting_evidence": [],
        "confidence": 0.9,
        "action": "restart_service",
        "escalation": False,
        "missing_information": [],
    }
    values.update(overrides)
    return IncidentDiagnosis(**values)


def test_low_confidence_blocks_action():
    diagnosis = make_diagnosis(confidence=0.59)

    safe_diagnosis = apply_remediation_safety(diagnosis)

    assert safe_diagnosis.action == "none"
    assert safe_diagnosis.escalation is True


def test_unknown_root_cause_blocks_action_even_with_high_confidence():
    diagnosis = make_diagnosis(
        root_cause="Unknown from the supplied evidence",
        confidence=0.95,
    )

    safe_diagnosis = apply_remediation_safety(diagnosis)

    assert safe_diagnosis.action == "none"
    assert safe_diagnosis.escalation is True


def test_high_confidence_identified_cause_preserves_action():
    diagnosis = make_diagnosis(confidence=0.8)

    safe_diagnosis = apply_remediation_safety(diagnosis)

    assert safe_diagnosis is diagnosis
    assert safe_diagnosis.action == "restart_service"
    assert safe_diagnosis.escalation is False


def test_original_diagnosis_is_not_mutated():
    diagnosis = make_diagnosis(confidence=0.4)

    safe_diagnosis = apply_remediation_safety(diagnosis)

    assert diagnosis.action == "restart_service"
    assert diagnosis.escalation is False
    assert safe_diagnosis is not diagnosis


def test_blocked_action_enables_escalation():
    diagnosis = make_diagnosis(root_cause="Cause is undetermined")

    safe_diagnosis = apply_remediation_safety(diagnosis)

    assert safe_diagnosis.escalation is True
