"""Ollama AI Integration Client.

Enforces Section 7 and Three-State Investigation contracts between Backend and AI Engine.
Validates structured JSON output using Pydantic schemas.
Includes robust timeout, malformed JSON, and server unavailability handling.
"""

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional, Union
import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.schemas import (
    AIIncidentInput,
    AIInvestigationResponse,
    IncidentContext,
    InvestigationResult,
)

logger = logging.getLogger("sentinel.integrations.ollama")


class OllamaIntegrationClient:
    """Interface connecting Sentinel Backend to Ollama AI Engine."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        mock_mode: Optional[bool] = None,
        timeout: Optional[int] = None,
    ):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.model = model or settings.OLLAMA_MODEL
        self.mock_mode = mock_mode if mock_mode is not None else settings.OLLAMA_MOCK_MODE
        self.timeout = timeout or settings.OLLAMA_TIMEOUT_SECONDS

    def investigate_incident(
        self,
        context: Union[IncidentContext, AIIncidentInput, Any],
    ) -> Union[InvestigationResult, AIInvestigationResponse]:
        """Dispatches incident context to Ollama and returns validated investigation output.
        
        Supports both modern IncidentContext (Three-State) and legacy AIIncidentInput.
        """
        if isinstance(context, IncidentContext):
            if self.mock_mode:
                logger.info("Ollama mock mode active: returning deterministic investigation for condition: %s", context.condition)
                return self._get_mock_investigation_result(context)
            return self._query_live_ollama_context(context)

        # Legacy AIIncidentInput fallback
        if self.mock_mode:
            logger.info("Ollama mock mode active: returning legacy Section 7 response for %s", getattr(context, "incident_id", "INC"))
            return self._get_mock_response(context)

        return self._query_live_ollama_legacy(context)

    async def investigate_incident_async(
        self,
        context: Union[IncidentContext, AIIncidentInput, Any],
    ) -> Union[InvestigationResult, AIInvestigationResponse]:
        """Async compatibility wrapper."""
        return self.investigate_incident(context)

    def _get_mock_investigation_result(self, context: IncidentContext) -> InvestigationResult:
        """Deterministic mock results tailored for all three operational conditions."""
        condition = context.condition

        # -----------------------------------------------------------------
        # Condition 1: Docker offline / disconnected
        # -----------------------------------------------------------------
        if condition == "docker_offline":
            error_msg = context.docker.error or "Docker daemon socket unreachable"
            return InvestigationResult(
                overall_status="unknown",
                root_cause="Docker daemon connectivity lost",
                confidence=0.92,
                evidence=[
                    f"Docker connection failed: {error_msg}",
                    "Docker container inspection unavailable",
                ],
                anomalies=[
                    "Docker API daemon offline or named pipe / socket permission error",
                ],
                recommended_action=None,  # Do not recommend container actions when Docker is offline
                risk="medium",
                requires_approval=True,
                explanation=(
                    f"Sentinel cannot reach the Docker daemon ({error_msg}). "
                    "Application services cannot be directly inspected through Docker, but independent application health checks "
                    "must be referenced before assuming application failure."
                ),
                verification="Verify Docker service status or daemon process.",
            )

        # -----------------------------------------------------------------
        # Condition 2: Docker connected, unhealthy services detected
        # -----------------------------------------------------------------
        if condition == "services_unhealthy":
            target = context.target_service or "api"
            evidence_lines = []
            anomalies = []
            
            for s in context.services:
                if s.status != "running" or s.health == "unhealthy" or s.name == target:
                    evidence_lines.extend(s.logs[-3:] if s.logs else [f"Service '{s.name}' status: {s.status}"])
                    if s.health == "unhealthy":
                        anomalies.append(f"Service '{s.name}' reported health: unhealthy")
                    if s.status == "exited":
                        anomalies.append(f"Container '{s.name}' unexpectedly exited")

            if context.metrics and context.metrics.error_rate and context.metrics.error_rate > 5:
                anomalies.append(f"Elevated error rate: {context.metrics.error_rate}%")
                evidence_lines.append(f"Metrics: error rate at {context.metrics.error_rate}%")

            if not evidence_lines:
                evidence_lines = ["Database connection refused", f"Container {target} unhealthy"]
            if not anomalies:
                anomalies = ["Container failing health checks", "High error rate detected"]

            return InvestigationResult(
                overall_status="degraded",
                root_cause="Database connection failure",
                confidence=0.87,
                evidence=evidence_lines,
                anomalies=anomalies,
                recommended_action="check_database_connectivity",
                risk="medium",
                requires_approval=True,
                explanation=(
                    f"The service '{target}' is reporting health check failures and connection refusal errors. "
                    "Logs indicate unreachable database dependency. Running connectivity checks is recommended."
                ),
                verification="Verify HTTP 200 on /health and database ping recovery.",
            )

        # -----------------------------------------------------------------
        # Condition 3: Docker connected and all services healthy
        # -----------------------------------------------------------------
        return InvestigationResult(
            overall_status="healthy",
            root_cause=None,
            confidence=1.0,
            evidence=[
                f"All {len(context.services)} monitored containers are running and healthy",
                "Metrics and dependency status are within nominal parameters",
            ],
            anomalies=[],
            recommended_action=None,
            risk="low",
            requires_approval=False,
            explanation="All monitored application services, containers, and dependencies are operating normally. No remediation needed.",
            verification=None,
        )

    def _get_mock_response(self, incident: Any) -> AIInvestigationResponse:
        """Deterministic response matching legacy Section 7 requirements."""
        return AIInvestigationResponse(
            root_cause="Database connection failure",
            confidence=0.87,
            evidence=[
                "Database connection refused",
                "API error rate increased",
            ],
            recommended_action="check_database_connectivity",
            risk_level="medium",
            requires_approval=True,
        )

    def _query_live_ollama_context(self, context: IncidentContext) -> InvestigationResult:
        """Performs live HTTP query to Ollama with JSON schema enforcement and error handling."""
        prompt = (
            "You are Sentinel AI Incident Response Investigator. Analyze the following system evidence.\n"
            "Output ONLY valid JSON matching this exact schema:\n"
            "{\n"
            '  "overall_status": "healthy" | "degraded" | "critical" | "unknown",\n'
            '  "root_cause": string or null,\n'
            '  "confidence": float (0.0 to 1.0),\n'
            '  "evidence": list[string],\n'
            '  "anomalies": list[string],\n'
            '  "recommended_action": string or null,\n'
            '  "risk": "low" | "medium" | "high",\n'
            '  "requires_approval": boolean,\n'
            '  "explanation": string,\n'
            '  "verification": string or null\n'
            "}\n\n"
            "STRICT RULES:\n"
            "1. If overall_status is 'healthy', root_cause and recommended_action must be null, anomalies must be empty.\n"
            "2. If Docker is offline, do NOT report application failure based solely on Docker. State Docker connectivity issue.\n"
            "3. Only recommend whitelisted actions: check_database_connectivity, restart_container, rollback_deployment, scale_replicas, clear_cache, isolate_traffic.\n"
            "4. Never output shell commands.\n\n"
            f"SYSTEM INCIDENT CONTEXT:\n{context.model_dump_json(indent=2)}\n"
        )

        try:
            with httpx.Client(timeout=float(self.timeout)) as client:
                response = client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "format": "json",
                        "stream": False,
                    },
                )
                response.raise_for_status()
                data = response.json()
                raw_ai_text = data.get("response", "{}")

                # Validate structured response strictly with Pydantic
                validated_result = InvestigationResult.model_validate_json(raw_ai_text)
                return validated_result

        except httpx.TimeoutException:
            logger.warning("Ollama query timed out after %s seconds. Falling back to safe deterministic assessment.", self.timeout)
            fallback = self._get_mock_investigation_result(context)
            fallback.explanation = f"Ollama model query timed out after {self.timeout}s. Fallback evaluation applied."
            return fallback

        except ValidationError as val_err:
            logger.error("AI response failed Pydantic validation: %s", str(val_err))
            fallback = self._get_mock_investigation_result(context)
            fallback.explanation = "Ollama returned malformed JSON schema. Fallback evaluation applied."
            return fallback

        except Exception as e:
            logger.error("Failed communicating with Ollama (%s). Using fallback evaluation.", str(e))
            return self._get_mock_investigation_result(context)

    def _query_live_ollama_legacy(self, incident: AIIncidentInput) -> AIInvestigationResponse:
        """Performs live HTTP query to Ollama for legacy Section 7 schema."""
        prompt = (
            "You are Sentinel AI Incident Response Investigator. Output ONLY valid JSON matching this schema:\n"
            '{"root_cause": string, "confidence": float, "evidence": list[string], "recommended_action": string, "risk_level": "low"|"medium"|"high", "requires_approval": bool}\n\n'
            f"Incident ID: {incident.incident_id}\n"
            f"Service: {incident.service}\n"
            f"Logs: {incident.logs}\n"
            f"Metrics: {incident.metrics}\n"
            f"Recent Changes: {incident.recent_changes}\n"
            f"Dependency Status: {incident.dependency_status}\n"
        )

        try:
            with httpx.Client(timeout=float(self.timeout)) as client:
                response = client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "format": "json",
                        "stream": False,
                    },
                )
                response.raise_for_status()
                data = response.json()
                raw_ai_text = data.get("response", "{}")

                validated_response = AIInvestigationResponse.model_validate_json(raw_ai_text)
                return validated_response

        except Exception as e:
            logger.error("Failed communicating with Ollama: %s", str(e))
            return self._get_mock_response(incident)


# Global singleton client instance
ollama_client = OllamaIntegrationClient()
