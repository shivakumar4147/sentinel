# SENTINEL — The On-Call Engineer That Doesn't Panic

Sentinel is a safety-first, AI-assisted incident response platform for cloud-native applications. It autonomously monitors infrastructure, detects anomalies, correlates logs and metrics, synthesizes root-cause investigations via local Ollama models, enforces deterministic safety policies, and coordinates human-approved remediation.

---

## Core Invariants & Security Principles

1. **Deterministic Safety Enforcement**: AI suggestions are treated as untrusted advice. All actions must match a strictly whitelisted catalog of permitted operations and pass deterministic validation before execution.
2. **Zero Direct AI Infrastructure Access**: The AI model (Ollama) has zero direct network or socket access to Docker, hosts, or cloud providers. All interactions route through Sentinel's backend control plane.
3. **Mandatory Human-in-the-Loop for Risky Actions**: Actions classified as medium or high risk strictly require human operator authorization via the Sentinel dashboard before execution.
4. **Dry-Run by Default**: Safe simulation runs ensure parameters and prerequisites match expectations before modifying any running container.
5. **No Blind Recovery Declarations**: Incident remediation is never marked successful until health checks independently verify service restoration.
6. **Immutable Audit Trail**: Every detection, AI inference, operator approval, and executed action is logged with tamper-evident audit records.

---

## System Architecture

```text
+-------------------+           +-------------------+
|  React Dashboard  | <-------> |  Sentinel Backend | <=======> [ PostgreSQL ]
|    (Member 2)     |   REST    |     (Member 1)    |           (Audit/State)
+-------------------+           +---------+---------+
                                          |
                +-------------------------+-------------------------+
                |                         |                         |
                v                         v                         v
       +-----------------+       +-----------------+       +-----------------+
       | Ollama AI Engine|       | Docker / System |       |   Prometheus    |
       |   (Member 3)    |       |   Connectors    |       |   Monitoring    |
       +-----------------+       +--------+--------+       |   (Member 4)    |
                                          |                +-----------------+
                                          v                         ^
                                 +-----------------+                |
                                 | Demo Target App | ---------------+
                                 |   (Member 4)    |   Scrape Metrics
                                 +-----------------+
```

---

## Directory Organization

```text
sentinel/
├── frontend/             # Member 2: React + Vite operator dashboard
├── backend/              # Member 1: FastAPI control plane, safety engine & connectors
├── ai-engine/            # Member 3: Ollama prompts, investigation engine & schema
├── demo-application/     # Member 4: Target application with failure injection scenarios
├── monitoring/           # Member 4: Prometheus scraping configuration & alert rules
├── docs/                 # Architecture, API contracts, schemas & integration guides
├── tests/                # System-level and cross-module integration tests
├── docker-compose.yml    # Multi-container orchestration
├── .env.example          # Baseline environment template
└── README.md             # Project documentation
```

---

## Team Division of Responsibility

| Member | Focus Area | Core Modules |
| :--- | :--- | :--- |
| **Member 1 (Current)** | Core Backend & Integration | FastAPI, Docker connector, Incident Manager, Safety Policy Engine, Remediation Executor, Audit Logger |
| **Member 2** | Operator Frontend | React, Vite, incident view, approval workflows, real-time status feeds |
| **Member 3** | AI Investigation Module | Local Ollama prompting, log/metric synthesis, root cause reasoning, structured JSON outputs |
| **Member 4** | Infrastructure & Failure Lab | Demo services (API/worker/DB), Prometheus metric exporter, fault injection triggers |

---

## Quickstart (Backend Control Plane)

### 1. Requirements
- Python 3.10+ (Recommended: Python 3.11 or 3.12)
- Node.js 18+ (for frontend)
- Docker & Docker Compose (for container environment)

### 2. Backend Local Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
