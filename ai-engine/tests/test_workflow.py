from unittest.mock import patch

import pytest

from app import schemas
from app.code_inspector import CollectedSourceFile
from app.schemas import (
    CodeInspectionFinding,
    CodeInspectionReport,
    FullInvestigationRequest,
    IncidentDiagnosis,
    PatchGenerationReport,
    ProposedPatch,
)
from app.investigator import IncidentInvestigationError
from app.workflow import FullInvestigationError, run_full_investigation


def make_diagnosis() -> IncidentDiagnosis:
    """Create a valid incident diagnosis for workflow tests."""
    return IncidentDiagnosis(
        summary="Service outage",
        root_cause="Dependency timeout",
        supporting_evidence=["timeout"],
        contradicting_evidence=[],
        confidence=0.8,
        action="investigate_dependency",
        escalation=False,
        missing_information=[],
    )


def make_finding() -> CodeInspectionFinding:
    """Create a valid code finding for workflow tests."""
    return CodeInspectionFinding(
        file_path="app.py",
        start_line=1,
        end_line=1,
        severity="medium",
        title="Unhandled failure",
        description="The call can fail without handling.",
        evidence=["1: call()"],
        recommendation="Handle the failure.",
        confidence=0.8,
    )


def make_code_report() -> CodeInspectionReport:
    """Create a valid inspection report for workflow tests."""
    return CodeInspectionReport(
        findings=[make_finding()],
        files_inspected=["app.py"],
        missing_information=[],
    )


def make_patch_report() -> PatchGenerationReport:
    """Create a valid patch report for workflow tests."""
    return PatchGenerationReport(
        patches=[
            ProposedPatch(
                file_path="app.py",
                unified_diff="--- a/app.py\n+++ b/app.py\n",
                explanation="Handle the failure.",
                related_finding="Unhandled failure",
                confidence=0.8,
            )
        ],
        missing_information=[],
        overall_confidence=0.8,
    )


def make_test_report() -> schemas.TestGenerationReport:
    """Create a valid test recommendation report for workflow tests."""
    return schemas.TestGenerationReport(
        tests=[],
        missing_information=[],
        overall_confidence=0.5,
    )


def make_result_analysis() -> schemas.TestResultAnalysis:
    """Create a valid test-result analysis for workflow tests."""
    return schemas.TestResultAnalysis(
        summary="Tests passed",
        passed_count=1,
        failed_count=0,
        skipped_count=0,
        failures=[],
        incident_relevance="No direct relevance",
        recommended_next_steps=[],
        missing_information=[],
        confidence=0.8,
    )


def test_full_workflow_runs_all_supplied_stages(tmp_path):
    request = FullInvestigationRequest(
        description="Service outage",
        logs=["timeout"],
        repository_root=str(tmp_path),
        source_files=["app.py"],
        test_output="1 passed",
    )
    source = CollectedSourceFile("app.py", "1: call()")
    with patch("app.workflow.investigate_incident", return_value=make_diagnosis()):
        with patch(
            "app.workflow.collect_source_files",
            return_value=[source],
        ):
            with patch(
                "app.workflow.inspect_source_files",
                return_value=make_code_report(),
            ):
                with patch(
                    "app.workflow.generate_patches",
                    return_value=make_patch_report(),
                ) as patches:
                    with patch(
                        "app.workflow.generate_tests",
                        return_value=make_test_report(),
                    ) as tests:
                        with patch(
                            "app.workflow.analyze_test_results",
                            return_value=make_result_analysis(),
                        ) as results:
                            report = run_full_investigation(
                                request,
                                approved_workspace=tmp_path,
                            )

    assert report.diagnosis.summary == "Service outage"
    assert report.code_inspection is not None
    assert report.patch_generation is not None
    assert report.test_generation is not None
    assert report.test_result_analysis is not None
    assert all(
        stage.status == "succeeded"
        for stage in report.stage_status.values()
    )
    patches.assert_called_once()
    tests.assert_called_once()
    results.assert_called_once()


def test_source_files_reach_code_inspection(tmp_path):
    request = FullInvestigationRequest(
        description="Service outage",
        repository_root=str(tmp_path),
        source_files=["app.py"],
    )
    source = CollectedSourceFile("app.py", "1: call()")
    report = make_code_report()
    with patch("app.workflow.investigate_incident", return_value=make_diagnosis()):
        with patch(
            "app.workflow.collect_source_files",
            return_value=[source],
        ) as collect:
            with patch(
                "app.workflow.inspect_source_files",
                return_value=report,
            ) as inspect:
                result = run_full_investigation(
                    request,
                    approved_workspace=tmp_path,
                )

    collect.assert_called_once_with(tmp_path, ["app.py"])
    inspect.assert_called_once_with(
        tmp_path,
        ["app.py"],
        incident_description="Service outage",
    )
    assert result.code_inspection is report


def test_diagnosis_only_workflow_skips_optional_stages():
    request = FullInvestigationRequest(
        description="Service outage",
        logs=["timeout"],
    )
    with patch("app.workflow.investigate_incident", return_value=make_diagnosis()):
        report = run_full_investigation(request)

    assert report.code_inspection is None
    assert report.patch_generation is None
    assert report.test_generation is None
    assert report.test_result_analysis is None
    assert report.stage_status["diagnosis"].status == "succeeded"
    assert report.stage_status["code_inspection"].status == "skipped"


def test_docker_stage_is_opt_in_and_returns_report():
    request = FullInvestigationRequest(
        description="Docker incident",
        logs=[],
        docker_enabled=True,
    )
    docker_report = {
        "overall_status": "unknown",
        "condition": "DOCKER_OFFLINE",
        "root_cause": None,
        "confidence": 0.2,
        "evidence": ["Docker connected: False"],
        "anomalies": ["Docker daemon connectivity or container discovery failed"],
        "recommended_action": "none",
        "requires_approval": False,
        "explanation": "Docker unavailable",
        "verification": ["Check Docker daemon connectivity"],
        "containers": None,
    }
    with patch("app.workflow.investigate_incident", return_value=make_diagnosis()):
        with patch(
            "app.workflow.investigate_docker",
            return_value=docker_report,
        ):
            report = run_full_investigation(request)

    assert report.docker_investigation.condition == "DOCKER_OFFLINE"
    assert report.stage_status["docker_investigation"].status == "succeeded"


def test_missing_repository_input_is_reported_without_running_inspection():
    request = FullInvestigationRequest(
        description="Service outage",
        logs=[],
        selected_file_paths=["app.py"],
    )
    with patch("app.workflow.investigate_incident", return_value=make_diagnosis()):
        report = run_full_investigation(request)

    assert report.stage_status["code_inspection"].status == "failed"
    assert report.code_inspection is None


def test_optional_stage_failure_does_not_hide_diagnosis(tmp_path, caplog):
    request = FullInvestigationRequest(
        description="Service outage",
        logs=[],
        repository_root=str(tmp_path),
        selected_file_paths=["app.py"],
    )
    with patch("app.workflow.investigate_incident", return_value=make_diagnosis()):
        with patch(
            "app.workflow.collect_source_files",
            side_effect=ValueError("inspection provider unavailable"),
        ):
            with patch("app.workflow.generate_patches") as patches:
                with patch("app.workflow.generate_tests") as tests:
                    with caplog.at_level("ERROR", logger="app.workflow"):
                        report = run_full_investigation(
                            request,
                            approved_workspace=tmp_path,
                        )

    assert report.diagnosis.root_cause == "Dependency timeout"
    assert report.stage_status["code_inspection"].status == "failed"
    assert report.stage_status["code_inspection"].error == (
        "Stage could not be completed"
    )
    assert "Code inspection stage failed" in caplog.text
    assert "inspection provider unavailable" in caplog.text
    patches.assert_not_called()
    tests.assert_not_called()


def test_diagnosis_failure_is_a_workflow_error():
    request = FullInvestigationRequest(description="Outage", logs=[])
    with patch(
        "app.workflow.investigate_incident",
        side_effect=IncidentInvestigationError("provider secret details"),
    ):
        with pytest.raises(FullInvestigationError, match="diagnosis"):
            run_full_investigation(request)
