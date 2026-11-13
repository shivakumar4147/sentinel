"""Incident Lifecycle Manager.

Coordinates incident state transitions, AI investigations, safety checks,
and audit logs.
"""

from datetime import datetime
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
    IncidentDetailResponse,
    IncidentSummary,
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
        logger.info("AUDIT: [%s] %s by %s: %s", incident_id or "SYSTEM", action, actor, json.dumps(details))

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
        ai_result: AIInvestigationResponse = await ollama_client.investigate_incident(evidence)
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

        rem["status"] = "executing"
        incident_id = rem["incident_id"]
        if incident_id in self._incidents:
            self._incidents[incident_id]["status"] = "remediating"
            self._incidents[incident_id]["updated_at"] = datetime.utcnow()

        self.log_audit("REMEDIATION_EXECUTION_TRIGGERED", incident_id, "remediation_executor", {"remediation_id": remediation_id})

        # Run via executor
        exec_result = remediation_executor.execute(
            action_type=rem["action_type"],
            target_service=rem["target_service"],
            risk_level=rem["risk_level"],
            confidence=rem.get("confidence", 0.9),
            is_approved=rem.get("is_approved", False),
            approved_by=rem.get("approved_by", "system"),
            dry_run=rem["dry_run"],
        )

        rem["status"] = "completed" if exec_result["success"] else "failed"
        rem["output"] = json.dumps(exec_result)

        if incident_id in self._incidents:
            self._incidents[incident_id]["status"] = "verifying" if exec_result["success"] else "remediation_failed"
            self._incidents[incident_id]["updated_at"] = datetime.utcnow()

        self.log_audit(
            "REMEDIATION_EXECUTED",
            incident_id,
            "remediation_executor",
            {"success": exec_result["success"], "dry_run": rem["dry_run"], "details": exec_result},
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
