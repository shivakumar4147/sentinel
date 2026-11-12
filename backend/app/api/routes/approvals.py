"""Human-in-the-Loop Approval routes."""

from fastapi import APIRouter, HTTPException, status
from app.incidents.manager import incident_manager
from app.schemas import ApprovalRequest, RejectRequest, RemediationActionStatus

router = APIRouter(tags=["Approvals"])


@router.post("/remediations/{remediation_id}/approve", response_model=RemediationActionStatus)
async def approve_remediation(remediation_id: str, request: ApprovalRequest):
    """Operator authorizes a pending remediation plan."""
    result = incident_manager.approve_remediation(
        remediation_id=remediation_id,
        approver=request.approver,
        notes=request.notes or "",
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Remediation '{remediation_id}' not found.",
        )
    return result


@router.post("/remediations/{remediation_id}/reject", response_model=RemediationActionStatus)
async def reject_remediation(remediation_id: str, request: RejectRequest):
    """Operator rejects a proposed remediation plan."""
    result = incident_manager.reject_remediation(
        remediation_id=remediation_id,
        operator=request.operator,
        reason=request.reason,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Remediation '{remediation_id}' not found.",
        )
    return result

