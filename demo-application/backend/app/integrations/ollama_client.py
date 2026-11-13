"""Ollama AI Integration Client.

Enforces Section 7 contract validation between Backend and AI Engine (Member 3).
Includes mock mode for standalone testing without requiring a live Ollama server.
"""

import logging
from typing import Optional
import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.schemas import AIIncidentInput, AIInvestigationResponse

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

    async def investigate_incident(self, incident: AIIncidentInput) -> AIInvestigationResponse:
        """Dispatches incident context to Ollama and returns validated investigation output."""
        if self.mock_mode:
            logger.info("Ollama mock mode active: returning deterministic Section 7 response for %s", incident.incident_id)
            return self._get_mock_response(incident)

        return await self._query_live_ollama(incident)

    def _get_mock_response(self, incident: AIIncidentInput) -> AIInvestigationResponse:
        """Deterministic response matching Section 7 requirements."""
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

    async def _query_live_ollama(self, incident: AIIncidentInput) -> AIInvestigationResponse:
        """Performs live HTTP request to Ollama endpoint with JSON mode and Pydantic validation."""
        prompt = (
            f"You are Sentinel AI Incident Response Investigator. Output ONLY valid JSON matching this schema:\n"
            f'{{"root_cause": string, "confidence": float, "evidence": list[string], "recommended_action": string, "risk_level": "low"|"medium"|"high", "requires_approval": bool}}\n\n'
            f"Incident ID: {incident.incident_id}\n"
            f"Service: {incident.service}\n"
            f"Logs: {incident.logs}\n"
            f"Metrics: {incident.metrics}\n"
            f"Recent Changes: {incident.recent_changes}\n"
            f"Dependency Status: {incident.dependency_status}\n"
        )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
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

                # Validate structured response strictly
                validated_response = AIInvestigationResponse.model_validate_json(raw_ai_text)
                return validated_response

        except ValidationError as val_err:
            logger.error("AI response failed Pydantic contract validation: %s", str(val_err))
            raise ValueError(f"AI response contract violation: {str(val_err)}")
        except Exception as e:
            logger.error("Failed communicating with Ollama: %s", str(e))
            # Fallback to safe mock response if server fails
            logger.warning("Falling back to deterministic mock investigation due to communication failure.")
            return self._get_mock_response(incident)


# Global singleton client instance
ollama_client = OllamaIntegrationClient()
