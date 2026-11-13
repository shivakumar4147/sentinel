
from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Literal, Union


class IncidentDiagnosis(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: str = Field(description="Short incident summary")

    root_cause: str = Field(
        description="Most likely cause of the incident"
    )

    supporting_evidence: list[str] = Field(
        description="Evidence supporting the root cause"
    )

    contradicting_evidence: list[str] = Field(
        description="Evidence contradicting the root cause"
    )

    confidence: float = Field(
        ge=0,
        le=1,
        description="Estimated confidence between 0 and 1"
    )

    action: Literal[
        "restart_service",
        "rollback_deployment",
        "restore_configuration",
        "investigate_dependency",
        "none"
    ]

    escalation: bool = Field(
        description="Whether human intervention is required"
    )

    missing_information: list[str] = Field(
        description="Additional information needed for diagnosis"
    )


class CodeInspectionFinding(BaseModel):
    """A source-code issue and a recommendation for addressing it."""

    model_config = ConfigDict(extra="forbid")

    file_path: str
    start_line: int = Field(ge=1)
    end_line: int = Field(ge=1)
    severity: Literal["info", "low", "medium", "high", "critical"]
    title: str
    description: str
    evidence: list[str]
    recommendation: str
    confidence: float = Field(ge=0, le=1)

    @model_validator(mode="after")
    def validate_line_range(self) -> "CodeInspectionFinding":
        """Ensure the finding's ending line is not before its starting line."""
        if self.end_line < self.start_line:
            raise ValueError("end_line must be greater than or equal to start_line")
        return self


class CodeInspectionReport(BaseModel):
    """Structured results from inspecting one or more source files."""

    model_config = ConfigDict(extra="forbid")

    findings: list[CodeInspectionFinding]
    files_inspected: list[str]
    missing_information: list[str]


class ProposedPatch(BaseModel):
    """A suggested unified diff that is not applied automatically."""

    model_config = ConfigDict(extra="forbid")

    file_path: str
    unified_diff: str
    explanation: str
    related_finding: Union[str, None]
    confidence: float = Field(ge=0, le=1)


class PatchProposal(BaseModel):
    """Strict model output containing source snippets for one patch.

    All properties are required for Groq strict structured output.
    Use nullable types (Union[str, None]) rather than optional fields.
    """

    model_config = ConfigDict(extra="forbid")

    file_path: str
    original_code: str
    replacement_code: str
    explanation: str
    related_finding: Union[str, None]
    confidence: float = Field(ge=0, le=1)


class PatchProposalReport(BaseModel):
    """Strict provider response used before deterministic diff generation."""

    model_config = ConfigDict(extra="forbid")

    patches: list[PatchProposal]
    missing_information: list[str]
    overall_confidence: float = Field(ge=0, le=1)


class PatchGenerationReport(BaseModel):
    """Patch recommendations generated from inspected source evidence."""

    model_config = ConfigDict(extra="forbid")

    patches: list[ProposedPatch]
    missing_information: list[str]
    overall_confidence: float = Field(ge=0, le=1)


class GeneratedTest(BaseModel):
    """A suggested regression test that is not written or executed."""

    model_config = ConfigDict(extra="forbid")

    file_path: str
    test_framework: str
    test_code: str
    explanation: str
    related_finding: str
    confidence: float = Field(ge=0, le=1)


class TestGenerationReport(BaseModel):
    """Test recommendations generated from source and inspection evidence."""

    model_config = ConfigDict(extra="forbid")

    tests: list[GeneratedTest]
    missing_information: list[str]
    overall_confidence: float = Field(ge=0, le=1)


class TestFailureDetail(BaseModel):
    """Evidence-backed analysis of one observed test failure."""

    model_config = ConfigDict(extra="forbid")

    test_name: str
    failure_type: str
    explanation: str
    relevant_evidence: list[str]
    related_finding: str | None
    confidence: float = Field(ge=0, le=1)


class TestResultAnalysis(BaseModel):
    """Structured analysis of supplied test-run output."""

    model_config = ConfigDict(extra="forbid")

    summary: str
    passed_count: int = Field(ge=0)
    failed_count: int = Field(ge=0)
    skipped_count: int = Field(ge=0)
    failures: list[TestFailureDetail]
    incident_relevance: str
    recommended_next_steps: list[str]
    missing_information: list[str]
    confidence: float = Field(ge=0, le=1)


class FullInvestigationRequest(BaseModel):
    """Request for the optional end-to-end investigation workflow."""

    description: str = Field(min_length=1)
    logs: list[str] = Field(default_factory=list)
    metrics: object | None = None
    deployment: object | None = None
    dependencies: object | None = None
    max_logs: int = Field(default=20, ge=0)
    repository_root: str | None = None
    source_files: list[str] = Field(default_factory=list)
    selected_file_paths: list[str] = Field(default_factory=list)
    test_output: str | None = None
    docker_enabled: bool = False
    docker_container_names: list[str] = Field(default_factory=list)
    docker_require_health_checks: bool = True


class WorkflowStageStatus(BaseModel):
    """Public status for one workflow stage without internal error details."""

    status: Literal["succeeded", "skipped", "failed"]
    error: str | None = None


class DockerContainerEvidence(BaseModel):
    """Observed, read-only state for one Docker container."""

    model_config = ConfigDict(extra="forbid")

    name: str
    status: str
    health_status: str
    image: str | None
    uptime_seconds: float | None


class DockerInvestigationReport(BaseModel):
    """Condition-aware Docker assessment and advisory recommendation."""

    model_config = ConfigDict(extra="forbid")

    overall_status: Literal["unknown", "healthy", "unhealthy"]
    condition: Literal[
        "DOCKER_OFFLINE",
        "SERVICE_UNHEALTHY",
        "ALL_SERVICES_HEALTHY",
        "NO_SERVICES_FOUND",
    ]
    root_cause: str | None
    confidence: float = Field(ge=0, le=1)
    evidence: list[str]
    anomalies: list[str]
    recommended_action: Literal[
        "restart_service",
        "rollback_deployment",
        "restore_configuration",
        "investigate_dependency",
        "none",
    ]
    requires_approval: bool
    explanation: str
    verification: list[str]
    containers: list[DockerContainerEvidence] | None


class FullInvestigationReport(BaseModel):
    """Combined recommendation-only results from the workflow stages."""

    diagnosis: IncidentDiagnosis
    code_inspection: CodeInspectionReport | None = None
    patch_generation: PatchGenerationReport | None = None
    test_generation: TestGenerationReport | None = None
    test_result_analysis: TestResultAnalysis | None = None
    docker_investigation: DockerInvestigationReport | None = None
    stage_status: dict[str, WorkflowStageStatus]
