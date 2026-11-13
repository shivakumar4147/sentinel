"""Sentinel FastAPI Control Plane Entry Point.

Central coordinator for the Sentinel incident response platform.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.approvals import router as approvals_router
from app.api.routes.audit import router as audit_router
from app.api.routes.health import router as health_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.investigations import router as investigations_router
from app.api.routes.remediation import router as remediation_router
from app.api.routes.services import router as services_router
from app.core.config import settings
from app.core.database import Base, engine

# Setup structured logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sentinel.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown hooks."""
    logger.info("Initializing Sentinel Control Plane v%s...", settings.VERSION)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas initialized.")
    except Exception as e:
        logger.warning("Could not auto-create tables: %s", str(e))
    logger.info("Sentinel backend initialized successfully. Dry-run mode: %s", settings.SAFETY_DRY_RUN)
    yield
    logger.info("Sentinel backend shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Safety-first autonomous incident response platform for cloud-native services.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Enable CORS for Member 2's React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global API Router Mounting
api_prefix = settings.API_PREFIX

app.include_router(health_router, prefix=api_prefix)
app.include_router(services_router, prefix=api_prefix)
app.include_router(incidents_router, prefix=api_prefix)
app.include_router(investigations_router, prefix=api_prefix)
app.include_router(approvals_router, prefix=api_prefix)
app.include_router(remediation_router, prefix=api_prefix)
app.include_router(audit_router, prefix=api_prefix)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint welcoming operators and providing link to Swagger documentation."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "documentation": "/docs",
        "api_prefix": api_prefix,
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Standardized JSON error envelope for unexpected server errors."""
    logger.exception("Unhandled error processing request %s: %s", request.url.path, str(exc))
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal error occurred while processing the request.",
                "details": str(exc) if settings.DEBUG else None,
            },
        },
    )

