"""Metrics models and snapshots."""

from typing import Dict, Any
from pydantic import BaseModel, Field


class ServiceMetricsSnapshot(BaseModel):
    service: str
    cpu_usage_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    memory_usage_mb: float = Field(default=0.0)
    error_rate_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    p95_latency_ms: float = Field(default=0.0)
    http_5xx_count: int = Field(default=0)
    uptime_seconds: int = Field(default=0)


def format_metrics_for_ai(snapshot: ServiceMetricsSnapshot) -> Dict[str, Any]:
    """Formats metrics snapshot to match Section 7 incident input."""
    return {
        "cpu_usage": round(snapshot.cpu_usage_percent, 1),
        "error_rate": round(snapshot.error_rate_percent, 1),
        "memory_mb": round(snapshot.memory_usage_mb, 1),
        "p95_latency_ms": round(snapshot.p95_latency_ms, 1),
    }
