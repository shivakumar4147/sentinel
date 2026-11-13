"""Services inventory routes."""

from fastapi import APIRouter
from app.remediation.executor import docker_connector
from app.schemas import ServiceItem, ServicesListResponse

router = APIRouter(tags=["Services"])


@router.get("/services", response_model=ServicesListResponse)
async def list_services():
    """Returns inventory of monitored cloud services and containers."""
    raw_services = docker_connector.list_services()
    items = [
        ServiceItem(
            name=s.get("name", "unknown"),
            status=s.get("status", "unknown"),
            health=s.get("health", "unknown"),
            uptime_seconds=s.get("uptime_seconds", 0),
            error_rate=s.get("error_rate", 0.0),
            last_deployment=s.get("last_deployment"),
        )
        for s in raw_services
    ]
    return ServicesListResponse(services=items, total=len(items))
