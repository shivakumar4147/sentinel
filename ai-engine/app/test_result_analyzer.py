"""Analyze test output without executing tests or modifying repositories."""

from collections.abc import Sequence

from app.schemas import (
    CodeInspectionFinding,
    ProposedPatch,
    TestResultAnalysis as AnalysisModel,
)
from app.test_result_prompt import build_test_result_prompt
from app.test_result_router import analyze_test_results_with_model


def analyze_test_results(
    raw_test_output: str,
    incident_description: str | None = None,
    findings: Sequence[CodeInspectionFinding] = (),
    patches: Sequence[ProposedPatch] = (),
) -> AnalysisModel:
    """Return a structured analysis of supplied test output.

    This function only analyzes text. It never runs tests, commands, source
    code, patches, or remediation actions.
    """
    if not raw_test_output.strip():
        return AnalysisModel(
            summary="No test output was supplied",
            passed_count=0,
            failed_count=0,
            skipped_count=0,
            failures=[],
            incident_relevance="Unknown because no test output was supplied",
            recommended_next_steps=["Run the relevant tests externally"],
            missing_information=["Test output"],
            confidence=0,
        )

    prompt = build_test_result_prompt(
        raw_test_output,
        incident_description=incident_description,
        findings=findings,
        patches=patches,
    )
    return analyze_test_results_with_model(prompt)
