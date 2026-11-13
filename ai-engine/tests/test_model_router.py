from unittest.mock import patch

import pytest

from app.model_router import generate_response
from app.schemas import IncidentDiagnosis


def make_diagnosis() -> IncidentDiagnosis:
    """Create a valid diagnosis for provider-routing tests."""
    return IncidentDiagnosis(
        summary="Database outage",
        root_cause="Database unavailable",
        supporting_evidence=["Connection refused"],
        contradicting_evidence=[],
        confidence=0.8,
        action="investigate_dependency",
        escalation=False,
        missing_information=[],
    )


def test_groq_success_does_not_call_ollama():
    diagnosis = make_diagnosis()

    with patch(
        "app.model_router.groq_client.generate_response",
        return_value=diagnosis,
    ) as groq:
        with patch("app.model_router.ollama_client.generate_response") as ollama:
            result = generate_response("incident evidence")

    assert result is diagnosis
    groq.assert_called_once_with("incident evidence")
    ollama.assert_not_called()


def test_groq_failure_uses_ollama_fallback():
    diagnosis = make_diagnosis()

    with patch(
        "app.model_router.groq_client.generate_response",
        side_effect=ValueError("Groq unavailable"),
    ) as groq:
        with patch(
            "app.model_router.ollama_client.generate_response",
            return_value=diagnosis,
        ) as ollama:
            result = generate_response("incident evidence")

    assert result is diagnosis
    groq.assert_called_once_with("incident evidence")
    ollama.assert_called_once_with("incident evidence")


def test_both_provider_failures_raise_clear_error_with_cause():
    ollama_error = ConnectionError("Ollama unavailable")

    with patch(
        "app.model_router.groq_client.generate_response",
        side_effect=ValueError("Groq unavailable"),
    ):
        with patch(
            "app.model_router.ollama_client.generate_response",
            side_effect=ollama_error,
        ):
            with pytest.raises(
                RuntimeError,
                match="Both Groq and Ollama diagnosis providers failed",
            ) as error:
                generate_response("incident evidence")

    assert error.value.__cause__ is ollama_error
