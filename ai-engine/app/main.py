"""FastAPI entrypoint for Sentinel's incident investigation API.

Run locally with:
    uvicorn app.main:app --reload

Example request:
    curl -X POST http://127.0.0.1:8000/investigate ^
      -H "Content-Type: application/json" ^
      -d "{\"description\":\"API is unavailable\",\"logs\":[\"Database timeout\"],\"metrics\":{\"error_rate\":\"25%\"}}"
"""

import logging
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.investigator import (
    IncidentInvestigationError,
    investigate_incident,
)
from app.schemas import (
    FullInvestigationReport,
    FullInvestigationRequest,
    IncidentDiagnosis,
)
from app.workflow import FullInvestigationError, run_full_investigation


logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
APPROVED_WORKSPACE = PROJECT_ROOT.parent
load_dotenv(PROJECT_ROOT / ".env")


class IncidentRequest(BaseModel):
    """Validated incident evidence accepted by the investigation endpoint."""

    description: str = Field(min_length=1)
    logs: list[str] = Field(default_factory=list)
    metrics: Any = None
    deployment: Any = None
    dependencies: Any = None
    max_logs: int = Field(default=20, ge=0)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "description": "API is unavailable",
                    "logs": [
                        "Health check failed",
                        "Database connection timeout",
                    ],
                    "metrics": {"error_rate": "25%"},
                    "deployment": {"version": "1.2.3"},
                    "dependencies": {"database": "unhealthy"},
                    "max_logs": 20,
                }
            ]
        }
    }


app = FastAPI(
    title="Sentinel Incident Investigation API",
    description=(
        "Analyze supplied incident evidence. The API diagnoses incidents "
        "but never executes remediation actions."
    ),
)


@app.get("/health")
def health() -> dict[str, str]:
    """Return a simple readiness response."""
    return {"status": "ok"}


@app.post("/investigate", response_model=IncidentDiagnosis)
def investigate(request: IncidentRequest) -> IncidentDiagnosis:
    """Investigate an incident and return its structured diagnosis."""
    incident = request.model_dump(
        exclude={"max_logs"},
    )
    try:
        return investigate_incident(incident, max_logs=request.max_logs)
    except IncidentInvestigationError as error:
        logger.exception("Incident investigation failed")
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error


@app.post("/investigate/full", response_model=FullInvestigationReport)
def investigate_full(
    request: FullInvestigationRequest,
) -> FullInvestigationReport:
    """Run diagnosis and any supplied read-only analysis stages."""
    try:
        return run_full_investigation(
            request,
            approved_workspace=APPROVED_WORKSPACE,
        )
    except FullInvestigationError as error:
        logger.exception("Full investigation failed")
        raise HTTPException(
            status_code=502,
            detail="Unable to complete investigation workflow",
        ) from error


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
