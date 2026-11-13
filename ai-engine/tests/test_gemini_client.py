"""Tests for the Google Gemini client and structured generation."""

import json
from unittest.mock import MagicMock, patch

import pytest
from pydantic import BaseModel

from app import gemini_client
from app.gemini_client import (
    GeminiAPIError,
    GeminiMalformedJSONError,
    GeminiResponseError,
    GeminiValidationError,
    generate_structured,
)
from app.schemas import (
    GeneratedTest,
    PatchProposal,
    PatchProposalReport,
    TestGenerationReport as ReportModel,
)


def _mock_response(text_content: str) -> MagicMock:
    """Create a mock GenerateContentResponse with text."""
    mock = MagicMock()
    mock.text = text_content
    return mock


def test_gemini_missing_api_key_raises_api_error(monkeypatch):
    """When GEMINI_API_KEY is not set, GeminiAPIError is raised."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(GeminiAPIError, match="GEMINI_API_KEY environment variable is not set"):
        generate_structured(
            prompt="test prompt",
            response_schema=PatchProposalReport,
        )


def test_gemini_valid_patch_proposal_report(monkeypatch):
    """Gemini client parses and validates a valid PatchProposalReport response."""
    monkeypatch.setenv("GEMINI_API_KEY", "test-key-12345")
    sample_payload = {
        "patches": [
            {
                "file_path": "checkout.py",
                "original_code": 'payment_method = request.get("paymentMethod").lower()',
                "replacement_code": 'payment_method = safe_lower(request.get("paymentMethod"))',
                "explanation": "Safely handle missing paymentMethod",
                "related_finding": "Missing null check",
                "confidence": 0.95,
            }
        ],
        "missing_information": [],
        "overall_confidence": 0.95,
    }
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = _mock_response(
        json.dumps(sample_payload)
    )

    result = generate_structured(
        prompt="Propose patch",
        response_schema=PatchProposalReport,
        client=mock_client,
    )

    assert isinstance(result, PatchProposalReport)
    assert len(result.patches) == 1
    assert result.patches[0].file_path == "checkout.py"
    assert result.patches[0].confidence == 0.95
    assert result.overall_confidence == 0.95


def test_gemini_valid_multiline_python_test_code(monkeypatch):
    """Gemini client parses multiline Python test code with quotes and dictionary literals."""
    monkeypatch.setenv("GEMINI_API_KEY", "test-key-12345")
    multiline_code = (
        'import pytest\n'
        'from demo.sample_checkout.checkout import handle_checkout\n\n'
        'def test_handle_checkout_success():\n'
        '    request = {"paymentMethod": "card", "amount": 100}\n'
        '    result = handle_checkout(request)\n'
        '    assert result["status"] == "accepted"\n'
        '    assert result["amount"] == 100\n'
    )
    sample_payload = {
        "tests": [
            {
                "file_path": "tests/test_checkout.py",
                "test_framework": "pytest",
                "test_code": multiline_code,
                "explanation": "Verify valid checkout flow with card",
                "related_finding": "None check",
                "confidence": 0.9,
            }
        ],
        "missing_information": [],
        "overall_confidence": 0.9,
    }
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = _mock_response(
        json.dumps(sample_payload)
    )

    result = generate_structured(
        prompt="Generate tests",
        response_schema=ReportModel,
        client=mock_client,
    )

    assert isinstance(result, ReportModel)
    assert len(result.tests) == 1
    test_obj = result.tests[0]
    assert test_obj.file_path == "tests/test_checkout.py"
    assert 'request = {"paymentMethod": "card", "amount": 100}' in test_obj.test_code
    assert 'assert result["status"] == "accepted"' in test_obj.test_code


def test_gemini_invalid_json_raises_malformed_json_error(monkeypatch):
    """Malformed non-JSON output from Gemini raises GeminiMalformedJSONError."""
    monkeypatch.setenv("GEMINI_API_KEY", "test-key-12345")
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = _mock_response(
        '{"patches": [{"file_path": "checkout.py", unclosed json...'
    )

    with pytest.raises(GeminiMalformedJSONError, match="malformed JSON"):
        generate_structured(
            prompt="Propose patch",
            response_schema=PatchProposalReport,
            client=mock_client,
        )


def test_gemini_schema_validation_failure_raises_validation_error(monkeypatch):
    """Valid JSON that fails Pydantic schema validation raises GeminiValidationError."""
    monkeypatch.setenv("GEMINI_API_KEY", "test-key-12345")
    # Missing required 'patches' and 'overall_confidence'
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = _mock_response(
        json.dumps({"unexpected_field": 123})
    )

    with pytest.raises(GeminiValidationError, match="failed schema validation"):
        generate_structured(
            prompt="Propose patch",
            response_schema=PatchProposalReport,
            client=mock_client,
        )


def test_gemini_empty_response_raises_response_error(monkeypatch):
    """Empty or whitespace-only response from Gemini raises GeminiResponseError."""
    monkeypatch.setenv("GEMINI_API_KEY", "test-key-12345")
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = _mock_response("   ")

    with pytest.raises(GeminiResponseError, match="empty response"):
        generate_structured(
            prompt="Propose patch",
            response_schema=PatchProposalReport,
            client=mock_client,
        )


def test_gemini_api_network_failure_raises_api_error(monkeypatch):
    """Network or API error when calling Gemini raises GeminiAPIError."""
    monkeypatch.setenv("GEMINI_API_KEY", "test-key-12345")
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = ConnectionResetError("Connection reset by peer")

    with pytest.raises(GeminiAPIError, match="Gemini request failed"):
        generate_structured(
            prompt="Propose patch",
            response_schema=PatchProposalReport,
            client=mock_client,
        )
