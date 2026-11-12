"""Health check and readiness route."""

from fastapi import APIRouter
from app.core.config import settings
from app.remediation.executor import docker_connector
from app.schemas import HealthStatusResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthStatusResponse)
def get_health():
    """System health check, component connectivity, and policy status."""
    docker_info = docker_connector.get_connectivity_status()
    is_docker_available = docker_info.get("connected", False)

    return HealthStatusResponse(
        status="healthy",
        version=settings.VERSION,
        database="connected",
        ollama_mode="mock" if settings.OLLAMA_MOCK_MODE else "live",
        docker_available=is_docker_available,
        docker_status=docker_info.get("status", "disconnected"),
        docker_containers_count=docker_info.get("containers_count"),
        docker_error=docker_info.get("error"),
        dry_run=settings.SAFETY_DRY_RUN,
    )
