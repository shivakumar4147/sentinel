# Sentinel API Contracts

All endpoints are served under `/api` by default. Interactive OpenAPI documentation is accessible at `/docs`.

---

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "timestamp": "2026-11-12T14:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Incident INC-001 was not found.",
    "details": {}
  },
  "timestamp": "2026-11-12T14:30:00Z"
}
```

---

## Endpoints Specification

### 1. Health & Readiness
- **GET `/api/health`**
  - **Purpose**: System health check, component connectivity, and database status.
  - **Response 200**:
    ```json
    {
      "status": "healthy",
      "version": "0.1.0",
      "database": "connected",
      "ollama": "reachable",
      "docker": "available",
      "dry_run": true
    }
    ```

### 2. Services Inventory
- **GET `/api/services`**
  - **Purpose**: List monitored infrastructure services and current status.
  - **Response 200**:
    ```json
    {
      "services": [
        {
          "name": "demo-api",
          "status": "running",
          "health": "degraded",
          "uptime_seconds": 3600,
          "error_rate": 0.15,
          "last_deployment": "v2.1"
        }
      ]
    }
    ```

### 3. Incidents Management
- **GET `/api/incidents`**
  - **Purpose**: List all recorded incidents with optional filtering by status or severity.
  - **Query Params**: `status`, `severity`, `limit`, `offset`
  - **Response 200**:
    ```json
    {
      "incidents": [
        {
          "incident_id": "INC-001",
          "service": "demo-api",
          "status": "investigating",
          "severity": "high",
          "summary": "Elevated 500 HTTP error rates",
          "created_at": "2026-11-12T14:00:00Z"
        }
      ],
      "total": 1
    }
    ```

- **GET `/api/incidents/{incident_id}`**
  - **Purpose**: Retrieve full details of an incident including evidence, timeline, and remediation state.
  - **Response 200**:
    ```json
    {
      "incident_id": "INC-001",
      "service": "demo-api",
      "status": "pending_approval",
      "severity": "high",
      "evidence": {
        "logs": ["Database connection refused on port 5432"],
        "metrics": {"cpu_usage": 78, "error_rate": 45},
        "recent_changes": ["Deployment v2.1"],
        "dependency_status": {"database": "unreachable"}
      },
      "investigation": {
        "root_cause": "Database connection failure",
        "confidence": 0.87,
        "recommended_action": "check_database_connectivity",
        "risk_level": "medium",
        "requires_approval": true
      },
      "created_at": "2026-11-12T14:00:00Z"
    }
    ```

- **POST `/api/incidents/{incident_id}/investigate`**
  - **Purpose**: Trigger AI investigation for an incident.
  - **Response 200**: Returns AI root cause, confidence score, and proposed action.

- **POST `/api/incidents/{incident_id}/verify`**
  - **Purpose**: Verify service health recovery following an action.
  - **Response 200**:
    ```json
    {
      "incident_id": "INC-001",
      "recovered": true,
      "checks": {
        "http_status": "200 OK",
        "error_rate": 0.0,
        "latency_ms": 42
      },
      "current_status": "resolved"
    }
    ```

### 4. Remediation & Human Approvals
- **POST `/api/remediations/{remediation_id}/approve`**
  - **Purpose**: Operator authorizes a pending remediation plan.
  - **Request Body**:
    ```json
    {
      "approver": "oncall-dev@company.internal",
      "notes": "Approved after reviewing database replica logs."
    }
    ```

- **POST `/api/remediations/{remediation_id}/reject`**
  - **Purpose**: Operator rejects a pending remediation plan.
  - **Request Body**:
    ```json
    {
      "operator": "oncall-dev@company.internal",
      "reason": "False positive; scheduled migration in progress."
    }
    ```

- **POST `/api/remediations/{remediation_id}/execute`**
  - **Purpose**: Execute an approved or auto-permitted remediation step.
  - **Response 200**: Execution output, status, and verification state.

### 5. Audit Logging
- **GET `/api/audit-logs`**
  - **Purpose**: Query immutable timeline of detections, AI recommendations, approvals, and actions.
  - **Response 200**:
    ```json
    {
      "logs": [
        {
          "id": "AUD-1001",
          "incident_id": "INC-001",
          "action": "ACTION_APPROVED",
          "actor": "oncall-dev@company.internal",
          "details": {"action_type": "restart_container", "target": "demo-api"},
          "timestamp": "2026-11-12T14:05:00Z"
        }
      ]
    }
    ```
