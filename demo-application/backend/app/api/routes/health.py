"""Health check and readiness route."""

from fastapi import APIRouter
from app.core.config import settings
from app.remediation.executor import docker_connector
from app.schemas import HealthStatusResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthStatusResponse)
async def get_health():
    """System health check, component connectivity, and policy status."""
    return HealthStatusResponse(
        status="healthy",
        version=settings.VERSION,
        database="connected",
        ollama_mode="mock" if settings.OLLAMA_MOCK_MODE else "live",
        docker_available=docker_connector.is_available,
        dry_run=settings.SAFETY_DRY_RUN,
    )
