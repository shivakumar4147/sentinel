# Sentinel Data Schemas & Integration Contracts

This document formalizes the data contracts between the Backend (Member 1), Frontend (Member 2), AI Engine (Member 3), and Monitoring/Demo (Member 4).

---

## 1. AI Investigation Contract (Member 1 <-> Member 3)

### Incident Evidence Payload (Sent by Backend to AI Engine)
```json
{
  "incident_id": "INC-001",
  "service": "api",
  "logs": [
    "Database connection refused"
  ],
  "metrics": {
    "cpu_usage": 78,
    "error_rate": 45
  },
  "recent_changes": [
    "Deployment v2.1"
  ],
  "dependency_status": {
    "database": "unreachable"
  }
}
```

### AI Investigation Response (Returned by Member 3 Ollama module)
```json
{
  "root_cause": "Database connection failure",
  "confidence": 0.87,
  "evidence": [
    "Database connection refused",
    "API error rate increased"
  ],
  "recommended_action": "check_database_connectivity",
  "risk_level": "medium",
  "requires_approval": true
}
```

---

## 2. Permitted Remediation Action Types

The Safety Policy Engine enforces that `recommended_action` MUST be one of the explicitly whitelisted deterministic action identifiers:

| Action Identifier | Allowed Risk Levels | Default Human Approval | Allowed Target |
| :--- | :--- | :--- | :--- |
| `restart_container` | `low`, `medium` | Required for production / databases | Containers |
| `rollback_deployment` | `medium`, `high` | Required | Services |
| `scale_replicas` | `low`, `medium` | Optional (if within bounds) | Deployments |
| `clear_cache` | `low` | Not required | Redis/Memcached |
| `check_database_connectivity` | `low` | Not required (read-only) | Databases |
| `isolate_traffic` | `high` | Required | Ingress/Routing |

Any action not present in the catalog is automatically blocked by the Safety Engine.

---

## 3. Risk Levels
- `low`: Read-only actions or low-impact cache invalidations. Can be automated if policy permits.
- `medium`: Container restarts or non-destructive scaling. Requires human approval by default.
- `high`: Rollbacks, traffic shedding, or stateful service restarts. Always requires human approval.

---

## 4. Audit Log Schema
```json
{
  "id": "AUD-001",
  "incident_id": "INC-001",
  "timestamp": "2026-11-12T14:02:15Z",
  "actor": "system | ai_engine | operator:<email>",
  "event_type": "DETECTION | INFERENCE | SAFETY_CHECK | APPROVAL | EXECUTION | VERIFICATION",
  "payload": {
    "details": "..."
  }
}
```
