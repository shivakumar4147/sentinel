"""Route structured test-result analysis through Groq and Ollama."""

import logging
import os

import requests
from groq import Groq

from app.schemas import TestResultAnalysis as AnalysisModel


logger = logging.getLogger(__name__)
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "qwen3.5:4b"


def _generate_groq_analysis(prompt: str) -> AnalysisModel:
    """Request and validate structured test analysis from Groq."""
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
                    "Analyze supplied test output only. Return concise "
                    "structured JSON and never invent results."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "test_result_analysis",
                "schema": AnalysisModel.model_json_schema(),
                "strict": True,
            },
        },
        temperature=0,
        max_completion_tokens=700,
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError("Groq returned an empty test-result analysis")
    return AnalysisModel.model_validate_json(content)


def _generate_ollama_analysis(prompt: str) -> AnalysisModel:
    """Request and validate structured test analysis from Ollama."""
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Analyze supplied test output only. Return concise "
                        "JSON and never invent results."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "format": AnalysisModel.model_json_schema(),
            "think": False,
            "stream": False,
            "options": {"temperature": 0, "num_predict": 700},
        },
        timeout=600,
    )
    response.raise_for_status()
    content = response.json()["message"]["content"]
    if not content:
        raise ValueError("Ollama returned an empty test-result analysis")
    return AnalysisModel.model_validate_json(content)


def analyze_test_results_with_model(prompt: str) -> AnalysisModel:
    """Try Groq first and fall back to Ollama for test-result analysis."""
    try:
        return _generate_groq_analysis(prompt)
    except Exception:
        logger.warning(
            "Groq test-result analysis failed; trying Ollama fallback",
            exc_info=True,
        )

    try:
        return _generate_ollama_analysis(prompt)
    except Exception as ollama_error:
        raise RuntimeError(
            "Both Groq and Ollama test-result analysis providers failed"
        ) from ollama_error
