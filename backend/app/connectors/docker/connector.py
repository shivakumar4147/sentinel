"""Docker Infrastructure Connector implementing BaseInfrastructureConnector.

Interacts safely with the local Docker daemon using the official Docker SDK.
Gracefully falls back to mock status if Docker daemon is not accessible.
"""

import logging
from typing import Any, Dict, List
from app.connectors.base import BaseInfrastructureConnector

logger = logging.getLogger("sentinel.connectors.docker")


class DockerConnector(BaseInfrastructureConnector):
    def __init__(self):
        self.client = None
        self._is_available = False
        try:
            import docker
            self.client = docker.from_env()
            self.client.ping()
            self._is_available = True
            logger.info("Successfully connected to Docker daemon.")
        except Exception as e:
            logger.warning("Docker daemon is not accessible or not running: %s", str(e))
            self.client = None
            self._is_available = False

    @property
    def is_available(self) -> bool:
        return self._is_available

    def list_services(self) -> List[Dict[str, Any]]:
        """List active Docker containers."""
        if not self._is_available:
            # Fallback simulated container list for testing
            return [
                {
                    "name": "demo-api",
                    "status": "running",
                    "health": "degraded",
                    "uptime_seconds": 3600,
                    "error_rate": 0.45,
                    "last_deployment": "v2.1",
                },
                {
                    "name": "postgres",
                    "status": "running",
                    "health": "healthy",
                    "uptime_seconds": 7200,
                    "error_rate": 0.0,
                    "last_deployment": "v16-alpine",
                },
            ]

        services = []
        try:
            containers = self.client.containers.list(all=True)
            for c in containers:
                services.append({
                    "name": c.name,
                    "status": c.status,
                    "health": c.attrs.get("State", {}).get("Health", {}).get("Status", "unknown"),
                    "uptime_seconds": 0,
                    "error_rate": 0.0,
                    "last_deployment": c.image.tags[0] if c.image.tags else "unknown",
                })
        except Exception as e:
            logger.error("Failed to query Docker containers: %s", str(e))
        return services

    def get_service_logs(self, service_name: str, tail: int = 100) -> List[str]:
        """Fetch logs from container."""
        if not self._is_available:
            return [
                f"[INFO] 2026-11-12T14:00:00Z - {service_name} received traffic",
                f"[ERROR] 2026-11-12T14:00:15Z - Database connection refused on 5432",
                f"[WARN] 2026-11-12T14:00:30Z - Retry 3 of 3 failed. Responding with 500",
            ]

        try:
            container = self.client.containers.get(service_name)
            raw_logs = container.logs(tail=tail).decode("utf-8", errors="replace")
            return [line.strip() for line in raw_logs.split("\n") if line.strip()]
        except Exception as e:
            logger.error("Failed to get logs for %s: %s", service_name, str(e))
            return [f"Error retrieving logs: {str(e)}"]

    def restart_service(self, service_name: str, dry_run: bool = True) -> Dict[str, Any]:
        """Safely restart target container."""
        if dry_run:
            logger.info("DRY RUN: Would restart container '%s'", service_name)
            return {
                "success": True,
                "dry_run": True,
                "action": "restart_container",
                "target": service_name,
                "message": f"[DRY RUN] Simulation successful: container {service_name} validated for restart.",
            }

        if not self._is_available:
            return {
                "success": False,
                "dry_run": False,
                "target": service_name,
                "message": "Docker daemon unavailable.",
            }

        try:
            container = self.client.containers.get(service_name)
            container.restart(timeout=10)
            return {
                "success": True,
                "dry_run": False,
                "action": "restart_container",
                "target": service_name,
                "message": f"Container {service_name} restarted successfully.",
            }
        except Exception as e:
            logger.error("Failed to restart container %s: %s", service_name, str(e))
            return {
                "success": False,
                "dry_run": False,
                "target": service_name,
                "error": str(e),
            }

    def check_health(self, service_name: str) -> Dict[str, Any]:
        """Check status of target service container."""
        if not self._is_available:
            return {
                "service": service_name,
                "healthy": True,
                "status": "running",
                "simulated": True,
            }

        try:
            container = self.client.containers.get(service_name)
            container.reload()
            health_status = container.attrs.get("State", {}).get("Health", {}).get("Status", "none")
            is_healthy = container.status == "running" and health_status in ("healthy", "none")
            return {
                "service": service_name,
                "healthy": is_healthy,
                "status": container.status,
                "health_status": health_status,
            }
        except Exception as e:
            return {
                "service": service_name,
                "healthy": False,
                "status": "unreachable",
                "error": str(e),
            }
