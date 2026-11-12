"""Tests for Sentinel Incident Context and Three-State Investigation System.

Verifies:
1. Docker offline: application health unknown; no false application failure; independent checks separate.
2. Docker connected with unhealthy service: correct evidence, metrics, dependencies, approval required.
3. Docker connected with all services healthy: healthy status, root_cause is None, no remediation created.
4. Edge cases: missing metrics (no fabricated zeroes), missing logs, malformed Ollama JSON, Ollama timeout.
5. API endpoints: POST /api/incidents/analyze and GET /api/services/health-summary.
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
import httpx
import pytest

from app.api.routes.incidents import analyze_incident
from app.api.routes.services import get_health_summary
from app.connectors.docker.connector import DockerConnector
from app.core.config import settings
from app.incidents.correlator import EvidenceCorrelator, correlator
from app.incidents.manager import IncidentManager, incident_manager
from app.integrations.ollama_client import OllamaIntegrationClient, ollama_client
from app.schemas import (
    AnalyzeIncidentRequest,
    DockerConnectionStatus,
    IncidentContext,
    InvestigationResult,
    MetricsEvidence,
    ServiceEvidence,
)


# =====================================================================
# 1. DOCKER OFFLINE CONDITION
# =====================================================================

def test_docker_offline_condition_evidence_and_investigation():
    """When Docker cannot be reached:
    - docker.connected is False
    - Container information is set to unavailable
    - Actual Docker error is preserved
    - Application services are NOT reported as failed based solely on Docker
    - Independent application health checks are reported separately
    - Ollama identifies Docker connectivity loss without container remediation
    """
    mock_connector = MagicMock(spec=DockerConnector)
    mock_connector.get_connectivity_status.return_value = {
        "connected": False,
        "status": "disconnected",
        "error": "Error while fetching server API version: (5, 'CreateFile', 'Access is denied.')",
        "containers_count": None,
    }
    mock_connector.last_error = "Error while fetching server API version: (5, 'CreateFile', 'Access is denied.')"

    corr = EvidenceCorrelator(connector=mock_connector)
    context: IncidentContext = corr.collect_system_context(service_name="api")

    # Assert Docker offline state
    assert context.condition == "docker_offline"
    assert context.docker.connected is False
    assert context.docker.status == "disconnected"
    assert "Access is denied" in context.docker.error

    # Assert application is NOT falsely marked failed
    assert len(context.services) == 1
    svc = context.services[0]
    assert svc.name == "api"
    assert svc.status == "unavailable"
    assert svc.health == "unknown"  # Distinguish unknown from failed!
    assert svc.independent_health is not None
    assert svc.independent_health.get("reachable") is True

    # Assert metrics are None (NEVER fabricated zeroes)
    assert context.metrics is None

    # Assert Ollama investigation result for docker_offline
    client = OllamaIntegrationClient(mock_mode=True)
    inv_result: InvestigationResult = client.investigate_incident(context)

    assert inv_result.overall_status == "unknown"
    assert inv_result.root_cause == "Docker daemon connectivity lost"
    assert inv_result.recommended_action is None  # Cannot run container remediation while Docker is offline
    assert inv_result.requires_approval is True
    assert "Docker daemon" in inv_result.explanation

    # Assert manager analysis does not create unneeded remediation
    mgr = IncidentManager()
    with patch("app.incidents.manager.correlator", corr):
        with patch("app.incidents.manager.ollama_client", client):
            resp = mgr.analyze_system_state(service_name="api")
            assert resp.success is True
            assert resp.condition == "docker_offline"
            assert resp.remediation is None


# =====================================================================
# 2. DOCKER CONNECTED, UNHEALTHY SERVICE CONDITION
# =====================================================================

def test_docker_connected_unhealthy_condition():
    """When Docker is connected but a service is unhealthy:
    - Collects running/stopped containers, logs, and telemetry
    - Builds context focusing on relevant evidence
    - Detects dependency failures (e.g. database unreachable)
    - Recommends whitelisted remediation with required human approval
    """
    mock_connector = MagicMock(spec=DockerConnector)
    mock_connector.get_connectivity_status.return_value = {
        "connected": True,
        "status": "connected",
        "error": None,
        "containers_count": 2,
    }
    mock_connector.list_services.return_value = [
        {
            "name": "api",
            "status": "running",
            "health": "unhealthy",
            "id": "c1a2b3c4",
            "image": "sentinel/demo-api:v2.1",
            "uptime_seconds": 120,
            "cpu_percent": 82.5,
            "memory_mb": 512.0,
        },
        {
            "name": "postgres",
            "status": "running",
            "health": "healthy",
            "id": "d5e6f7a8",
            "image": "postgres:16-alpine",
            "uptime_seconds": 3600,
            "cpu_percent": 5.0,
            "memory_mb": 128.0,
        },
    ]
    mock_connector.get_service_logs.return_value = [
        "2026-11-12T10:00:00Z INFO Initializing api service...",
        "2026-11-12T10:00:02Z ERROR Database connection refused on port 5432",
        "2026-11-12T10:00:05Z FATAL Cannot connect to PostgreSQL database",
    ]

    corr = EvidenceCorrelator(connector=mock_connector)
    context: IncidentContext = corr.collect_system_context(service_name="api")

    assert context.condition == "services_unhealthy"
    assert context.docker.connected is True
    assert context.target_service == "api"

    # Relevant evidence includes unhealthy service and logs
    unhealthy_svc = next(s for s in context.services if s.name == "api")
    assert unhealthy_svc.health == "unhealthy"
    assert len(unhealthy_svc.logs) == 3
    assert "Database connection refused" in unhealthy_svc.logs[1]

    # Dependency check detected unreachable database
    db_dep = next(d for d in context.dependencies if d.name == "database")
    assert db_dep.status == "unreachable"

    # Ollama analysis
    client = OllamaIntegrationClient(mock_mode=True)
    inv_result: InvestigationResult = client.investigate_incident(context)

    assert inv_result.overall_status == "degraded"
    assert inv_result.root_cause == "Database connection failure"
    assert inv_result.confidence >= 0.8
    assert inv_result.recommended_action == "check_database_connectivity"
    assert inv_result.risk == "medium"
    assert inv_result.requires_approval is True

    # Manager analysis creates incident and remediation record
    mgr = IncidentManager()
    with patch("app.incidents.manager.correlator", corr):
        with patch("app.incidents.manager.ollama_client", client):
            resp = mgr.analyze_system_state(service_name="api")
            assert resp.success is True
            assert resp.condition == "services_unhealthy"
            assert resp.remediation is not None
            assert resp.remediation["action_type"] == "check_database_connectivity"
            assert resp.remediation["status"] == "pending_approval"
            assert resp.remediation["is_approved"] is False


# =====================================================================
# 3. DOCKER CONNECTED, ALL SERVICES HEALTHY CONDITION
# =====================================================================

def test_docker_connected_healthy_condition():
    """When all monitored services are healthy:
    - Builds scheduled health-analysis context
    - Returns healthy status
    - root_cause is None, recommended_action is None, anomalies is empty
    - Does NOT create a failure incident or recommend remediation
    """
    mock_connector = MagicMock(spec=DockerConnector)
    mock_connector.get_connectivity_status.return_value = {
        "connected": True,
        "status": "connected",
        "error": None,
        "containers_count": 2,
    }
    mock_connector.list_services.return_value = [
        {
            "name": "api",
            "status": "running",
            "health": "healthy",
            "id": "c1a2b3c4",
            "image": "sentinel/demo-api:v2.1",
            "uptime_seconds": 7200,
            "cpu_percent": 12.0,
            "memory_mb": 120.0,
        },
        {
            "name": "postgres",
            "status": "running",
            "health": "healthy",
            "id": "d5e6f7a8",
            "image": "postgres:16-alpine",
            "uptime_seconds": 7200,
            "cpu_percent": 4.5,
            "memory_mb": 85.0,
        },
    ]
    mock_connector.get_service_logs.return_value = [
        "2026-11-12T10:00:00Z INFO HTTP server listening on 8000",
        "2026-11-12T10:00:10Z INFO Health check passed (200 OK)",
    ]

    corr = EvidenceCorrelator(connector=mock_connector)
    context: IncidentContext = corr.collect_system_context()

    assert context.condition == "services_healthy"
    assert context.docker.connected is True
    assert len(context.services) == 2

    # Ollama analysis
    client = OllamaIntegrationClient(mock_mode=True)
    inv_result: InvestigationResult = client.investigate_incident(context)

    assert inv_result.overall_status == "healthy"
    assert inv_result.root_cause is None
    assert inv_result.recommended_action is None
    assert inv_result.anomalies == []
    assert inv_result.risk == "low"
    assert inv_result.requires_approval is False

    # Manager analysis does not create any incident or remediation
    mgr = IncidentManager()
    initial_incidents_count = len(mgr._incidents)
    initial_remediations_count = len(mgr._remediations)

    with patch("app.incidents.manager.correlator", corr):
        with patch("app.incidents.manager.ollama_client", client):
            resp = mgr.analyze_system_state()
            assert resp.success is True
            assert resp.condition == "services_healthy"
            assert resp.remediation is None
            # No new incident or remediation created!
            assert len(mgr._incidents) == initial_incidents_count
            assert len(mgr._remediations) == initial_remediations_count


# =====================================================================
# 4. EDGE CASE: MISSING METRICS NEVER FABRICATES ZEROES
# =====================================================================

def test_missing_metrics_never_fabricates_zeroes():
    """Validates that missing metrics remain None and are never replaced with false zeroes."""
    metrics = MetricsEvidence(
        cpu_usage=None,
        error_rate=None,
        memory_mb=None,
        p95_latency_ms=None,
    )
    assert metrics.cpu_usage is None
    assert metrics.error_rate is None
    assert metrics.memory_mb is None

    service = ServiceEvidence(
        name="worker",
        status="running",
        health="unknown",
        cpu_percent=None,
        memory_mb=None,
        uptime_seconds=None,
    )
    assert service.cpu_percent is None
    assert service.memory_mb is None
    assert service.uptime_seconds is None


# =====================================================================
# 5. EDGE CASE: MISSING LOGS HANDLED SAFELY
# =====================================================================

def test_missing_logs_handled_safely():
    """Validates that empty logs are handled gracefully without index or key errors."""
    mock_connector = MagicMock(spec=DockerConnector)
    mock_connector.get_connectivity_status.return_value = {
        "connected": True,
        "status": "connected",
        "error": None,
        "containers_count": 1,
    }
    mock_connector.list_services.return_value = [
        {"name": "worker", "status": "running", "health": "healthy"}
    ]
    mock_connector.get_service_logs.return_value = []

    corr = EvidenceCorrelator(connector=mock_connector)
    context = corr.collect_system_context(service_name="worker", custom_logs=[])

    assert context.condition == "services_healthy"
    assert context.services[0].logs == []

    client = OllamaIntegrationClient(mock_mode=True)
    res = client.investigate_incident(context)
    assert res.overall_status == "healthy"


# =====================================================================
# 6. EDGE CASE: MALFORMED OLLAMA JSON OUTPUT
# =====================================================================

def test_malformed_ollama_output_handled_gracefully():
    """Validates that malformed JSON or schema violation from Ollama is caught and uses safe fallback."""
    client = OllamaIntegrationClient(mock_mode=False)

    sample_context = IncidentContext(
        condition="services_unhealthy",
        docker=DockerConnectionStatus(connected=True, status="connected"),
        services=[ServiceEvidence(name="api", status="running", health="unhealthy", logs=["Error"])],
        target_service="api",
    )

    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "response": '{"invalid_field": 12345, "broken": true}'
    }
    mock_resp.raise_for_status.return_value = None

    with patch("httpx.Client.post") as mock_post:
        mock_post.return_value = mock_resp
        res = client.investigate_incident(sample_context)
        assert isinstance(res, InvestigationResult)
        assert res.overall_status == "degraded"
        assert "malformed JSON schema" in res.explanation


# =====================================================================
# 7. EDGE CASE: OLLAMA TIMEOUT
# =====================================================================

def test_ollama_timeout_handled_gracefully():
    """Validates that Ollama HTTP timeout is caught and returns safe fallback."""
    client = OllamaIntegrationClient(mock_mode=False, timeout=2)

    sample_context = IncidentContext(
        condition="services_unhealthy",
        docker=DockerConnectionStatus(connected=True, status="connected"),
        services=[ServiceEvidence(name="api", status="running", health="unhealthy", logs=["DB connection refused"])],
        target_service="api",
    )

    with patch("httpx.Client.post") as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Read timed out after 2 seconds")
        res = client.investigate_incident(sample_context)
        assert isinstance(res, InvestigationResult)
        assert res.overall_status == "degraded"
        assert "timed out after 2s" in res.explanation


# =====================================================================
# 8. API ENDPOINTS INTEGRATION
# =====================================================================

def test_get_health_summary_endpoint():
    """Tests GET /api/services/health-summary response structure."""
    with patch.object(correlator.connector, "get_connectivity_status") as mock_conn:
        mock_conn.return_value = {
            "connected": True,
            "status": "connected",
            "containers_count": 1,
            "error": None,
        }
        with patch.object(correlator.connector, "list_services") as mock_list:
            mock_list.return_value = [
                {"name": "demo-api", "status": "running", "health": "healthy", "id": "abc12345"}
            ]
            summary = get_health_summary()
            assert summary.docker.connected is True
            assert summary.services_count == 1
            assert summary.healthy_count == 1
            assert summary.unhealthy_count == 0
            assert summary.status == "healthy"
            assert "api" in summary.independent_checks


def test_post_incidents_analyze_endpoint():
    """Tests POST /api/incidents/analyze endpoint."""
    with patch.object(correlator.connector, "get_connectivity_status") as mock_conn:
        mock_conn.return_value = {
            "connected": False,
            "status": "disconnected",
            "containers_count": None,
            "error": "Daemon unreachable",
        }
        req = AnalyzeIncidentRequest(service_name="demo-api", trigger="manual")
        resp = analyze_incident(req)
        assert resp.success is True
        assert resp.condition == "docker_offline"
        assert resp.context.docker.connected is False
        assert resp.investigation.overall_status == "unknown"
