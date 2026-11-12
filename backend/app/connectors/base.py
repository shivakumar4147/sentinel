"""Abstract Base Connector for infrastructure interaction."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class BaseInfrastructureConnector(ABC):
    """Abstract interface defining required infrastructure operations.

    Ensures provider-agnostic separation and prevents unrestricted commands.
    """

    @abstractmethod
    def list_services(self) -> List[Dict[str, Any]]:
        """List running monitored containers/services."""
        pass

    @abstractmethod
    def get_service_logs(self, service_name: str, tail: int = 100) -> List[str]:
        """Fetch latest logs for a given service."""
        pass

    @abstractmethod
    def restart_service(self, service_name: str, dry_run: bool = True) -> Dict[str, Any]:
        """Safely restart a service container or pod."""
        pass

    @abstractmethod
    def check_health(self, service_name: str) -> Dict[str, Any]:
        """Verify the health status of a target service."""
        pass

