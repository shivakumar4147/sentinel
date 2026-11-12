"""Pydantic schemas for AI investigation module (Member 3).

Strictly mirrors Section 7 of the Sentinel specifications.
"""

from typing import Any, Dict, List
from pydantic import BaseModel, Field


class IncidentInput(BaseModel):
    """Incident context payload provided to Ollama."""
    incident_id: str = Field(..., description="Unique incident identifier, e.g. INC-001")
    service: str = Field(..., description="Name of degraded or failing service")
    logs: List[str] = Field(default_factory=list, description="Extracted log lines relevant to failure")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Metric snapshots, e.g. cpu_usage, error_rate")
    recent_changes: List[str] = Field(default_factory=list, description="Recent deployments or config updates")
    dependency_status: Dict[str, str] = Field(default_factory=dict, description="Health of upstream/downstream dependencies")


class InvestigationResponse(BaseModel):
    """Structured AI output returned after analysis."""
    root_cause: str = Field(..., description="Plain-language explanation of failure root cause")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    evidence: List[str] = Field(default_factory=list, description="Specific supporting evidence items")
    recommended_action: str = Field(..., description="Action identifier matching safety whitelist")
    risk_level: str = Field(..., description="Assessed risk: low, medium, or high")
    requires_approval: bool = Field(..., description="Whether action mandates human authorization")
