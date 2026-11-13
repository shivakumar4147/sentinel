"""Client for Google Gemini structured generation using the official Google Gen AI SDK."""

import json
import logging
import os
from typing import TypeVar

from google import genai
from google.genai import types
from google.genai.errors import APIError
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
DEFAULT_TIMEOUT_SECONDS = 30.0

T = TypeVar("T", bound=BaseModel)


class GeminiError(Exception):
    """Base exception for all Gemini operations."""


class GeminiAPIError(GeminiError):
    """Raised when the Gemini API returns an error or cannot be reached."""


class GeminiResponseError(GeminiError):
    """Raised when the Gemini response is empty, blocked, or invalid."""


class GeminiMalformedJSONError(GeminiResponseError):
    """Raised when Gemini returns unparseable JSON."""


class GeminiValidationError(GeminiResponseError):
    """Raised when Gemini returns JSON that fails Pydantic schema validation."""


def _get_client(api_key: str | None = None) -> genai.Client:
    """Instantiate a Gemini client without exposing credentials."""
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key or not key.strip():
        raise GeminiAPIError("GEMINI_API_KEY environment variable is not set")
    return genai.Client(
        api_key=key.strip(),
        http_options=types.HttpOptions(timeout=DEFAULT_TIMEOUT_SECONDS),
    )


def generate_structured(
    prompt: str,
    response_schema: type[T],
    system_instruction: str | None = None,
    model: str | None = None,
    temperature: float = 0.0,
    max_output_tokens: int | None = None,
    client: genai.Client | None = None,
) -> T:
    """Generate structured output adhering to response_schema using Gemini.

    Validates that the returned text is valid JSON and strictly matches
    the supplied Pydantic response_schema.
    """
    model_name = model or os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)
    genai_client = client or _get_client()

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=response_schema,
        temperature=temperature,
    )
    if system_instruction:
        config.system_instruction = system_instruction
    if max_output_tokens:
        config.max_output_tokens = max_output_tokens

    try:
        response = genai_client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=config,
        )
    except APIError as exc:
        raise GeminiAPIError(f"Gemini API error: {exc.message}") from exc
    except Exception as exc:
        raise GeminiAPIError(f"Gemini request failed: {exc}") from exc

    try:
        text = response.text if hasattr(response, "text") else None
    except Exception as exc:
        raise GeminiResponseError(
            f"Failed to extract text from Gemini response: {exc}"
        ) from exc

    if not text or not text.strip():
        raise GeminiResponseError("Gemini returned an empty response")

    try:
        json_data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiMalformedJSONError(
            f"Gemini returned malformed JSON: {exc.msg} (line {exc.lineno})"
        ) from exc

    try:
        return response_schema.model_validate(json_data)
    except ValidationError as exc:
        raise GeminiValidationError(
            f"Gemini output failed schema validation: {exc}"
        ) from exc

