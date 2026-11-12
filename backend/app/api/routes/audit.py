"""Audit logs query routes."""

from fastapi import APIRouter
from app.incidents.manager import incident_manager
from app.schemas import AuditLogItem, AuditLogListResponse

router = APIRouter(tags=["Audit"])


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def get_audit_logs():
    """Query immutable timeline of detections, AI recommendations, approvals, and actions."""
    raw_logs = incident_manager.get_audit_logs()
    items = [
        AuditLogItem(
            id=log["id"],
            incident_id=log.get("incident_id"),
            action=log["action"],
            actor=log["actor"],
            details=log.get("details", {}),
            timestamp=log["timestamp"],
        )
        for log in raw_logs
    ]
    return AuditLogListResponse(logs=items, total=len(items))

