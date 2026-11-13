"""Generate read-only test recommendations from inspection evidence."""

from collections.abc import Sequence
from pathlib import PurePosixPath

from app.code_inspector import CollectedSourceFile
from app.schemas import (
    CodeInspectionFinding,
    GeneratedTest,
    ProposedPatch,
    TestGenerationReport as ReportModel,
)
from app.test_generation_prompt import build_test_generation_prompt
from app.test_generation_router import generate_test_report


def _validate_test_report(report: ReportModel) -> ReportModel:
    """Reject generated tests with unsafe or empty recommendation paths."""
    for generated_test in report.tests:
        path = PurePosixPath(generated_test.file_path)
        if path.is_absolute() or ".." in path.parts:
            raise ValueError(
                f"generated test path must be relative: "
                f"{generated_test.file_path}"
            )
        if not generated_test.test_code.strip():
            raise ValueError(
                f"generated test code is empty: {generated_test.file_path}"
            )
    return report


def generate_tests(
    source_files: Sequence[CollectedSourceFile],
    findings: Sequence[CodeInspectionFinding],
    patches: Sequence[ProposedPatch],
) -> ReportModel:
    """Return test recommendations without writing or executing test code."""
    if not findings:
        return ReportModel(
            tests=[],
            missing_information=["No code findings were supplied"],
            overall_confidence=0,
        )

    prompt = build_test_generation_prompt(source_files, findings, patches)
    report = generate_test_report(prompt)
    return _validate_test_report(report)
