"""Incidents management routes."""

from fastapi import APIRouter, HTTPException, status
from app.incidents.manager import incident_manager
from app.schemas import IncidentDetailResponse, IncidentListResponse

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
