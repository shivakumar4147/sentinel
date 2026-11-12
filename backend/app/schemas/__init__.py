"""Pydantic request and response schemas for Sentinel API."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# =====================================================================
# AI INVESTIGATION CONTRACT (Section 7)
# =====================================================================

class AIIncidentInput(BaseModel):
    """Incident payload dispatched to Member 3's Ollama module."""
    incident_id: str = Field(..., example="INC-001")
    service: str = Field(..., example="api")
    logs: List[str] = Field(default_factory=list, example=["Database connection refused"])
    metrics: Dict[str, Any] = Field(default_factory=dict, example={"cpu_usage": 78, "error_rate": 45})
    recent_changes: List[str] = Field(default_factory=list, example=["Deployment v2.1"])
    dependency_status: Dict[str, str] = Field(default_factory=dict, example={"database": "unreachable"})


class AIInvestigationResponse(BaseModel):
    """AI analysis result returned from Member 3's Ollama module."""
    root_cause: str = Field(..., example="Database connection failure")
    confidence: float = Field(..., ge=0.0, le=1.0, example=0.87)
    evidence: List[str] = Field(
        default_factory=list,
        example=["Database connection refused", "API error rate increased"],
    )
    recommended_action: str = Field(..., example="check_database_connectivity")
    risk_level: str = Field(..., example="medium")
    requires_approval: bool = Field(..., example=True)


# =====================================================================
# HEALTH & SERVICE INVENTORY SCHEMAS
# =====================================================================

class HealthStatusResponse(BaseModel):
    status: str = "healthy"
    version: str = "0.1.0"
    database: str = "connected"
    ollama_mode: str = "mock"
    docker_available: bool = False
    dry_run: bool = True
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ServiceItem(BaseModel):
    name: str
    status: str
    health: str
    uptime_seconds: int = 0
    error_rate: float = 0.0
    last_deployment: Optional[str] = None


class ServicesListResponse(BaseModel):
    services: List[ServiceItem]
    total: int


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
    approver: str = Field(default="oncall-operator", example="admin@sentinel.internal")
    notes: Optional[str] = Field(default="", example="Approved after reviewing replica status.")


class RejectRequest(BaseModel):
    operator: str = Field(default="oncall-operator", example="admin@sentinel.internal")
    reason: str = Field(..., example="False alarm triggered by network maintenance.")


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
