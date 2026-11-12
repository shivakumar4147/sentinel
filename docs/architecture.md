# Sentinel System Architecture

## 1. Overview
Sentinel is an autonomous, safety-bounded on-call incident response platform. It monitors containerized applications, captures failure signals, obtains root-cause analysis from an isolated AI engine, evaluates remediation steps through a deterministic safety engine, and triggers verified recovery actions.

---

## 2. Component Boundaries & Responsibilities

### 2.1 Backend Control Plane (Member 1)
- **API Gateway (`app/api`)**: Exposes REST endpoints for the frontend dashboard and external webhooks.
- **Monitoring Collector (`app/monitoring`)**: Scrapes Prometheus metrics and detects error thresholds.
- **Incident Correlator & Manager (`app/incidents`)**: Aggregates anomalies into stateful incidents (`TRIGGERED`, `INVESTIGATING`, `PENDING_APPROVAL`, `REMEDIATING`, `VERIFYING`, `RESOLVED`).
- **AI Integrator (`app/integrations`)**: Prepares incident context, dispatches to Ollama, and validates structured JSON output.
- **Safety Policy Engine (`app/safety`)**: Validates action eligibility, evaluates risk levels (`low`, `medium`, `high`), enforces human-in-the-loop gates, and guarantees dry-run simulation.
- **Remediation Executor (`app/remediation`)**: Dispatches permitted actions to connectors, records results, and runs recovery health verification.
- **Infrastructure Connectors (`app/connectors`)**: Provider-isolated drivers (Docker adapter) using least privilege.

### 2.2 Operator Dashboard (Member 2)
- Real-time visualization of active incidents, metrics, and service status.
- Single-click approval / rejection for pending remediation tasks.
- Audit log explorer and incident post-mortem viewer.

### 2.3 AI Investigation Engine (Member 3)
- Local Ollama runtime using open-source models (e.g. Llama 3, Mistral).
- Few-shot prompt templates for root-cause synthesis.
- Strict JSON schema enforcement with deterministic fallback.

### 2.4 Target Application & Testbed (Member 4)
- Multi-tier target application (API + Worker + DB).
- Prometheus scraping and alert rules.
- Reproducible failure injection scripts (database disconnect, memory leak, crashing worker, bad deployment).

---

## 3. Incident Lifecycle State Machine

```text
[ NORMAL MONITORING ]
        |
        v (Anomaly Detected / Alert Fired)
 [ INCIDENT: TRIGGERED ]
        |
        v (Context Gathered: Logs, Metrics, Diffs)
 [ INCIDENT: INVESTIGATING ]
        |
        +---> Ollama AI Engine (Inference)
        |
        v (Structured RCA & Recommended Action Received)
 [ SAFETY ENGINE: POLICY EVALUATION ]
        |
        +--- Action NOT Whitelisted? ---> [ REJECTED / MANUAL INTERVENTION ]
        |
        +--- Risk: Medium / High? -----> [ PENDING OPERATOR APPROVAL ]
        |                                        |
        |                                        v (Approved)
        +--- Risk: Low (or Approved) ---> [ REMEDIATION: EXECUTING ]
                                                 |
                                                 v
                                     [ VERIFYING RECOVERY ]
                                        /              \
                             (Health OK)                (Health Failed)
                                  v                            v
                             [ RESOLVED ]             [ ROLLBACK / ESCALATED ]
```

---

## 4. Security Invariants
- **No Direct Shell or AI Command Execution**: Remediation actions are parameterized enum identifiers (e.g., `restart_container`, `rollback_deployment`), never arbitrary bash commands.
- **Isolated AI Network Boundary**: Ollama runs in a separate network zone without access to the host's Docker socket or cloud management APIs.
- **Human Approval Enforcement**: High-risk actions cannot bypass human approval even if suggested with 100% confidence by the AI.
