"""Tests for Health and Service inventory endpoints."""

import pytest
from app.api.routes.health import get_health
from app.api.routes.services import list_services
from app.main import root


def test_health_endpoint():
    data = get_health()
    assert data.status == "healthy"
    assert data.version == "0.1.0"
    assert hasattr(data, "dry_run")
    assert hasattr(data, "docker_available")
    assert hasattr(data, "docker_status")


def test_root_endpoint():
    data = root()
    assert data["status"] == "operational"
    assert data["documentation"] == "/docs"


def test_services_endpoint():
    data = list_services()
    assert hasattr(data, "services")
    assert isinstance(data.services, list)
    assert hasattr(data, "total")
    assert hasattr(data, "docker_connected")
    assert hasattr(data, "source")
