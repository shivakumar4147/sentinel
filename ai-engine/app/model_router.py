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


def generate_response(prompt: str) -> IncidentDiagnosis:
    """Try Gemini first and fall back to Ollama if Gemini fails."""
    try:
        return _generate_gemini_response(prompt)
    except Exception as gemini_error:
        logger.warning(
            "Gemini diagnosis failed; trying Ollama fallback: %s",
            gemini_error,
            exc_info=True,
        )

    try:
        return ollama_client.generate_response(prompt)
    except Exception as ollama_error:
        raise RuntimeError(
            "Both Gemini and Ollama diagnosis providers failed"
        ) from ollama_error
