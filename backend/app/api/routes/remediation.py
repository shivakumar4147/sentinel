"""Remediation Execution and Health Verification routes."""

from fastapi import APIRouter, HTTPException, status
from app.incidents.manager import incident_manager
from app.schemas import VerificationResponse

router = APIRouter(tags=["Remediation"])


@router.get("/remediations")
def get_remediations():
    """Lists all remediation plans and hotfix statuses from the control plane."""
    remediations = incident_manager.get_all_remediations()
    return {
        "success": True,
        "remediations": remediations,
        "total": len(remediations),
    }


@router.get("/remediations/{remediation_id}")
def get_remediation(remediation_id: str):
    """Retrieves single remediation plan details."""
    rem = incident_manager.get_remediation(remediation_id)
    if not rem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Remediation '{remediation_id}' not found.",
        )
    return {
        "success": True,
        "remediation": rem,
    }


@router.post("/remediations/{remediation_id}/execute")
def execute_remediation(remediation_id: str):
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
def verify_incident_recovery(incident_id: str):
    """Verifies service health recovery following a remediation step."""
    result = incident_manager.verify_recovery(incident_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_id}' not found.",
        )
    return result

