"""Ollama AI Investigation Module (Member 3).

Responsible for:
- Constructing prompts containing logs, metrics, changes, and dependencies.
- Querying Ollama with JSON mode enabled.
- Validating the output against the Sentinel Investigation schema.
"""

import json
import logging
from typing import Optional
from schemas.models import IncidentInput, InvestigationResponse

logger = logging.getLogger("sentinel.ai_engine")


class AIInvestigator:
    def __init__(self, ollama_url: str = "http://localhost:11434", model: str = "llama3:latest"):
        self.ollama_url = ollama_url
        self.model = model

    def generate_prompt(self, incident: IncidentInput) -> str:
        """Constructs prompt guiding Ollama to produce Section 7 JSON output."""
        return f"""You are Sentinel's Root Cause Investigator.
Analyze this cloud incident and output ONLY valid JSON adhering strictly to the schema.

INCIDENT ID: {incident.incident_id}
TARGET SERVICE: {incident.service}
LOGS: {json.dumps(incident.logs)}
METRICS: {json.dumps(incident.metrics)}
RECENT CHANGES: {json.dumps(incident.recent_changes)}
DEPENDENCY STATUS: {json.dumps(incident.dependency_status)}

Rules:
1. Root cause must be concise and actionable.
2. Recommended action MUST be one of:
   - check_database_connectivity
   - restart_container
   - rollback_deployment
   - scale_replicas
   - clear_cache
   - isolate_traffic
3. Assign risk_level ('low', 'medium', 'high').
4. Set requires_approval to true for medium and high risk actions.

Return JSON format:
{{
  "root_cause": "...",
  "confidence": 0.0 - 1.0,
  "evidence": ["..."],
  "recommended_action": "...",
  "risk_level": "low|medium|high",
  "requires_approval": true|false
}}
"""

    def mock_investigate(self, incident: IncidentInput) -> InvestigationResponse:
        """Deterministic mock investigation for offline testing."""
        return InvestigationResponse(
            root_cause="Database connection failure",
            confidence=0.87,
            evidence=[
                "Database connection refused",
                "API error rate increased"
            ],
            recommended_action="check_database_connectivity",
            risk_level="medium",
            requires_approval=True
        )


if __name__ == "__main__":
    sample_incident = IncidentInput(
        incident_id="INC-001",
        service="api",
        logs=["Database connection refused"],
        metrics={"cpu_usage": 78, "error_rate": 45},
        recent_changes=["Deployment v2.1"],
        dependency_status={"database": "unreachable"}
    )
    investigator = AIInvestigator()
    result = investigator.mock_investigate(sample_incident)
    print("Mock Investigation Output:")
    print(result.model_dump_json(indent=2))

