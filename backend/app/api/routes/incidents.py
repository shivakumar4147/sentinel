"""Incidents management routes."""

from typing import Optional
from fastapi import APIRouter, HTTPException, status
from app.incidents.manager import incident_manager
from app.schemas import (
    AnalyzeIncidentRequest,
    AnalyzeIncidentResponse,
    IncidentDetailResponse,
    IncidentListResponse,
)

router = APIRouter(tags=["Incidents"])


@router.get("/incidents", response_model=IncidentListResponse)
async def list_incidents():
    """Retrieve all active and recorded incidents."""
    incidents = incident_manager.list_incidents()
    return IncidentListResponse(incidents=incidents, total=len(incidents))


@router.get("/incidents/{incident_id}", response_model=IncidentDetailResponse)
async def get_incident(incident_id: str):
    """Retrieve complete evidence, status, and AI investigation for a specific incident."""
    incident = incident_manager.get_incident(incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_id}' not found.",
        )
    return incident


@router.post("/incidents/analyze", response_model=AnalyzeIncidentResponse)
def analyze_incident(request: Optional[AnalyzeIncidentRequest] = None):
    """Triggers an incident evidence collection and three-state investigation."""
    target_service = request.service_name if request else None
    return incident_manager.analyze_system_state(service_name=target_service)
