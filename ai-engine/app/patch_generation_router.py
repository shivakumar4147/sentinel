"""Route structured patch proposals through Gemini and Ollama."""

import logging
import os
import time

import requests
from groq import Groq

from app import gemini_client
from app.schemas import PatchProposalReport


logger = logging.getLogger(__name__)
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:4b")
MAX_PATCH_OUTPUT_TOKENS = 1500


def _dereference_schema(schema_dict: dict) -> dict:
    """Inline $defs into the schema so there are no unresolved $ref pointers."""
    defs = schema_dict.get("$defs", {})

    def _resolve(node):
        if isinstance(node, dict):
            if "$ref" in node:
                ref_name = node["$ref"].split("/")[-1]
                target = defs.get(ref_name, {})
                return _resolve(target)
            return {k: _resolve(v) for k, v in node.items() if k != "$defs"}
        if isinstance(node, list):
            return [_resolve(item) for item in node]
        return node

    return _resolve(schema_dict)


def _generate_gemini_patch_report(prompt: str) -> PatchProposalReport:
    """Request and validate a structured patch proposal from Gemini."""
    system_instruction = (
        "Propose minimal source patches from supplied evidence. "
        "Return concise structured JSON.  Never invent code.  "
        "Do NOT produce unified diff headers."
    )
    return gemini_client.generate_structured(
        prompt=prompt,
        response_schema=PatchProposalReport,
        system_instruction=system_instruction,
        max_output_tokens=MAX_PATCH_OUTPUT_TOKENS,
    )


def _generate_groq_patch_report(prompt: str) -> PatchProposalReport:
    """Request and validate a structured patch proposal from Groq."""
    client = Groq(
        api_key=os.getenv("GROQ_API_KEY"),
        timeout=30.0,
        max_retries=0,
    )
    schema = _dereference_schema(PatchProposalReport.model_json_schema())

    last_error: Exception | None = None
    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Propose minimal source patches from supplied evidence. "
                            "Return concise structured JSON.  Never invent code.  "
                            "Do NOT produce unified diff headers."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "patch_proposal_report",
                        "schema": schema,
                        "strict": True,
                    },
                },
                temperature=0 if attempt == 0 else 0.1,
                max_completion_tokens=MAX_PATCH_OUTPUT_TOKENS,
            )
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Groq returned an empty patch report")
            return PatchProposalReport.model_validate_json(content)
        except Exception as error:
            last_error = error
            logger.warning(
                "Groq patch generation attempt %d failed: %s",
                attempt + 1,
                error,
            )
            if attempt == 0:
                time.sleep(1)
                continue
            raise last_error from None


def _generate_ollama_patch_report(prompt: str) -> PatchProposalReport:
    """Request and validate a structured patch proposal from Ollama."""
    schema = _dereference_schema(PatchProposalReport.model_json_schema())
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Propose minimal source patches from supplied "
                        "evidence. Return concise JSON.  Never invent code.  "
                        "Do NOT produce unified diff headers."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "format": schema,
            "think": False,
            "stream": False,
            "options": {"temperature": 0, "num_predict": MAX_PATCH_OUTPUT_TOKENS},
        },
        timeout=600,
    )
    response.raise_for_status()
    content = response.json()["message"]["content"]
    if not content:
        raise ValueError("Ollama returned an empty patch report")
    logger.debug(
        "Ollama patch response received for validation (%d characters)",
        len(content),
    )
    return PatchProposalReport.model_validate_json(content)


def generate_patch_report(prompt: str) -> PatchProposalReport:
    """Try Gemini first and fall back to Ollama for patch proposals.

    Raises RuntimeError when both providers fail.  Does not silently
    return empty results on provider failures.
    """
    try:
        return _generate_gemini_patch_report(prompt)
    except gemini_client.GeminiResponseError as val_error:
        # Schema or JSON validation failed: avoid retrying identical malformed output
        logger.warning(
            "Gemini patch generation failed; trying Ollama fallback: %s (%s)",
            val_error,
            type(val_error).__name__,
        )
    except gemini_client.GeminiAPIError as api_error:
        logger.warning(
            "Gemini patch generation failed; trying Ollama fallback: %s",
            api_error,
        )
    except Exception as exc:
        logger.warning(
            "Gemini patch generation failed; trying Ollama fallback: %s",
            exc,
        )

    try:
        return _generate_ollama_patch_report(prompt)
    except Exception as ollama_error:
        raise RuntimeError(
            "Both Gemini and Ollama patch providers failed"
        ) from ollama_error
