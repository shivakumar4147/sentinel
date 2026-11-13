"""Coordinate Sentinel's recommendation-only investigation stages."""

import logging
from pathlib import Path
from typing import Final

from app.code_inspector import (
    CollectedSourceFile,
    collect_source_files,
    inspect_source_files,
)
from app.docker_investigator import investigate_docker
from app.investigator import IncidentInvestigationError, investigate_incident
from app.patch_generator import generate_patches
from app.schemas import (
    FullInvestigationReport,
    FullInvestigationRequest,
    WorkflowStageStatus,
)
from app.test_generator import generate_tests
from app.test_result_analyzer import analyze_test_results


logger = logging.getLogger(__name__)
WORKFLOW_STAGE_ERROR: Final = "Stage could not be completed"


class FullInvestigationError(Exception):
    """Raised when the required diagnosis stage cannot be completed."""


def _status(status: str, error: str | None = None) -> WorkflowStageStatus:
    """Create a public stage status without exposing internal exceptions."""
    return WorkflowStageStatus(status=status, error=error)


def _approved_repository(
    repository_root: str,
    approved_workspace: str | Path | None,
) -> Path:
    """Resolve a repository and require it to remain in the approved workspace."""
    root = Path(repository_root).resolve()
    workspace = Path(approved_workspace or Path.cwd()).resolve()
    try:
        root.relative_to(workspace)
    except ValueError as error:
        raise ValueError("repository root is outside the approved workspace") from error
    return root


def run_full_investigation(
    request: FullInvestigationRequest,
    approved_workspace: str | Path | None = None,
) -> FullInvestigationReport:
    """Run diagnosis and any requested analysis stages.

    Only the diagnosis is required. Source collection and every later stage
    are read-only recommendations and are independently reported as skipped or
    failed when their optional inputs are absent or unavailable.
    """
    incident = {
        "description": request.description,
        "logs": request.logs,
        "metrics": request.metrics,
        "deployment": request.deployment,
        "dependencies": request.dependencies,
    }
    try:
        diagnosis = investigate_incident(incident, max_logs=request.max_logs)
    except IncidentInvestigationError as error:
        raise FullInvestigationError(
            "Unable to complete incident diagnosis"
        ) from error

    statuses = {
        "diagnosis": _status("succeeded"),
        "code_inspection": _status("skipped"),
        "patch_generation": _status("skipped"),
        "test_generation": _status("skipped"),
        "test_result_analysis": _status("skipped"),
    }
    code_report = None
    patch_report = None
    test_report = None
    result_analysis = None
    docker_report = None

    source_files: list[CollectedSourceFile] = []
    selected_file_paths = request.source_files or request.selected_file_paths
    if request.repository_root and selected_file_paths:
        try:
            repository_root = _approved_repository(
                request.repository_root,
                approved_workspace,
            )
            source_files = collect_source_files(
                repository_root,
                selected_file_paths,
            )
            code_report = inspect_source_files(
                repository_root,
                selected_file_paths,
                incident_description=request.description,
            )
            statuses["code_inspection"] = _status("succeeded")
        except Exception:
            logger.exception("Code inspection stage failed")
            statuses["code_inspection"] = _status(
                "failed",
                WORKFLOW_STAGE_ERROR,
            )
    elif request.repository_root or selected_file_paths:
        statuses["code_inspection"] = _status(
            "failed",
            "Repository root and selected file paths are both required",
        )

    if code_report and code_report.findings:
        try:
            patch_report = generate_patches(
                code_report.findings,
                source_files,
            )
            statuses["patch_generation"] = _status("succeeded")
        except Exception:
            logger.exception("Patch generation stage failed")
            statuses["patch_generation"] = _status(
                "failed",
                WORKFLOW_STAGE_ERROR,
            )

        try:
            test_report = generate_tests(
                source_files,
                code_report.findings,
                patch_report.patches if patch_report else [],
            )
            statuses["test_generation"] = _status("succeeded")
        except Exception:
            logger.exception("Test generation stage failed")
            statuses["test_generation"] = _status(
                "failed",
                WORKFLOW_STAGE_ERROR,
            )

    if request.test_output is not None:
        try:
            result_analysis = analyze_test_results(
                request.test_output,
                incident_description=request.description,
                findings=code_report.findings if code_report else (),
                patches=patch_report.patches if patch_report else (),
            )
            statuses["test_result_analysis"] = _status("succeeded")
        except Exception:
            statuses["test_result_analysis"] = _status(
                "failed",
                WORKFLOW_STAGE_ERROR,
            )

    if request.docker_enabled:
        statuses["docker_investigation"] = _status("skipped")
        try:
            docker_report = investigate_docker(
                incident_description=request.description,
                logs=request.logs,
                metrics=request.metrics,
                deployment=request.deployment,
                dependencies=request.dependencies,
                container_names=request.docker_container_names,
                require_health_checks=request.docker_require_health_checks,
            )
            statuses["docker_investigation"] = _status("succeeded")
        except Exception:
            logger.exception("Docker investigation stage failed")
            statuses["docker_investigation"] = _status(
                "failed",
                WORKFLOW_STAGE_ERROR,
            )

    return FullInvestigationReport(
        diagnosis=diagnosis,
        code_inspection=code_report,
        patch_generation=patch_report,
        test_generation=test_report,
        test_result_analysis=result_analysis,
        docker_investigation=docker_report,
        stage_status=statuses,
    )
