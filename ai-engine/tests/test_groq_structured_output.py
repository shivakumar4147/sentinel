import json
from types import SimpleNamespace
from unittest.mock import patch

from app import groq_client, schemas
from app.code_inspection_router import _generate_groq_response
from app.patch_generation_router import _generate_groq_patch_report
from app.schemas import (
    CodeInspectionReport,
    IncidentDiagnosis,
    PatchGenerationReport,
    PatchProposalReport,
)
from app.test_generation_router import _generate_groq_test_report


def _groq_response(payload) -> SimpleNamespace:
    """Build the minimal mocked Groq response used by router tests."""
    return SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(
                    content=json.dumps(payload.model_dump())
                )
            )
        ]
    )


def _assert_strict_response_format(create_call):
    """Verify the exact strict JSON-schema request sent to Groq."""
    response_format = create_call.call_args.kwargs["response_format"]
    assert response_format["type"] == "json_schema"
    assert response_format["json_schema"]["strict"] is True
    schema = response_format["json_schema"]["schema"]
    assert schema["additionalProperties"] is False


def _assert_closed_schema(value):
    """Ensure every generated object is closed and fully required."""
    if isinstance(value, dict):
        if value.get("type") == "object":
            assert value.get("additionalProperties") is False
            assert set(value.get("required", [])) == set(
                value.get("properties", {})
            )
        for nested in value.values():
            _assert_closed_schema(nested)
    elif isinstance(value, list):
        for nested in value:
            _assert_closed_schema(nested)


def test_all_groq_response_schemas_are_strict_compatible():
    models = [
        IncidentDiagnosis,
        CodeInspectionReport,
        PatchGenerationReport,
        PatchProposalReport,
        schemas.TestGenerationReport,
        schemas.TestResultAnalysis,
    ]

    for model in models:
        _assert_closed_schema(model.model_json_schema())


def test_code_inspection_groq_request_is_strict():
    report = CodeInspectionReport(
        findings=[],
        files_inspected=[],
        missing_information=[],
    )
    with patch("app.code_inspection_router.Groq") as groq:
        groq.return_value.chat.completions.create.return_value = (
            _groq_response(report)
        )
        result = _generate_groq_response("inspect")

    assert result == report
    _assert_strict_response_format(
        groq.return_value.chat.completions.create
    )


def test_patch_groq_request_is_strict():
    report = PatchProposalReport(
        patches=[],
        missing_information=[],
        overall_confidence=0,
    )
    with patch("app.patch_generation_router.Groq") as groq:
        groq.return_value.chat.completions.create.return_value = (
            _groq_response(report)
        )
        result = _generate_groq_patch_report("patch")

    assert result == report
    _assert_strict_response_format(
        groq.return_value.chat.completions.create
    )


def test_test_generation_groq_request_is_strict():
    report = schemas.TestGenerationReport(
        tests=[],
        missing_information=[],
        overall_confidence=0,
    )
    with patch("app.test_generation_router.Groq") as groq:
        groq.return_value.chat.completions.create.return_value = (
            _groq_response(report)
        )
        result = _generate_groq_test_report("tests")

    assert result == report
    _assert_strict_response_format(
        groq.return_value.chat.completions.create
    )


def test_diagnosis_groq_request_is_strict():
    diagnosis = IncidentDiagnosis(
        summary="Outage",
        root_cause="Unknown",
        supporting_evidence=[],
        contradicting_evidence=[],
        confidence=0,
        action="none",
        escalation=True,
        missing_information=["logs"],
    )
    with patch("app.groq_client.Groq") as groq:
        groq.return_value.chat.completions.create.return_value = (
            _groq_response(diagnosis)
        )
        result = groq_client.generate_response("diagnose")

    assert result == diagnosis
    _assert_strict_response_format(
        groq.return_value.chat.completions.create
    )
