from unittest.mock import patch

import pytest

from app import schemas
from app.code_inspector import CollectedSourceFile
from app.schemas import (
    CodeInspectionFinding,
    GeneratedTest,
)
from app.test_generation_router import generate_test_report
from app.test_generator import generate_tests


def make_finding() -> CodeInspectionFinding:
    """Create a valid finding for test-generation tests."""
    return CodeInspectionFinding(
        file_path="app.py",
        start_line=1,
        end_line=1,
        severity="medium",
        title="Handle failure",
        description="The call can fail without handling.",
        evidence=["1: result = call()"],
        recommendation="Handle the failure.",
        confidence=0.9,
    )


def make_report() -> schemas.TestGenerationReport:
    """Create a valid mocked test-generation response."""
    return schemas.TestGenerationReport(
        tests=[
            GeneratedTest(
                file_path="tests/test_app.py",
                test_framework="pytest",
                test_code="def test_call_failure():\n    assert True",
                explanation="Covers the failure path.",
                related_finding="Handle failure",
                confidence=0.8,
            )
        ],
        missing_information=[],
        overall_confidence=0.8,
    )


def test_generates_valid_test_without_writing_source_or_test_files(tmp_path):
    source = CollectedSourceFile("app.py", "1: result = call()")
    original_content = source.content

    with patch(
        "app.test_generator.generate_test_report",
        return_value=make_report(),
    ):
        report = generate_tests([source], [make_finding()], [])

    assert report.tests[0].test_framework == "pytest"
    assert source.content == original_content
    assert list(tmp_path.iterdir()) == []


def test_invalid_output_is_rejected():
    source = CollectedSourceFile("app.py", "1: result = call()")
    with patch(
        "app.test_generator.generate_test_report",
        side_effect=ValueError("malformed test report"),
    ):
        with pytest.raises(ValueError, match="malformed test report"):
            generate_tests([source], [make_finding()], [])


def test_empty_findings_do_not_call_provider():
    with patch("app.test_generator.generate_test_report") as generate:
        report = generate_tests(
            [CollectedSourceFile("app.py", "1: result = call()")],
            [],
            [],
        )

    assert report.tests == []
    assert report.overall_confidence == 0
    generate.assert_not_called()


def test_provider_fallback_uses_ollama():
    report = make_report()
    with patch(
        "app.test_generation_router._generate_gemini_test_report",
        side_effect=ValueError("Gemini API error"),
    ):
        with patch(
            "app.test_generation_router._generate_ollama_test_report",
            return_value=report,
        ) as ollama:
            result = generate_test_report("test prompt")

    assert result is report
    ollama.assert_called_once_with("test prompt")


def test_gemini_success_does_not_call_ollama():
    report = make_report()
    with patch(
        "app.test_generation_router._generate_gemini_test_report",
        return_value=report,
    ):
        with patch(
            "app.test_generation_router._generate_ollama_test_report",
        ) as ollama:
            result = generate_test_report("test prompt")

    assert result is report
    ollama.assert_not_called()


def test_both_providers_fail_raises_runtime_error():
    with patch(
        "app.test_generation_router._generate_gemini_test_report",
        side_effect=ValueError("Gemini failed"),
    ):
        with patch(
            "app.test_generation_router._generate_ollama_test_report",
            side_effect=ConnectionError("Ollama failed"),
        ):
            with pytest.raises(
                RuntimeError,
                match="Both Gemini and Ollama test generation providers failed",
            ):
                generate_test_report("test prompt")


def test_absolute_generated_test_path_is_rejected():
    invalid_report = make_report().model_copy(
        update={
            "tests": [
                GeneratedTest(
                    file_path="/tmp/test_app.py",
                    test_framework="pytest",
                    test_code="def test_example():\n    pass",
                    explanation="Example",
                    related_finding="Handle failure",
                    confidence=0.5,
                )
            ]
        }
    )
    with patch(
        "app.test_generator.generate_test_report",
        return_value=invalid_report,
    ):
        with pytest.raises(ValueError, match="must be relative"):
            generate_tests(
                [CollectedSourceFile("app.py", "1: result = call()")],
                [make_finding()],
                [],
            )
