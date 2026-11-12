"""Pydantic request and response schemas for Sentinel API."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# =====================================================================
# AI INVESTIGATION CONTRACT (Section 7) & THREE-STATE EVIDENCE SCHEMAS
# =====================================================================

class AIIncidentInput(BaseModel):
    """Legacy incident payload dispatched to Member 3's Ollama module."""
    incident_id: str = Field(..., examples=["INC-001"])
    service: str = Field(..., examples=["api"])
    logs: List[str] = Field(default_factory=list, examples=[["Database connection refused"]])
    metrics: Dict[str, Any] = Field(default_factory=dict, examples=[{"cpu_usage": 78, "error_rate": 45}])
    recent_changes: List[str] = Field(default_factory=list, examples=[["Deployment v2.1"]])
    dependency_status: Dict[str, str] = Field(default_factory=dict, examples=[{"database": "unreachable"}])


class AIInvestigationResponse(BaseModel):
    """AI analysis result returned from Member 3's Ollama module."""
    root_cause: str = Field(..., examples=["Database connection failure"])
    confidence: float = Field(..., ge=0.0, le=1.0, examples=[0.87])
    evidence: List[str] = Field(
        default_factory=list,
        examples=[["Database connection refused", "API error rate increased"]],
    )
    recommended_action: str = Field(..., examples=["check_database_connectivity"])
    risk_level: str = Field(..., examples=["medium"])
    requires_approval: bool = Field(..., examples=[True])


# --- Three-State Investigation Schemas ---

class DockerConnectionStatus(BaseModel):
    """Structured report of Docker daemon accessibility."""
    connected: bool = False
    status: str = "disconnected"  # connected, disconnected, degraded
    error: Optional[str] = None
    containers_count: Optional[int] = None


class ServiceEvidence(BaseModel):
    """Normalized evidence for an individual service container.
    
    Optional fields are used when data is unavailable. Never replaced with fabricated zeroes.
    """
    name: str
    status: str  # running, exited, paused, unavailable, unknown
    health: str = "unknown"  # healthy, unhealthy, starting, none, unknown
    container_id: Optional[str] = None
    image: Optional[str] = None
    created_at: Optional[str] = None
    uptime_seconds: Optional[int] = None
    logs: List[str] = Field(default_factory=list)
    cpu_percent: Optional[float] = None
    memory_mb: Optional[float] = None
    independent_health: Optional[Dict[str, Any]] = None


class MetricsEvidence(BaseModel):
    """Quantitative performance and error telemetry. Missing data is represented as None."""
    cpu_usage: Optional[float] = None
    error_rate: Optional[float] = None
    memory_mb: Optional[float] = None
    p95_latency_ms: Optional[float] = None
    source: str = "prometheus"


class DependencyEvidence(BaseModel):
    """Status of upstream or downstream service dependencies."""
    name: str
    status: str  # reachable, unreachable, degraded, unknown
    latency_ms: Optional[float] = None
    error: Optional[str] = None


class RecentChangeEvidence(BaseModel):
    """Audit of recent system, container, or configuration changes."""
    change_type: str  # deployment, config, restart, scaling, infrastructure
    description: str
    timestamp: Optional[datetime] = None


class IncidentContext(BaseModel):
    """Standardized investigation payload containing evidence across all three states:
    1. docker_offline
    2. services_unhealthy
    3. services_healthy
    """
    condition: str = Field(..., examples=["docker_offline", "services_unhealthy", "services_healthy"])
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    target_service: Optional[str] = None
    docker: DockerConnectionStatus
    services: List[ServiceEvidence] = Field(default_factory=list)
    metrics: Optional[MetricsEvidence] = None
    dependencies: List[DependencyEvidence] = Field(default_factory=list)
    recent_changes: List[RecentChangeEvidence] = Field(default_factory=list)
    summary: str = ""


class InvestigationResult(BaseModel):
    """Standardized AI investigation output validating Section E requirements."""
    overall_status: str = Field(..., examples=["healthy", "degraded", "critical", "unknown"])
    root_cause: Optional[str] = Field(default=None, examples=["Database connection failure"])
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, examples=[0.87])
    evidence: List[str] = Field(default_factory=list, examples=[["Database connection refused"]])
    anomalies: List[str] = Field(default_factory=list, examples=[["High error rate detected"]])
    recommended_action: Optional[str] = Field(default=None, examples=["check_database_connectivity"])
    risk: str = Field(default="low", examples=["medium"])
    requires_approval: bool = Field(default=False, examples=[True])
    explanation: str = Field(default="", examples=["Database server is unreachable from api service."])
    verification: Optional[str] = Field(default=None, examples=["Verify HTTP 200 on /health and DB ping."])


# =====================================================================
# HEALTH & SERVICE INVENTORY SCHEMAS
# =====================================================================

class HealthStatusResponse(BaseModel):
    status: str = "healthy"
    version: str = "0.1.0"
    database: str = "connected"
    ollama_mode: str = "mock"
    docker_available: bool = False
    docker_status: str = "disconnected"
    docker_containers_count: Optional[int] = None
    docker_error: Optional[str] = None
    dry_run: bool = True
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ServiceItem(BaseModel):
    name: str
    status: str
    health: str
    id: Optional[str] = None
    image: Optional[str] = None
    created_at: Optional[str] = None
    health_status: Optional[str] = None
    uptime_seconds: Optional[int] = None
    error_rate: Optional[float] = None
    last_deployment: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
    cpu_percent: Optional[float] = None
    memory_mb: Optional[float] = None
    memory_limit_mb: Optional[float] = None
    independent_health: Optional[Dict[str, Any]] = None


class ServicesListResponse(BaseModel):
    services: List[ServiceItem]
    total: int
    docker_connected: bool = False
    source: str = "docker"
    error: Optional[str] = None


class HealthSummaryResponse(BaseModel):
    """Consolidated health summary across Docker and independent application checks."""
    docker: DockerConnectionStatus
    services_count: int
    healthy_count: int
    unhealthy_count: int
    status: str  # healthy, unhealthy, docker_offline, degraded
    services: List[ServiceEvidence] = Field(default_factory=list)
    independent_checks: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AnalyzeIncidentRequest(BaseModel):
    """Request payload to trigger on-demand system analysis."""
    service_name: Optional[str] = None
    trigger: str = "manual"  # manual, scheduled, alert


class AnalyzeIncidentResponse(BaseModel):
    """Consolidated response from POST /api/incidents/analyze."""
    success: bool = True
    condition: str
    context: IncidentContext
    investigation: InvestigationResult
    remediation: Optional[Dict[str, Any]] = None
    message: str


# =====================================================================
# INCIDENT SCHEMAS
# =====================================================================

class IncidentSummary(BaseModel):
    incident_id: str
    service: str
    status: str
    severity: str
    summary: str
    created_at: datetime


class IncidentListResponse(BaseModel):
    incidents: List[IncidentSummary]
    total: int


class IncidentDetailResponse(BaseModel):
    incident_id: str
    service: str
    status: str
    severity: str
    summary: str
    evidence: AIIncidentInput
    investigation: Optional[AIInvestigationResponse] = None
    remediation_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# =====================================================================
# REMEDIATION & APPROVAL SCHEMAS
# =====================================================================

class ApprovalRequest(BaseModel):
    approver: str = Field(default="oncall-operator", examples=["admin@sentinel.internal"])
    notes: Optional[str] = Field(default="", examples=["Approved after reviewing replica status."])


class RejectRequest(BaseModel):
    operator: str = Field(default="oncall-operator", examples=["admin@sentinel.internal"])
    reason: str = Field(..., examples=["False alarm triggered by network maintenance."])


class RemediationActionStatus(BaseModel):
    remediation_id: str
    incident_id: str
    action_type: str
    target_service: str
    risk_level: str
    status: str  # pending_approval, approved, rejected, executing, completed, failed
    dry_run: bool
    requires_approval: bool
    approval_notes: Optional[str] = None
    output: Optional[str] = None
    created_at: datetime


class VerificationResponse(BaseModel):
    incident_id: str
    recovered: bool
    checks: Dict[str, Any]
    current_status: str
    message: str


# =====================================================================
# AUDIT LOG SCHEMAS
# =====================================================================

class AuditLogItem(BaseModel):
    id: str
    incident_id: Optional[str] = None
    action: str
    actor: str
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime


class AuditLogListResponse(BaseModel):
    logs: List[AuditLogItem]
    total: int
