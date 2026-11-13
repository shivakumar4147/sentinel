import json
from unittest.mock import patch

import pytest

from app.code_inspection_router import (
    _validate_response,
    generate_code_inspection,
)
from app.code_inspector import inspect_source_files
from app.schemas import CodeInspectionFinding, CodeInspectionReport


def make_report() -> CodeInspectionReport:
    """Create a valid mocked code inspection report."""
    return CodeInspectionReport(
        findings=[
            CodeInspectionFinding(
                file_path="app.py",
                start_line=1,
                end_line=1,
                severity="medium",
                title="Unhandled failure",
                description="The operation can fail without handling.",
                evidence=["1: result = call()"],
                recommendation="Handle the operation failure.",
                confidence=0.8,
            )
        ],
        files_inspected=["app.py"],
        missing_information=[],
    )


def test_code_inspection_schema_closes_every_object():
    schema = CodeInspectionReport.model_json_schema()

    def assert_closed(value):
        if isinstance(value, dict):
            if value.get("type") == "object":
                assert value.get("additionalProperties") is False
            for nested in value.values():
                assert_closed(nested)
        elif isinstance(value, list):
            for nested in value:
                assert_closed(nested)

    assert_closed(schema)


def test_valid_structured_inspection_response_is_parsed():
    content = json.dumps(make_report().model_dump())

    result = _validate_response(content, "Groq")

    assert result == make_report()


def test_truncated_inspection_response_fails_safely():
    with pytest.raises(
        ValueError,
        match="Ollama returned invalid code inspection JSON",
    ):
        _validate_response('{"findings": [', "Ollama")


def test_inspection_returns_valid_findings_without_modifying_source(tmp_path):
    source_file = tmp_path / "app.py"
    original = "result = call()\n"
    source_file.write_text(original, encoding="utf-8")

    with patch(
        "app.code_inspection_router.generate_code_inspection",
        return_value=make_report(),
    ):
        report = inspect_source_files(tmp_path, ["app.py"])

    assert report.findings[0].file_path == "app.py"
    assert source_file.read_text(encoding="utf-8") == original


def test_inspection_rejects_out_of_range_line_reference(tmp_path):
    source_file = tmp_path / "app.py"
    source_file.write_text("result = call()\n", encoding="utf-8")
    invalid_report = make_report().model_copy(
        update={
            "findings": [
                make_report().findings[0].model_copy(
                    update={"start_line": 2, "end_line": 2}
                )
            ]
        }
    )

    with patch(
        "app.code_inspection_router.generate_code_inspection",
        return_value=invalid_report,
    ):
        with pytest.raises(
            ValueError,
            match="inspection finding references a missing line",
        ):
            inspect_source_files(tmp_path, ["app.py"])


def test_empty_source_input_returns_report_without_provider_call(tmp_path):
    with patch(
        "app.code_inspection_router.generate_code_inspection"
    ) as generate:
        report = inspect_source_files(tmp_path, [])

    assert report.findings == []
    assert report.files_inspected == []
    assert report.missing_information == ["No source files were supplied"]
    generate.assert_not_called()


def test_router_uses_ollama_when_groq_fails():
    report = make_report()
    with patch(
        "app.code_inspection_router._generate_groq_response",
        side_effect=ValueError("malformed response"),
    ):
        with patch(
            "app.code_inspection_router._generate_ollama_response",
            return_value=report,
        ) as ollama:
            result = generate_code_inspection("source prompt")

    assert result is report
    ollama.assert_called_once_with("source prompt")


def test_router_raises_when_both_providers_fail():
    ollama_error = ConnectionError("Ollama unavailable")
    with patch(
        "app.code_inspection_router._generate_groq_response",
        side_effect=ValueError("malformed response"),
    ):
        with patch(
            "app.code_inspection_router._generate_ollama_response",
            side_effect=ollama_error,
        ):
            with pytest.raises(
                RuntimeError,
                match="Both Groq and Ollama code inspection providers failed",
            ) as error:
                generate_code_inspection("source prompt")

    assert error.value.__cause__ is ollama_error
