"""Unit tests for Read-Only Docker Connector using mocks.

Verifies:
1. Running and stopped container discovery.
2. Collection of id, name, image, status, health, created, logs, cpu/memory.
3. Graceful connection failure handling (no crashing).
4. Conditional mock fallback (only when MOCK_SERVICES_FALLBACK is True).
5. Read-only safety (mutations rejected).
6. Secret hygiene (no environment variables or secrets exposed).
"""

from unittest.mock import MagicMock, patch
import pytest
from app.connectors.docker.connector import DockerConnector
from app.core.config import settings


@pytest.fixture
def mock_running_container():
    """Mock of a running Docker container with healthcheck and stats."""
    container = MagicMock()
    container.id = "abcdef1234567890abcdef"
    container.short_id = "abcdef123456"
    container.name = "sentinel-demo-api"
    container.status = "running"
    
    # Image
    image = MagicMock()
    image.tags = ["sentinel/demo-api:v1.0"]
    container.image = image

    # Attributes
    container.attrs = {
        "Created": "2026-11-12T10:00:00.000000000Z",
        "Config": {
            "Image": "sentinel/demo-api:v1.0",
            "Env": ["SECRET_KEY=supersecret123", "DB_PASSWORD=mypassword"],  # Secret test
        },
        "State": {
            "Status": "running",
            "StartedAt": "2026-11-12T10:01:00.000000000Z",
            "Health": {"Status": "healthy"},
        },
    }

    # Logs
    container.logs.return_value = b"Log line 1\nLog line 2\nLog line 3\n"

    # Stats
    container.stats.return_value = {
        "memory_stats": {
            "usage": 268435456,   # 256 MB
            "limit": 1073741824,  # 1024 MB
        },
        "cpu_stats": {
            "cpu_usage": {"total_usage": 200000000},
            "system_cpu_usage": 1000000000,
            "online_cpus": 2,
        },
        "precpu_stats": {
            "cpu_usage": {"total_usage": 100000000},
            "system_cpu_usage": 500000000,
        },
    }
    return container


@pytest.fixture
def mock_stopped_container():
    """Mock of an exited / stopped Docker container without live stats."""
    container = MagicMock()
    container.id = "9876543210fedcba987654"
    container.short_id = "9876543210fe"
    container.name = "worker-batch-job"
    container.status = "exited"

    image = MagicMock()
    image.tags = ["sentinel/worker:latest"]
    container.image = image

    container.attrs = {
        "Created": "2026-11-12T08:00:00.000000000Z",
        "Config": {
            "Image": "sentinel/worker:latest",
            "Env": ["API_TOKEN=supersecret_token"],
        },
        "State": {
            "Status": "exited",
            "StartedAt": "2026-11-12T08:01:00.000000000Z",
        },
    }

    container.logs.return_value = b"Task started\nTask finished with exit code 0\n"
    # Stopped containers do not return live stream stats
    container.stats.side_effect = Exception("Container not running")
    return container


def test_discover_running_and_stopped_containers(mock_running_container, mock_stopped_container):
    """Verifies that connector discovers both running and stopped containers and collects all required fields."""
    mock_client = MagicMock()
    mock_client.ping.return_value = True
    mock_client.containers.list.return_value = [mock_running_container, mock_stopped_container]
    mock_client.containers.get.side_effect = lambda name: (
        mock_running_container if name == "sentinel-demo-api" else mock_stopped_container
    )

    with patch("docker.from_env", return_value=mock_client):
        connector = DockerConnector()
        assert connector.is_available is True

        services = connector.list_services()
        assert len(services) == 2

        # 1. Verify Running Container fields
        running = next(s for s in services if s["name"] == "sentinel-demo-api")
        assert running["id"] == "abcdef123456"
        assert running["image"] == "sentinel/demo-api:v1.0"
        assert running["status"] == "running"
        assert running["health"] == "healthy"
        assert running["health_status"] == "healthy"
        assert running["created_at"] == "2026-11-12T10:00:00.000000000Z"
        assert len(running["logs"]) == 3
        assert running["logs"][0] == "Log line 1"
        assert running["memory_mb"] == 256.0
        assert running["memory_limit_mb"] == 1024.0
        assert running["cpu_percent"] is not None
        assert running["cpu_percent"] > 0

        # 2. Verify Stopped Container fields
        stopped = next(s for s in services if s["name"] == "worker-batch-job")
        assert stopped["id"] == "9876543210fe"
        assert stopped["image"] == "sentinel/worker:latest"
        assert stopped["status"] == "exited"
        assert stopped["health"] == "stopped"
        assert stopped["health_status"] is None
        assert len(stopped["logs"]) == 2
        # Stopped containers must safely report None for stats
        assert stopped["cpu_percent"] is None
        assert stopped["memory_mb"] is None


def test_secret_hygiene_ensures_no_credentials_exposed(mock_running_container):
    """Ensures environment variables and secrets are never returned in service dictionary."""
    mock_client = MagicMock()
    mock_client.ping.return_value = True
    mock_client.containers.list.return_value = [mock_running_container]
    mock_client.containers.get.return_value = mock_running_container

    with patch("docker.from_env", return_value=mock_client):
        connector = DockerConnector()
        services = connector.list_services()
        item = services[0]

        # Verify no secret fields exist
        assert "env" not in item
        assert "Env" not in item
        assert "Config" not in item
        assert "secrets" not in item
        # Check string representation does not leak SECRET_KEY
        item_str = str(item)
        assert "supersecret123" not in item_str
        assert "mypassword" not in item_str


def test_graceful_handling_when_docker_unavailable():
    """Verifies that API does not crash when Docker daemon is offline."""
    with patch("docker.from_env", side_effect=Exception("Docker daemon socket not found")):
        # MOCK_SERVICES_FALLBACK=False (default behavior)
        with patch.object(settings, "MOCK_SERVICES_FALLBACK", False):
            connector = DockerConnector()
            assert connector.is_available is False
            assert connector.last_error is not None
            assert "Docker daemon socket not found" in connector.last_error

            # Must return empty list, not crash or raise exception
            services = connector.list_services()
            assert services == []

            status_info = connector.get_connectivity_status()
            assert status_info["connected"] is False
            assert status_info["status"] == "disconnected"


def test_mock_fallback_only_when_explicitly_configured():
    """Verifies mock data is returned ONLY when MOCK_SERVICES_FALLBACK is True."""
    with patch("docker.from_env", side_effect=Exception("Daemon unreachable")):
        # Explicitly enable development fallback
        with patch.object(settings, "MOCK_SERVICES_FALLBACK", True):
            connector = DockerConnector()
            services = connector.list_services()
            assert len(services) == 2
            names = [s["name"] for s in services]
            assert "demo-api" in names
            assert "postgres" in names


def test_read_only_safety_restriction():
    """Verifies that mutating operations are strictly rejected by the connector."""
    with patch("docker.from_env"):
        connector = DockerConnector()
        # Mutating restart must be blocked
        result = connector.restart_service("demo-api", dry_run=False)
        assert result["success"] is False
        assert "READ-ONLY SAFETY POLICY" in result["error"]

        # Dry run simulation is permitted
        dry_result = connector.restart_service("demo-api", dry_run=True)
        assert dry_result["success"] is True
        assert dry_result["dry_run"] is True


def test_api_services_endpoint_integration(mock_running_container):
    """Verifies GET /api/services returns normalized JSON schema with container data."""
    mock_client = MagicMock()
    mock_client.ping.return_value = True
    mock_client.containers.list.return_value = [mock_running_container]
    mock_client.containers.get.return_value = mock_running_container

    with patch("docker.from_env", return_value=mock_client):
        from app.remediation.executor import docker_connector
        # Refresh connector with mocked client
        docker_connector._client = mock_client
        docker_connector._is_available = True

        from app.api.routes.services import list_services
        response = list_services()

        assert response.total == 1
        assert response.docker_connected is True
        assert response.source == "docker"
        svc = response.services[0]
        assert svc.name == "sentinel-demo-api"
        assert svc.id == "abcdef123456"
        assert svc.status == "running"
        assert svc.health == "healthy"
        assert svc.cpu_percent is not None
        assert svc.memory_mb == 256.0


def test_api_health_endpoint_reports_docker_connectivity():
    """Verifies GET /api/health indicates Docker status."""
    mock_client = MagicMock()
    mock_client.ping.return_value = True
    mock_client.containers.list.return_value = []

    with patch("docker.from_env", return_value=mock_client):
        from app.remediation.executor import docker_connector
        docker_connector._client = mock_client
        docker_connector._is_available = True

        from app.api.routes.health import get_health
        response = get_health()
        assert response.status == "healthy"
        assert response.docker_status == "connected"
        assert response.docker_available is True
