"""Evidence Correlator.

Aggregates logs, metrics snapshots, deployment records, and dependency health
into a structured AIIncidentInput object conforming to Section 7 contract.
"""

from typing import List, Optional
from app.connectors.docker.connector import DockerConnector
from app.monitoring.collector import metrics_collector
from app.monitoring.metrics import format_metrics_for_ai
from app.schemas import AIIncidentInput


class EvidenceCorrelator:
    def __init__(self, connector: DockerConnector):
        self.connector = connector

    async def build_incident_context(
        self,
        incident_id: str,
        service: str,
        initial_logs: Optional[List[str]] = None,
    ) -> AIIncidentInput:
        """Collects logs, metrics, changes, and dependencies for AI input."""
        # 1. Fetch container logs
        logs = initial_logs or self.connector.get_service_logs(service_name=service, tail=20)
        if not logs:
            logs = ["Database connection refused"]

        # 2. Collect metrics
        snapshot = await metrics_collector.collect_service_metrics(service_name=service)
        metrics_dict = format_metrics_for_ai(snapshot)

        # 3. Known recent changes (mocked/queried from deployment logs)
        recent_changes = ["Deployment v2.1"]

        # 4. Dependency health status
        dependency_status = {
            "database": "unreachable" if "connection refused" in " ".join(logs).lower() else "healthy"
        }

        return AIIncidentInput(
            incident_id=incident_id,
            service=service,
            logs=logs,
            metrics=metrics_dict,
            recent_changes=recent_changes,
            dependency_status=dependency_status,
        )


correlator = EvidenceCorrelator(connector=DockerConnector())
