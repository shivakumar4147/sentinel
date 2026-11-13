"""Route structured code inspection requests through Gemini and Ollama."""

import logging
import os

from pydantic import ValidationError
import requests
from groq import Groq

from app import gemini_client
from app.schemas import CodeInspectionReport


logger = logging.getLogger(__name__)
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "qwen3.5:4b"
MAX_INSPECTION_OUTPUT_TOKENS = 1500


def _validate_response(content: str, provider: str) -> CodeInspectionReport:
    """Validate provider JSON and expose a clear malformed-output error."""
    try:
        return CodeInspectionReport.model_validate_json(content)
    except ValidationError as error:
        raise ValueError(
            f"{provider} returned invalid code inspection JSON"
        ) from error


def _generate_gemini_response(prompt: str) -> CodeInspectionReport:
    """Request and validate a structured code report from Gemini."""
    system_instruction = (
        "You inspect source code using only supplied evidence. "
        "Return concise structured JSON. Never invent findings."
    )
    return gemini_client.generate_structured(
        prompt=prompt,
        response_schema=CodeInspectionReport,
        system_instruction=system_instruction,
        max_output_tokens=MAX_INSPECTION_OUTPUT_TOKENS,
    )


def _generate_groq_response(prompt: str) -> CodeInspectionReport:
    """Request and validate a structured code report from Groq."""
    client = Groq(
        api_key=os.getenv("GROQ_API_KEY"),
        timeout=30.0,
        max_retries=0,
    )
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You inspect source code using only supplied evidence. "
                    "Return concise structured JSON. Never invent findings."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "code_inspection_report",
                "schema": CodeInspectionReport.model_json_schema(),
                "strict": True,
            },
        },
        temperature=0,
        max_completion_tokens=MAX_INSPECTION_OUTPUT_TOKENS,
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError("Groq returned an empty code inspection response")
    return _validate_response(content, "Groq")


def _generate_ollama_response(prompt: str) -> CodeInspectionReport:
    """Request and validate a structured code report from Ollama."""
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Inspect supplied source only. Return concise JSON "
                        "and never invent findings."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "format": CodeInspectionReport.model_json_schema(),
            "think": False,
            "stream": False,
            "options": {
                "temperature": 0,
                "num_predict": MAX_INSPECTION_OUTPUT_TOKENS,
            },
        },
        timeout=600,
    )
    response.raise_for_status()
    content = response.json()["message"]["content"]
    if not content:
        raise ValueError("Ollama returned an empty code inspection response")
    return _validate_response(content, "Ollama")


def generate_code_inspection(prompt: str) -> CodeInspectionReport:
    """Try Gemini first and fall back to Ollama for code inspection."""
    try:
        return _generate_gemini_response(prompt)
    except Exception as gemini_error:
        logger.warning(
            "Gemini code inspection failed; trying Ollama fallback: %s",
            gemini_error,
            exc_info=True,
        )

    try:
        return _generate_ollama_response(prompt)
    except Exception as ollama_error:
        raise RuntimeError(
            "Both Gemini and Ollama code inspection providers failed"
        ) from ollama_error
