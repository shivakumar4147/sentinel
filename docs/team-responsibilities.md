# Sentinel Team Responsibilities & Boundaries

To enable all four engineers to work concurrently without merge conflicts or blocking dependencies, strict domain boundaries are defined below.

---

## Member 1: Core Backend & System Integration (Me)
- **Primary Directories**: `backend/`, `docs/`, root orchestration.
- **Deliverables**:
  - FastAPI application with Swagger docs at `/docs`.
  - Docker connector adapter (`app/connectors/docker/`).
  - Incident state machine & persistence (`app/incidents/`).
  - Ollama integration client with mock fallback (`app/integrations/`).
  - Deterministic Safety Policy Engine (`app/safety/`).
  - Predefined remediation executor (`app/remediation/`).
  - Audit logging system (`app/models/`, `app/api/routes/audit.py`).
  - Cross-module integration tests.
- **Boundaries**: Does not author UI components, raw prompt templates, or failure scenario payloads.

---

## Member 2: Operator Dashboard & User Experience
- **Primary Directory**: `frontend/`
- **Deliverables**:
  - React + Vite dashboard displaying services and incidents.
  - Incident details view showing metrics, logs, AI RCA, and confidence score.
  - Single-click "Approve" / "Reject" interactive remediation modal.
  - Audit log table with filtering.
- **Boundaries**: Does not execute backend commands or interact directly with Docker/Ollama.

---

## Member 3: AI Investigation Module
- **Primary Directory**: `ai-engine/`
- **Deliverables**:
  - Prompt engineering in `ai-engine/prompts/` optimizing for local Ollama models (e.g. Llama 3, Mistral).
  - Schema validation guaranteeing root cause, confidence, evidence array, recommended action, and risk level.
  - Standalone script `ai-engine/investigator.py` testable in isolation.
- **Boundaries**: AI module NEVER executes commands, touches Docker, or alters system state.

---

## Member 4: Target Application & Monitoring Lab
- **Primary Directories**: `demo-application/`, `monitoring/`
- **Deliverables**:
  - Instrumented sample web application (API + Worker + DB).
  - Prometheus setup (`prometheus.yml` and `alerts.yml`).
  - Failure injection scripts to simulate real-world incidents:
    - `failure-scenarios/database-failure`
    - `failure-scenarios/bad-deployment`
    - `failure-scenarios/resource-exhaustion`
- **Boundaries**: Does not modify core backend safety or approval policies.

