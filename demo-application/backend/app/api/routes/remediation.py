"""Remediation Execution and Health Verification routes."""

from fastapi import APIRouter, HTTPException, status
from app.incidents.manager import incident_manager
from app.schemas import VerificationResponse

router = APIRouter(tags=["Remediation"])


@router.post("/remediations/{remediation_id}/execute")
async def execute_remediation(remediation_id: str):
    """Executes an approved or whitelisted automated remediation action."""
    result = incident_manager.execute_remediation(remediation_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Remediation '{remediation_id}' not found.",
        )
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Remediation execution failed safety or approval gate."),
        )
    return {
        "success": True,
        "message": "Remediation step executed.",
        "data": result,
    }


@router.post("/incidents/{incident_id}/verify", response_model=VerificationResponse)
async def verify_incident_recovery(incident_id: str):
    """Verifies service health recovery following a remediation step."""
    result = incident_manager.verify_recovery(incident_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_id}' not found.",
        )
    return result
