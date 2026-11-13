"""Orchestrate Sentinel's evidence-to-diagnosis investigation flow."""

from collections.abc import Mapping
from typing import Any

from requests import RequestException

from app.evidence import process_evidence
from app.model_router import generate_response
from app.prompt_builder import build_incident_prompt
from app.remediation_safety import apply_remediation_safety
from app.schemas import IncidentDiagnosis


class IncidentInvestigationError(Exception):
    """Raised when an incident cannot be turned into a diagnosis."""


def investigate_incident(
    incident: Mapping[str, Any],
    max_logs: int = 20,
) -> IncidentDiagnosis:
    """Process one structured incident and return its validated diagnosis.

    The input mapping should contain ``description`` (or
    ``incident_description``) and ``logs``. Other evidence fields are
    optional and accept either short or descriptive names. This function
    only investigates the incident and never executes the diagnosis action.
    """
    if not isinstance(incident, Mapping):
        raise IncidentInvestigationError("Incident input must be a mapping")

    try:
        description = (
            incident["description"]
            if "description" in incident
            else incident["incident_description"]
        )
        raw_logs = incident["logs"]
    except (KeyError, TypeError) as error:
        raise IncidentInvestigationError(
            "Incident input must include description and logs"
        ) from error

    if not isinstance(description, str):
        raise IncidentInvestigationError(
            "Incident description must be a string"
        )
    if not isinstance(raw_logs, list):
        raise IncidentInvestigationError("Incident logs must be a list")
    if not all(isinstance(log, str) for log in raw_logs):
        raise IncidentInvestigationError("Incident logs must contain strings")

    try:
        processed_logs = process_evidence(raw_logs, max_logs=max_logs)
        prompt = build_incident_prompt(
            description,
            processed_logs,
            incident.get("metrics"),
            incident.get(
                "deployment",
                incident.get("deployment_information"),
            ),
            incident.get(
                "dependencies",
                incident.get("dependency_information"),
            ),
        )
        diagnosis = generate_response(prompt)
        return apply_remediation_safety(diagnosis)
    except (
        KeyError,
        RequestException,
        RuntimeError,
        TypeError,
        ValueError,
    ) as error:
        raise IncidentInvestigationError(
            "Unable to investigate incident"
        ) from error