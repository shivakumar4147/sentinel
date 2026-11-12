"""Incident Lifecycle Manager.

Coordinates incident state transitions, AI investigations, safety checks,
and audit logs.
"""

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional
from app.incidents.correlator import correlator
from app.integrations.ollama_client import ollama_client
from app.remediation.executor import remediation_executor
from app.safety.policy_engine import safety_engine
from app.schemas import (
    AIIncidentInput,
    AIInvestigationResponse,
    AnalyzeIncidentRequest,
    AnalyzeIncidentResponse,
    IncidentContext,
    IncidentDetailResponse,
    IncidentSummary,
    InvestigationResult,
    RemediationActionStatus,
    VerificationResponse,
)

logger = logging.getLogger("sentinel.incidents.manager")


class IncidentManager:
    """In-memory and persistent state coordinator for Sentinel incidents."""

    def __init__(self):
        # In-memory storage for hackathon rapid iteration & zero-config operation
        self._incidents: Dict[str, Dict[str, Any]] = {}
        self._remediations: Dict[str, Dict[str, Any]] = {}
        self._audit_logs: List[Dict[str, Any]] = []

        # Seed initial sample incident matching Section 7 for immediate testing
        self._seed_initial_incident()

    def _seed_initial_incident(self):
        incident_id = "INC-001"
        self._incidents[incident_id] = {
            "incident_id": incident_id,
            "service": "api",
            "status": "triggered",
            "severity": "high",
            "summary": "Database connection refused on target service",
            "evidence": AIIncidentInput(
                incident_id=incident_id,
                service="api",
                logs=["Database connection refused"],
                metrics={"cpu_usage": 78, "error_rate": 45},
                recent_changes=["Deployment v2.1"],
                dependency_status={"database": "unreachable"},
            ),
            "investigation": None,
            "remediation_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self.log_audit(
            action="INCIDENT_TRIGGERED",
            incident_id=incident_id,
            actor="monitoring_detection",
            details={"service": "api", "severity": "high"},
        )

    def log_audit(self, action: str, incident_id: Optional[str], actor: str, details: Dict[str, Any]):
        """Appends an immutable audit event."""
        log_entry = {
            "id": f"AUD-{len(self._audit_logs) + 1001}",
            "incident_id": incident_id,
            "action": action,
            "actor": actor,
            "details": details,
            "timestamp": datetime.utcnow(),
        }
        self._audit_logs.append(log_entry)
        logger.info("AUDIT: [%s] %s by %s: %s", incident_id or "SYSTEM", action, actor, json.dumps(details, default=str))

    def list_incidents(self) -> List[IncidentSummary]:
        results = []
        for inc in self._incidents.values():
            results.append(
                IncidentSummary(
                    incident_id=inc["incident_id"],
                    service=inc["service"],
                    status=inc["status"],
                    severity=inc["severity"],
                    summary=inc["summary"],
                    created_at=inc["created_at"],
                )
            )
        return results

    def get_incident(self, incident_id: str) -> Optional[IncidentDetailResponse]:
        inc = self._incidents.get(incident_id)
        if not inc:
            return None

        return IncidentDetailResponse(
            incident_id=inc["incident_id"],
            service=inc["service"],
            status=inc["status"],
            severity=inc["severity"],
            summary=inc["summary"],
            evidence=inc["evidence"],
            investigation=inc["investigation"],
            remediation_id=inc["remediation_id"],
            created_at=inc["created_at"],
            updated_at=inc["updated_at"],
        )

    async def investigate_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        inc = self._incidents.get(incident_id)
        if not inc:
            return None

        inc["status"] = "investigating"
        inc["updated_at"] = datetime.utcnow()
        self.log_audit("INVESTIGATION_STARTED", incident_id, "backend_control_plane", {"service": inc["service"]})

        # 1. Dispatch context to Ollama module
        evidence = inc["evidence"]
        ai_result: AIInvestigationResponse = ollama_client.investigate_incident(evidence)
        inc["investigation"] = ai_result

        # 2. Evaluate with Safety Policy Engine
        policy_eval = safety_engine.evaluate(
            recommended_action=ai_result.recommended_action,
            target_service=inc["service"],
            ai_risk_level=ai_result.risk_level,
            confidence=ai_result.confidence,
        )

        # 3. Create remediation record
        remediation_id = f"REM-{len(self._remediations) + 101}"
        inc["remediation_id"] = remediation_id

        remediation_record = {
            "remediation_id": remediation_id,
            "incident_id": incident_id,
            "action_type": ai_result.recommended_action,
            "target_service": inc["service"],
            "risk_level": policy_eval.risk_level.value,
            "status": "pending_approval" if policy_eval.requires_approval else "ready",
            "dry_run": policy_eval.dry_run,
            "requires_approval": policy_eval.requires_approval,
            "is_approved": not policy_eval.requires_approval,
            "confidence": ai_result.confidence,
            "approval_notes": None,
            "output": None,
            "created_at": datetime.utcnow(),
        }
        self._remediations[remediation_id] = remediation_record

        inc["status"] = "pending_approval" if policy_eval.requires_approval else "ready_for_execution"
        inc["updated_at"] = datetime.utcnow()

        self.log_audit(
            "INVESTIGATION_COMPLETED",
            incident_id,
            "ai_engine_ollama",
            {
                "root_cause": ai_result.root_cause,
                "confidence": ai_result.confidence,
                "recommended_action": ai_result.recommended_action,
                "risk_level": policy_eval.risk_level.value,
                "requires_approval": policy_eval.requires_approval,
            },
        )

        return {
            "incident_id": incident_id,
            "investigation": ai_result.model_dump(),
            "remediation": remediation_record,
        }

    def analyze_system_state(
        self,
        service_name: Optional[str] = None,
        custom_logs: Optional[List[str]] = None,
        custom_metrics: Optional[Any] = None,
    ) -> AnalyzeIncidentResponse:
        """Runs the three-state incident analysis workflow:
        1. Collects system context (docker_offline, services_unhealthy, services_healthy)
        2. Queries Ollama for investigation
        3. Evaluates safety policy if an action is recommended
        4. Returns validated AnalyzeIncidentResponse without creating false incidents when healthy
        """
        context: IncidentContext = correlator.collect_system_context(
            service_name=service_name,
            custom_logs=custom_logs,
            custom_metrics=custom_metrics,
        )
        investigation: InvestigationResult = ollama_client.investigate_incident(context)

        # Condition 3: Healthy services
        if context.condition == "services_healthy":
            self.log_audit(
                "SYSTEM_HEALTH_CHECK_COMPLETED",
                None,
                "ai_engine_ollama",
                {"overall_status": "healthy", "service": service_name or "api"},
            )
            return AnalyzeIncidentResponse(
                success=True,
                condition="services_healthy",
                context=context,
                investigation=investigation,
                remediation=None,
                message="All monitored services and containers are healthy. No remediation required.",
            )

        # Condition 1: Docker offline
        if context.condition == "docker_offline":
            self.log_audit(
                "DOCKER_CONNECTIVITY_ISSUE_DETECTED",
                None,
                "docker_connector",
                {"error": context.docker.error, "overall_status": "unknown"},
            )
            return AnalyzeIncidentResponse(
                success=True,
                condition="docker_offline",
                context=context,
                investigation=investigation,
                remediation=None,
                message="Docker daemon is disconnected. Application status cannot be queried via Docker.",
            )

        # Condition 2: Unhealthy services
        target_service = context.target_service or service_name or "api"
        remediation_record = None

        if investigation.recommended_action:
            policy_eval = safety_engine.evaluate(
                recommended_action=investigation.recommended_action,
                target_service=target_service,
                ai_risk_level=investigation.risk,
                confidence=investigation.confidence,
            )

            # Create incident and remediation
            inc_id = f"INC-{len(self._incidents) + 1:03d}"
            rem_id = f"REM-{len(self._remediations) + 101}"

            remediation_record = {
                "remediation_id": rem_id,
                "incident_id": inc_id,
                "action_type": investigation.recommended_action,
                "target_service": target_service,
                "risk_level": policy_eval.risk_level.value,
                "status": "pending_approval" if policy_eval.requires_approval else "ready",
                "dry_run": policy_eval.dry_run,
                "requires_approval": policy_eval.requires_approval,
                "is_approved": not policy_eval.requires_approval,
                "confidence": investigation.confidence,
                "approval_notes": None,
                "output": None,
                "created_at": datetime.now(timezone.utc),
            }
            self._remediations[rem_id] = remediation_record

            self._incidents[inc_id] = {
                "incident_id": inc_id,
                "service": target_service,
                "status": "pending_approval" if policy_eval.requires_approval else "ready_for_execution",
                "severity": "high",
                "summary": f"Detected {investigation.root_cause or 'unhealthy service'}",
                "evidence": AIIncidentInput(
                    incident_id=inc_id,
                    service=target_service,
                    logs=[line for s in context.services for line in s.logs][:5] or ["Service degraded"],
                    metrics={"error_rate": context.metrics.error_rate if context.metrics else None},
                    recent_changes=[c.description for c in context.recent_changes],
                    dependency_status={d.name: d.status for d in context.dependencies},
                ),
                "investigation": investigation,
                "remediation_id": rem_id,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }

            self.log_audit(
                "INCIDENT_TRIGGERED",
                inc_id,
                "correlator_analysis",
                {"service": target_service, "condition": context.condition},
            )
            self.log_audit(
                "INVESTIGATION_COMPLETED",
                inc_id,
                "ai_engine_ollama",
                {
                    "root_cause": investigation.root_cause,
                    "confidence": investigation.confidence,
                    "recommended_action": investigation.recommended_action,
                    "risk_level": policy_eval.risk_level.value,
                    "requires_approval": policy_eval.requires_approval,
                },
            )

        return AnalyzeIncidentResponse(
            success=True,
            condition="services_unhealthy",
            context=context,
            investigation=investigation,
            remediation=remediation_record,
            message=f"Investigation completed: {investigation.root_cause or 'Unhealthy service detected'}",
        )

    def approve_remediation(self, remediation_id: str, approver: str, notes: str) -> Optional[RemediationActionStatus]:
        rem = self._remediations.get(remediation_id)
        if not rem:
            return None

        rem["status"] = "approved"
        rem["is_approved"] = True
        rem["approved_by"] = approver
        rem["approval_notes"] = notes

        incident_id = rem["incident_id"]
        if incident_id in self._incidents:
            self._incidents[incident_id]["status"] = "approved"
            self._incidents[incident_id]["updated_at"] = datetime.utcnow()

        self.log_audit(
            "REMEDIATION_APPROVED",
            incident_id,
            approver,
            {"remediation_id": remediation_id, "action": rem["action_type"], "notes": notes},
        )

        return RemediationActionStatus(**rem)

    def reject_remediation(self, remediation_id: str, operator: str, reason: str) -> Optional[RemediationActionStatus]:
        rem = self._remediations.get(remediation_id)
        if not rem:
            return None

        rem["status"] = "rejected"
        rem["is_approved"] = False
        rem["approval_notes"] = f"Rejected: {reason}"

        incident_id = rem["incident_id"]
        if incident_id in self._incidents:
            self._incidents[incident_id]["status"] = "rejected"
            self._incidents[incident_id]["updated_at"] = datetime.utcnow()

        self.log_audit(
            "REMEDIATION_REJECTED",
            incident_id,
            operator,
            {"remediation_id": remediation_id, "reason": reason},
        )

        return RemediationActionStatus(**rem)

    def execute_remediation(self, remediation_id: str) -> Optional[Dict[str, Any]]:
        rem = self._remediations.get(remediation_id)
        if not rem:
            return None

        # Guard against duplicate concurrent execution
        if rem.get("status") == "executing":
            return {
                "success": False,
                "executed": False,
                "error": f"Remediation '{remediation_id}' is already actively executing.",
            }

        incident_id = rem["incident_id"]

        # Run via executor
        exec_result = remediation_executor.execute(
            action_type=rem["action_type"],
            target_service=rem["target_service"],
            risk_level=rem["risk_level"],
            confidence=rem.get("confidence", 0.9),
            is_approved=rem.get("is_approved", False),
            approved_by=rem.get("approved_by", "system"),
            dry_run=rem["dry_run"],
            incident_id=incident_id,
            remediation_id=remediation_id,
        )

        rem["status"] = "completed" if exec_result.get("success") else "failed"
        rem["output"] = json.dumps(exec_result, default=str)

        if incident_id in self._incidents:
            self._incidents[incident_id]["status"] = "verifying" if exec_result.get("success") else "remediation_failed"
            self._incidents[incident_id]["updated_at"] = datetime.utcnow()

        self.log_audit(
            "REMEDIATION_EXECUTED" if exec_result.get("success") else "REMEDIATION_FAILED",
            incident_id,
            "remediation_executor",
            {
                "remediation_id": remediation_id,
                "success": exec_result.get("success", False),
                "dry_run": rem["dry_run"],
                "error": exec_result.get("error"),
                "details": exec_result,
            },
        )

        return exec_result

    def verify_recovery(self, incident_id: str) -> Optional[VerificationResponse]:
        inc = self._incidents.get(incident_id)
        if not inc:
            return None

        # Verify service health via connector check
        service_name = inc["service"]
        health_check = remediation_executor.connector.check_health(service_name)
        recovered = health_check.get("healthy", False)

        if recovered:
            inc["status"] = "resolved"
            message = f"Service '{service_name}' recovered and confirmed healthy."
        else:
            inc["status"] = "verification_failed"
            message = f"Service '{service_name}' still exhibits degraded health."

        inc["updated_at"] = datetime.utcnow()

        self.log_audit(
            "HEALTH_VERIFICATION",
            incident_id,
            "verification_engine",
            {"recovered": recovered, "checks": health_check},
        )

        return VerificationResponse(
            incident_id=incident_id,
            recovered=recovered,
            checks=health_check,
            current_status=inc["status"],
            message=message,
        )

    def get_audit_logs(self) -> List[Dict[str, Any]]:
        return self._audit_logs


# Global singleton incident manager
incident_manager = IncidentManager()

