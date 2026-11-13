import pytest
from pydantic import ValidationError

from app.schemas import CodeInspectionFinding, CodeInspectionReport


def make_finding(**overrides) -> CodeInspectionFinding:
    """Create a valid code-inspection finding for schema tests."""
    values = {
        "file_path": "app/service.py",
        "start_line": 10,
        "end_line": 12,
        "severity": "medium",
        "title": "Unhandled database error",
        "description": "The database error is not handled.",
        "evidence": ["Database call has no exception handling."],
        "recommendation": "Handle the database exception explicitly.",
        "confidence": 0.9,
    }
    values.update(overrides)
    return CodeInspectionFinding(**values)


def test_valid_finding_and_report():
    finding = make_finding()

    report = CodeInspectionReport(
        findings=[finding],
        files_inspected=["app/service.py"],
        missing_information=[],
    )

    assert report.findings == [finding]
    assert report.files_inspected == ["app/service.py"]


@pytest.mark.parametrize("field", ["start_line", "end_line"])
def test_line_numbers_must_be_positive(field):
    with pytest.raises(ValidationError):
        make_finding(**{field: 0})


@pytest.mark.parametrize("confidence", [-0.1, 1.1])
def test_confidence_must_be_between_zero_and_one(confidence):
    with pytest.raises(ValidationError):
        make_finding(confidence=confidence)


def test_invalid_severity_is_rejected():
    with pytest.raises(ValidationError):
        make_finding(severity="urgent")


def test_end_line_cannot_be_before_start_line():
    with pytest.raises(ValidationError):
        make_finding(start_line=20, end_line=19)
