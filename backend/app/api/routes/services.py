"""Services inventory routes."""

import logging
from fastapi import APIRouter
from app.incidents.correlator import correlator
from app.remediation.executor import docker_connector
from app.schemas import HealthSummaryResponse, ServiceItem, ServicesListResponse

logger = logging.getLogger("sentinel.api.services")
router = APIRouter(tags=["Services"])


@router.get("/services", response_model=ServicesListResponse)
def list_services():
    """Returns inventory of monitored cloud services and containers (read-only)."""
    try:
        raw_services = docker_connector.list_services()
        is_connected = docker_connector.is_available
        source = "docker" if is_connected else ("mock" if len(raw_services) > 0 else "empty")

        items = [
            ServiceItem(
                name=s.get("name", "unknown"),
                status=s.get("status", "unknown"),
                health=s.get("health", "unknown"),
                id=s.get("id"),
                image=s.get("image"),
                created_at=s.get("created_at"),
                health_status=s.get("health_status"),
                uptime_seconds=s.get("uptime_seconds"),
                error_rate=s.get("error_rate"),
                last_deployment=s.get("last_deployment"),
                logs=s.get("logs", []),
                cpu_percent=s.get("cpu_percent"),
                memory_mb=s.get("memory_mb"),
                memory_limit_mb=s.get("memory_limit_mb"),
            )
            for s in raw_services
        ]
        return ServicesListResponse(
            services=items,
            total=len(items),
            docker_connected=is_connected,
            source=source,
            error=docker_connector.last_error if not is_connected else None,
        )
    except Exception as e:
        logger.error("Failed to list services: %s", str(e))
        return ServicesListResponse(
            services=[],
            total=0,
            docker_connected=False,
            source="error",
            error=str(e),
        )


@router.get("/services/health-summary", response_model=HealthSummaryResponse)
def get_health_summary():
    """Consolidated health summary across Docker daemon and independent services."""
    return correlator.get_health_summary()
