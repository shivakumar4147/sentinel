"""Route incident diagnosis requests through the configured AI providers."""

import logging

from app import groq_client, ollama_client
from app.schemas import IncidentDiagnosis


logger = logging.getLogger(__name__)


def generate_response(prompt: str) -> IncidentDiagnosis:
    """Try Groq first and fall back to Ollama if Groq fails."""
    try:
        return groq_client.generate_response(prompt)
    except Exception as groq_error:
        logger.warning(
            "Groq diagnosis failed; trying Ollama fallback: %s",
            groq_error,
            exc_info=True,
        )

    try:
        return ollama_client.generate_response(prompt)
    except Exception as ollama_error:
        raise RuntimeError(
            "Both Groq and Ollama diagnosis providers failed"
        ) from ollama_error
