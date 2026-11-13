# SENTINEL — Frontend Dashboard (Member 2)

Autonomous Incident Response & Safety Verification Platform for Cloud-Native Microservices.

## Overview
This is the complete frontend dashboard developed for Sentinel. It provides an on-call SRE engineer with real-time operational posture, AI-synthesized root-cause diagnoses, safety guardrail approvals, and automated remediation tracking.

## Technology Stack
- **Framework:** React 18 + Vite 5
- **Routing:** React Router DOM 6
- **Styling:** Tailwind CSS (Dark SaaS Theme)
- **Icons:** Lucide React
- **Telemetry Charts:** Recharts
- **State & Notifications:** React Context (`SentinelContext`, `ToastContext`)
- **API Client:** Fetch API with automatic fallback to simulated telemetry

## Dashboard Layout & Pages
1. **Overview Dashboard (`/`):** High-level operational metrics (services healthy/degraded, active incidents, MTTR, cluster CPU/memory usage), service health grid, 7-day incident trend chart, real-time resource telemetry, and live activity streams.
2. **Services (`/services`):** Monitored microservice fleet (`api-gateway`, `auth-service`, `postgres-db`, `payment-worker`), container statuses, CPU/memory gauges, error rates, and runtime inspect modals.
3. **Incidents (`/incidents`):** Incident registry with search, severity filters (Critical, Warning, Info), status filters (Awaiting Sign-off, Remediating, Resolved), and quick detail inspect modals.
4. **AI Investigation (`/investigation`):** In-depth root-cause analysis workspace powered by Ollama (Llama 3). Displays AI confidence meters, explicitly demarcates **Verified Facts** from **AI Hypotheses**, surfaces raw log traces, recent deployment diffs, and recommended remediations.
5. **Approvals (`/approvals`):** Human-in-the-loop safety queue for high-risk actions. Features interactive approval & rejection modals with mandatory operator reasoning and safety policy dry-run validations.
6. **Remediation (`/remediation`):** Autonomous remediation engine. Tracks step-by-step progress, dry-run simulation results, rollback snapshots, and post-recovery health checks. Includes interactive execution triggers for approved fixes.
7. **Audit Logs (`/audit-logs`):** Immutable chronological record of detections, AI investigations, safety evaluations, human approvals, remediation executions, and verifications. Filterable by action type, service, and date, with raw JSON inspection.
8. **Settings (`/settings`):** Backend API endpoint configuration, telemetry polling intervals, safety policy threshold toggles, and demo reset capabilities.

## Getting Started

### Development Server
```bash
cd frontend
npm install
npm run dev
```
The application will launch at `http://localhost:3000`.

### Production Build
```bash
cd frontend
npm run build
npm run preview
```

### Running Tests
```bash
cd frontend
npx vitest run
```

## Connecting to Backend API (Member 1)
By default, the dashboard includes realistic mock telemetry and an automatic fallback mechanism. When Member 1's FastAPI backend is running at `http://localhost:8000`:
1. Set `VITE_FORCE_MOCK=false` in `.env` (or toggle the "Live API" pill directly in the dashboard header).
2. The central client at `src/services/api.js` dispatches directly to:
   - `GET /api/health`
   - `GET /api/services`
   - `GET /api/incidents`
   - `GET /api/incidents/{incident_id}`
   - `POST /api/incidents/{incident_id}/investigate`
   - `POST /api/remediations/{remediation_id}/approve`
   - `POST /api/remediations/{remediation_id}/reject`
   - `POST /api/remediations/{remediation_id}/execute`
   - `GET /api/audit-logs`

