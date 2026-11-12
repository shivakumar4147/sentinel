"""Shared pytest fixtures for Sentinel backend test suite."""

import os
import sys
from unittest.mock import MagicMock, patch
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture(autouse=True)
def mock_docker_environment(monkeypatch):
    """Automatically mocks Docker SDK environment for all tests unless explicitly overridden."""
    mock_client = MagicMock()
    mock_client.ping.return_value = True
    mock_client.containers.list.return_value = []
    
    # Configure default mock container for check_health / get
    default_container = MagicMock()
    default_container.status = "running"
    default_container.attrs = {"State": {"Health": {"Status": "healthy"}}}
    mock_client.containers.get.return_value = default_container

    with patch("docker.from_env", return_value=mock_client):
        yield mock_client
