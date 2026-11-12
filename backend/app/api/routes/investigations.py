"""AI Investigation routes."""

from fastapi import APIRouter, HTTPException, status
from app.incidents.manager import incident_manager

router = APIRouter(tags=["Investigations"])


@router.post("/incidents/{incident_id}/investigate")
async def trigger_investigation(incident_id: str):
    """Triggers an AI-powered root-cause investigation using Ollama."""
    result = await incident_manager.investigate_incident(incident_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_id}' not found.",
        )
    return {
        "success": True,
        "message": "AI investigation completed and safety policy evaluated.",
        "data": result,
    }

