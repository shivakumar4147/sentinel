"""Failure and abnormal condition detection logic."""

from typing import Optional, Tuple
from app.monitoring.metrics import ServiceMetricsSnapshot


class AnomalyDetector:
    def __init__(
        self,
        error_rate_threshold: float = 5.0,
        cpu_threshold: float = 85.0,
        latency_threshold_ms: float = 1000.0,
    ):
        self.error_rate_threshold = error_rate_threshold
        self.cpu_threshold = cpu_threshold
        self.latency_threshold_ms = latency_threshold_ms

    def detect_anomaly(self, snapshot: ServiceMetricsSnapshot) -> Tuple[bool, Optional[str], str]:
        """Evaluates metrics against operational thresholds.

        Returns: (is_anomalous, summary_message, severity)
        """
        if snapshot.error_rate_percent >= 30.0:
            return True, f"Critical 5xx error rate at {snapshot.error_rate_percent}%", "critical"

        if snapshot.error_rate_percent >= self.error_rate_threshold:
            return True, f"Elevated error rate at {snapshot.error_rate_percent}%", "high"

        if snapshot.cpu_usage_percent >= self.cpu_threshold:
            return True, f"High CPU utilization at {snapshot.cpu_usage_percent}%", "medium"

        if snapshot.p95_latency_ms >= self.latency_threshold_ms:
            return True, f"Severe latency degradation (p95: {snapshot.p95_latency_ms}ms)", "medium"

        return False, None, "low"


anomaly_detector = AnomalyDetector()
