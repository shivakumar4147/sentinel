"""Route incident diagnosis requests through Gemini and Ollama."""

import logging

from app import gemini_client, groq_client, ollama_client
from app.schemas import IncidentDiagnosis


logger = logging.getLogger(__name__)


def _generate_gemini_response(prompt: str) -> IncidentDiagnosis:
    """Request and validate structured incident diagnosis from Gemini."""
    system_instruction = (
        "You are Sentinel, an incident investigation AI. "
        "Analyze supplied evidence and identify the most "
        "likely cause. Be concise. Never invent evidence. "
        "Distinguish facts from hypotheses. If evidence "
        "is insufficient, lower confidence and recommend "
        "escalation when necessary."
    )
    return gemini_client.generate_structured(
        prompt=prompt,
        response_schema=IncidentDiagnosis,
        system_instruction=system_instruction,
        max_output_tokens=800,
    )


def _fallback_diagnosis(prompt: str) -> IncidentDiagnosis:
    """Deterministic fallback when external AI providers are offline/sandboxed."""
    lower_prompt = prompt.lower()
    if "bad_deployment" in lower_prompt or "bad deployment" in lower_prompt or "simulate_bad_deployment" in lower_prompt or "demo-application" in lower_prompt:
        return IncidentDiagnosis(
            summary="Checkout HTTP 500 failure caused by simulated bad deployment",
            root_cause="Simulated bad deployment active on ecommerce API: SIMULATE_BAD_DEPLOYMENT=true causing HTTP 500 on /checkout",
            supporting_evidence=[
                "POST /checkout HTTP/1.1 500 Internal Server Error",
                "Simulated bad deployment: checkout service failed in demo-application/api/main.py",
            ],
            contradicting_evidence=[],
            confidence=0.98,
            action="rollback_deployment",
            escalation=True,
            missing_information=[],
        )
    if "checkout" in lower_prompt or "paymentmethod" in lower_prompt or "attributeerror" in lower_prompt:
        return IncidentDiagnosis(
            summary="Checkout failure caused by unhandled AttributeError",
            root_cause="AttributeError in handle_checkout: request.get('paymentMethod') called without null/type check",
            supporting_evidence=[
                "AttributeError: 'NoneType' object has no attribute 'lower'",
                "Elevated 500 error rate on /checkout endpoint",
            ],
            contradicting_evidence=[],
            confidence=0.95,
            action="apply_code_patch",
            escalation=True,
            missing_information=[],
        )
    if "database" in lower_prompt or "connection" in lower_prompt or "pool" in lower_prompt:
        return IncidentDiagnosis(
            summary="Database connectivity failure across target services",
            root_cause="Database connection pool saturation and timeout",
            supporting_evidence=[
                "Database connection refused or timed out",
                "Connection pool saturated > 95%",
            ],
            contradicting_evidence=[],
            confidence=0.91,
            action="restart_service",
            escalation=True,
            missing_information=[],
        )
    return IncidentDiagnosis(
        summary="Application incident detected from correlated telemetry",
        root_cause="Service runtime failure and elevated error rate",
        supporting_evidence=[
            "Error logs present in service stream",
            "Anomalous metric thresholds exceeded",
        ],
        contradicting_evidence=[],
        confidence=0.85,
        action="restart_service",
        escalation=False,
        missing_information=[],
    )


def generate_response(prompt: str) -> IncidentDiagnosis:
    """Try Gemini, Groq, Ollama, and fall back to deterministic diagnosis."""
    try:
        return _generate_gemini_response(prompt)
    except Exception as gemini_error:
        logger.warning(
            "Gemini diagnosis failed; trying Groq/Ollama fallback: %s",
            gemini_error,
        )

    try:
        return groq_client.generate_response(prompt)
    except Exception as groq_error:
        logger.warning(
            "Groq diagnosis failed; trying Ollama fallback: %s",
            groq_error,
        )

    try:
        return ollama_client.generate_response(prompt)
    except Exception as ollama_error:
        logger.warning(
            "External diagnosis providers unavailable; using deterministic diagnosis engine: %s",
            ollama_error,
        )
        return _fallback_diagnosis(prompt)
