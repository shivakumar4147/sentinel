"""Build compact prompts for Sentinel incident diagnosis."""

from collections.abc import Mapping, Sequence
from typing import Any


ALLOWED_ACTIONS = (
    "restart_service",
    "rollback_deployment",
    "restore_configuration",
    "investigate_dependency",
    "none",
)


def _evidence_lines(value: Any) -> list[str]:
    """Convert supported evidence values into unique, non-empty text lines."""
    if value is None:
        return []

    if isinstance(value, Mapping):
        values = [f"{key}={item}" for key, item in value.items()]
    elif isinstance(value, Sequence) and not isinstance(value, (str, bytes)):
        values = [str(item) for item in value]
    else:
        values = str(value).splitlines()

    lines: list[str] = []
    seen: set[str] = set()
    for item in values:
        line = str(item).strip()
        if line and line not in seen:
            lines.append(line)
            seen.add(line)
    return lines


def _format_section(label: str, value: Any, seen: set[str]) -> str:
    """Format one evidence section without adding empty placeholder text."""
    lines = [line for line in _evidence_lines(value) if line not in seen]
    seen.update(lines)
    if not lines:
        return f"{label}: none supplied"
    return f"{label}:\n" + "\n".join(f"- {line}" for line in lines)


def build_incident_prompt(
    incident_description: str,
    processed_logs: Sequence[str] | str,
    metrics: Any,
    deployment_information: Any,
    dependency_information: Any,
) -> str:
    """Create a concise, evidence-bound prompt for an IncidentDiagnosis.

    Metrics and the two information fields may be strings, sequences, or
    mappings. A mapping is rendered as ``key=value`` pairs to keep structured
    data readable without adding a serialization dependency.
    """
    description = incident_description.strip() or "Not supplied"
    seen_evidence: set[str] = set()
    sections = [
        f"Incident: {description}",
        _format_section("Logs", processed_logs, seen_evidence),
        _format_section("Metrics", metrics, seen_evidence),
        _format_section("Deployment", deployment_information, seen_evidence),
        _format_section("Dependencies", dependency_information, seen_evidence),
    ]
    actions = ", ".join(ALLOWED_ACTIONS)
    instructions = (
        "Diagnose using only the supplied evidence. Separate confirmed facts "
        "from hypotheses. Do not invent logs, metrics, or events. Lower "
        "confidence when evidence is insufficient. Recommend only one of "
        f"these actions: {actions}. When uncertain, investigate rather than "
        "perform risky remediation."
    )
    return "\n\n".join(sections) + f"\n\nInstructions: {instructions}"