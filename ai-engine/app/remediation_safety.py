"""Deterministic safety checks for model-recommended remediation actions."""

from app.schemas import IncidentDiagnosis


UNKNOWN_CAUSE_PHRASES = (
    "none identified",
    "unknown",
    "undetermined",
)


def _has_unknown_root_cause(root_cause: str) -> bool:
    """Return whether the root cause indicates that no cause was identified."""
    lowered_root_cause = root_cause.casefold()
    return any(
        phrase in lowered_root_cause
        for phrase in UNKNOWN_CAUSE_PHRASES
    )


def apply_remediation_safety(
    diagnosis: IncidentDiagnosis,
) -> IncidentDiagnosis:
    """Block remediation when confidence or root-cause certainty is low.

    A blocked diagnosis keeps all original evidence and explanation fields.
    Only ``action`` and ``escalation`` are changed, and the original Pydantic
    model is never mutated.
    """
    should_block_action = (
        diagnosis.confidence < 0.6
        or _has_unknown_root_cause(diagnosis.root_cause)
    )
    if not should_block_action:
        return diagnosis

    return diagnosis.model_copy(
        update={
            "action": "none",
            "escalation": True,
        }
    )
