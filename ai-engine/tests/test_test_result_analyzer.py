from unittest.mock import patch

import pytest

from app.schemas import TestFailureDetail as FailureDetailModel
from app.test_result_analyzer import analyze_test_results
from app.test_result_router import analyze_test_results_with_model


def make_analysis():
    """Create a valid mocked passing/failing test analysis."""
    from app.schemas import TestResultAnalysis

    return TestResultAnalysis(
        summary="One test failed because the dependency was unavailable.",
        passed_count=3,
        failed_count=1,
        skipped_count=1,
        failures=[
            FailureDetailModel(
                test_name="test_database_connection",
                failure_type="AssertionError",
                explanation="The database was expected to be available.",
                relevant_evidence=["E   assert status == 'ready'"],
                related_finding="Database dependency is unavailable",
                confidence=0.85,
            )
        ],
        incident_relevance="The failure supports the database incident.",
        recommended_next_steps=["Check database health externally"],
        missing_information=[],
        confidence=0.8,
    )


def test_analyzes_passing_and_failing_output_without_writing_files(tmp_path):
    output = "3 passed, 1 failed, 1 skipped\nFAILED test_app.py::test_database"
    with patch(
        "app.test_result_analyzer.analyze_test_results_with_model",
        return_value=make_analysis(),
    ):
        analysis = analyze_test_results(output)

    assert analysis.passed_count == 3
    assert analysis.failed_count == 1
    assert analysis.failures[0].test_name == "test_database_connection"
    assert list(tmp_path.iterdir()) == []


def test_invalid_schema_output_is_rejected():
    with patch(
        "app.test_result_analyzer.analyze_test_results_with_model",
        side_effect=ValueError("malformed analysis"),
    ):
        with pytest.raises(ValueError, match="malformed analysis"):
            analyze_test_results("1 failed")


def test_empty_output_returns_uncertain_analysis_without_provider_call():
    with patch(
        "app.test_result_analyzer.analyze_test_results_with_model"
    ) as analyze:
        result = analyze_test_results("")

    assert result.failed_count == 0
    assert result.failures == []
    assert result.confidence == 0
    assert result.missing_information == ["Test output"]
    analyze.assert_not_called()


def test_both_providers_fail():
    ollama_error = ConnectionError("Ollama unavailable")
    with patch(
        "app.test_result_router._generate_groq_analysis",
        side_effect=ValueError("malformed output"),
    ):
        with patch(
            "app.test_result_router._generate_ollama_analysis",
            side_effect=ollama_error,
        ):
            with pytest.raises(
                RuntimeError,
                match="Both Groq and Ollama test-result analysis providers failed",
            ) as error:
                analyze_test_results_with_model("1 failed")

    assert error.value.__cause__ is ollama_error


def test_provider_fallback_uses_ollama():
    analysis = make_analysis()
    with patch(
        "app.test_result_router._generate_groq_analysis",
        side_effect=ValueError("malformed output"),
    ):
        with patch(
            "app.test_result_router._generate_ollama_analysis",
            return_value=analysis,
        ) as ollama:
            result = analyze_test_results_with_model("1 failed")

    assert result is analysis
    ollama.assert_called_once_with("1 failed")
