# Sentinel Integration Guide

This guide describes how each independent module integrates with the Sentinel platform during the 36-hour hackathon.

---

## 1. Member 1 (Backend Control Plane) Integration

- **Port**: `8000` (FastAPI)
- **Database**: PostgreSQL on port `5432` (or SQLite fallback for zero-dependency local testing).
- **Core Role**: Connects monitoring signals to incident records, invokes the AI engine with evidence payloads, applies deterministic safety gates, awaits operator decisions, executes approved actions via connectors, and runs verification checks.

---

## 2. Member 2 (Frontend Dashboard) Integration

- **Port**: `3000` (React + Vite)
- **API Base URL**: `http://localhost:8000/api`
- **Key Flows**:
  1. Fetch active incidents from `GET /api/incidents`.
  2. Display root-cause details from `GET /api/incidents/{incident_id}`.
  3. Action buttons send `POST /api/remediations/{remediation_id}/approve` or `reject`.
  4. Real-time updates via periodic polling or SSE.

---

## 3. Member 3 (Ollama AI Engine) Integration

- **Port**: `11434` (Ollama REST API) or local Python module `ai-engine/investigator.py`.
- **Mode 1 - Mock Mode (`OLLAMA_MOCK_MODE=True`)**:
  - The backend returns a deterministic valid investigation response conforming to Section 7 contract.
  - Enables frontend and backend development without requiring GPU or running Ollama.
- **Mode 2 - Live Ollama Mode (`OLLAMA_MOCK_MODE=False`)**:
  - Backend sends a prompt via `http://ollama:11434/api/generate` with structured JSON mode enabled.
  - Member 3 defines prompts in `ai-engine/prompts/` and validates output with Pydantic in `ai-engine/schemas/`.

---

## 4. Member 4 (Demo App & Monitoring) Integration

- **Demo Target**: `demo-application/api` (port `5000`) and worker (port `5001`).
- **Prometheus**: Scrapes metrics from `http://demo-api:5000/metrics` every 5 seconds.
- **Alert Triggering**: Failure scenarios in `demo-application/failure-scenarios/` simulate:
  - Database connection refusal (`database-failure`).
  - High error rate and latency spikes (`bad-deployment`).
  - Memory exhaustion and OOM kills (`resource-exhaustion`).
- The backend's `app/monitoring/collector.py` queries Prometheus at `http://prometheus:9090` to auto-create incidents.
