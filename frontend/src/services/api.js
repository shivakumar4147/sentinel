/**
 * Sentinel Frontend API Client
 * Central client for connecting to the Sentinel Backend API (Member 1).
 * 
 * Supports seamless switching between real Backend endpoints and realistic Mock Data.
 */

import {
  MOCK_SERVICES,
  MOCK_INCIDENTS,
  MOCK_REMEDIATIONS,
  MOCK_AUDIT_LOGS,
  MOCK_METRICS,
} from './mockData';

// Configurable base URL from environment
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');
const API_PREFIX = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

// Check mock mode preference (defaults to auto-fallback if backend is unreachable)
let isForceMock = import.meta.env.VITE_FORCE_MOCK === 'true';

export const getMockMode = () => isForceMock;
export const setMockMode = (val) => {
  isForceMock = !!val;
};

// In-memory mutable state for mock interactions
let localServices = [...MOCK_SERVICES];
let localIncidents = [...MOCK_INCIDENTS];
let localRemediations = [...MOCK_REMEDIATIONS];
let localAuditLogs = [...MOCK_AUDIT_LOGS];

/**
 * Standard fetch wrapper with timeout and error handling.
 */
async function apiFetch(endpoint, options = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${API_PREFIX}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(id);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        errorBody.detail || errorBody.message || `Request failed with status ${response.status}`
      );
    }

    return await response.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Central Sentinel API Client
 */
export const SentinelAPI = {
  /**
   * Health status of Sentinel backend services
   * GET /api/health
   */
  async getHealth() {
    if (isForceMock) {
      return {
        status: "healthy",
        version: "0.1.0",
        database: "connected (mock)",
        ollama_mode: "mock",
        docker_available: true,
        dry_run: true,
        timestamp: new Date().toISOString(),
        isMock: true,
      };
    }
    try {
      const data = await apiFetch('/health');
      return { ...data, isMock: false };
    } catch (err) {
      console.warn('[SentinelAPI] Backend unreachable, falling back to mock health data:', err.message);
      return {
        status: "healthy",
        version: "0.1.0",
        database: "connected (fallback)",
        ollama_mode: "mock",
        docker_available: true,
        dry_run: true,
        timestamp: new Date().toISOString(),
        isMock: true,
        offlineNotice: "Backend server not responding at " + API_BASE_URL,
      };
    }
  },

  /**
   * Get all monitored services
   * GET /api/services
   */
  async getServices() {
    if (isForceMock) {
      return { services: localServices, total: localServices.length, isMock: true };
    }
    try {
      const data = await apiFetch('/services');
      const services = data.services || data;
      return { services, total: services.length, isMock: false };
    } catch (err) {
      console.warn('[SentinelAPI] getServices falling back to mock:', err.message);
      return { services: localServices, total: localServices.length, isMock: true };
    }
  },

  /**
   * Get all incidents
   * GET /api/incidents
   */
  async getIncidents() {
    if (isForceMock) {
      return { incidents: localIncidents, total: localIncidents.length, isMock: true };
    }
    try {
      const data = await apiFetch('/incidents');
      const incidents = data.incidents || data;
      return { incidents, total: incidents.length, isMock: false };
    } catch (err) {
      console.warn('[SentinelAPI] getIncidents falling back to mock:', err.message);
      return { incidents: localIncidents, total: localIncidents.length, isMock: true };
    }
  },

  /**
   * Get single incident details
   * GET /api/incidents/{incident_id}
   */
  async getIncident(incidentId) {
    if (isForceMock) {
      const incident = localIncidents.find((i) => i.incident_id === incidentId);
      if (!incident) throw new Error(`Incident ${incidentId} not found`);
      return { ...incident, isMock: true };
    }
    try {
      const data = await apiFetch(`/incidents/${incidentId}`);
      return { ...data, isMock: false };
    } catch (err) {
      console.warn(`[SentinelAPI] getIncident(${incidentId}) falling back to mock:`, err.message);
      const incident = localIncidents.find((i) => i.incident_id === incidentId);
      if (!incident) throw new Error(`Incident ${incidentId} not found in mock store`);
      return { ...incident, isMock: true };
    }
  },

  /**
   * Trigger AI Investigation for an incident
   * POST /api/incidents/{incident_id}/investigate
   */
  async investigateIncident(incidentId) {
    if (isForceMock) {
      await new Promise((res) => setTimeout(res, 800));
      const incident = localIncidents.find((i) => i.incident_id === incidentId);
      if (!incident) throw new Error(`Incident ${incidentId} not found`);

      const result = incident.investigation || {
        root_cause: "Cascading connection timeout identified across upstream dependencies.",
        confidence: 0.91,
        evidence: ["Telemetry spike in socket retries", "Worker event queue backlog"],
        recommended_action: "restart_and_drain",
        risk_level: "high",
        requires_approval: true,
      };

      localAuditLogs.unshift({
        id: `AUD-${Date.now().toString().slice(-4)}`,
        incident_id: incidentId,
        action: "ai_investigation_completed",
        actor: "sentinel-ai-engine (ollama/llama3)",
        details: { confidence: result.confidence, root_cause: result.root_cause },
        timestamp: new Date().toISOString(),
      });

      return { incident_id: incidentId, investigation: result, isMock: true };
    }

    try {
      const data = await apiFetch(`/incidents/${incidentId}/investigate`, { method: 'POST' });
      return { ...data, isMock: false };
    } catch (err) {
      console.warn(`[SentinelAPI] investigateIncident(${incidentId}) fallback:`, err.message);
      const incident = localIncidents.find((i) => i.incident_id === incidentId);
      return { incident_id: incidentId, investigation: incident?.investigation, isMock: true };
    }
  },

  /**
   * Approve a pending remediation
   * POST /api/remediations/{remediation_id}/approve
   */
  async approveRemediation(remediationId, notes = '', approver = 'oncall-operator') {
    if (isForceMock) {
      await new Promise((res) => setTimeout(res, 500));
      const remIndex = localRemediations.findIndex((r) => r.remediation_id === remediationId);
      if (remIndex === -1) throw new Error(`Remediation ${remediationId} not found`);

      const rem = localRemediations[remIndex];
      const updated = {
        ...rem,
        status: "approved",
        approval_notes: notes || "Approved by on-call engineer via Sentinel UI",
        operator: approver,
        approved_at: new Date().toISOString(),
      };
      localRemediations[remIndex] = updated;

      // Update corresponding incident status
      const incIndex = localIncidents.findIndex((i) => i.remediation_id === remediationId || i.incident_id === rem.incident_id);
      if (incIndex !== -1) {
        localIncidents[incIndex] = {
          ...localIncidents[incIndex],
          status: "remediating",
        };
      }

      // Add audit log
      localAuditLogs.unshift({
        id: `AUD-${Date.now().toString().slice(-4)}`,
        incident_id: rem.incident_id,
        action: "remediation_approved",
        actor: approver,
        details: { remediation_id: remediationId, notes },
        timestamp: new Date().toISOString(),
      });

      return { success: true, remediation: updated, isMock: true };
    }

    try {
      const data = await apiFetch(`/remediations/${remediationId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approver, notes }),
      });
      return { ...data, isMock: false };
    } catch (err) {
      console.warn(`[SentinelAPI] approveRemediation fallback:`, err.message);
      const rem = localRemediations.find((r) => r.remediation_id === remediationId);
      if (rem) rem.status = "approved";
      return { success: true, remediation: rem, isMock: true };
    }
  },

  /**
   * Reject a pending remediation or confirm with suggestion
   * POST /api/remediations/{remediation_id}/reject
   */
  async rejectRemediation(remediationId, reason = '', operator = 'oncall-operator', suggestion = null) {
    const isSuggestion = Boolean(suggestion || (reason && reason.toLowerCase().includes('suggestion')));
    const newStatus = isSuggestion ? 'suggestion_approved' : 'rejected';
    const actualSuggestion = suggestion || (isSuggestion ? reason.replace(/^Rejected with suggestion:\s*/i, '') : null);

    if (isForceMock) {
      await new Promise((res) => setTimeout(res, 500));
      const remIndex = localRemediations.findIndex((r) => r.remediation_id === remediationId);
      if (remIndex === -1) throw new Error(`Remediation ${remediationId} not found`);

      const rem = localRemediations[remIndex];
      const updated = {
        ...rem,
        status: newStatus,
        rejection_reason: reason || (isSuggestion ? 'Suggestion Approved' : 'Rejected by operator'),
        suggestion: actualSuggestion,
        operator,
        rejected_at: new Date().toISOString(),
      };
      localRemediations[remIndex] = updated;

      localAuditLogs.unshift({
        id: `AUD-${Date.now().toString().slice(-4)}`,
        incident_id: rem.incident_id,
        action: isSuggestion ? 'suggestion_approved' : 'remediation_rejected',
        actor: operator,
        details: { remediation_id: remediationId, reason, suggestion: actualSuggestion, status: newStatus },
        timestamp: new Date().toISOString(),
      });

      return { success: true, remediation: updated, isMock: true };
    }

    try {
      const data = await apiFetch(`/remediations/${remediationId}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          operator,
          reason,
          status: newStatus,
          suggestion: actualSuggestion,
        }),
      });
      const rem = localRemediations.find((r) => r.remediation_id === remediationId);
      if (rem) {
        rem.status = newStatus;
        rem.rejection_reason = reason;
        rem.suggestion = actualSuggestion;
      }
      return { ...data, isMock: false };
    } catch (err) {
      console.warn(`[SentinelAPI] rejectRemediation fallback:`, err.message);
      const rem = localRemediations.find((r) => r.remediation_id === remediationId);
      if (rem) {
        rem.status = newStatus;
        rem.rejection_reason = reason;
        rem.suggestion = actualSuggestion;
      }
      return { success: true, remediation: rem, isMock: true };
    }
  },

  /**
   * Execute an approved remediation
   * POST /api/remediations/{remediation_id}/execute
   */
  async executeRemediation(remediationId) {
    if (isForceMock) {
      await new Promise((res) => setTimeout(res, 800));
      const remIndex = localRemediations.findIndex((r) => r.remediation_id === remediationId);
      if (remIndex === -1) throw new Error(`Remediation ${remediationId} not found`);

      const rem = localRemediations[remIndex];
      const updated = {
        ...rem,
        status: "completed",
        executed_at: new Date().toISOString(),
        output: "Execution successful: 142 idle connection slots terminated. Payment worker restarted cleanly. Pool saturation dropped from 99% to 18%.",
        recovery_verification: {
          status: "verified",
          recovered: true,
          current_status: "healthy",
          message: "All health probes responding HTTP 200 OK. Connection pool capacity normal.",
          checks: {
            "connections_below_80pct": "passed",
            "gateway_p99_latency_normal": "passed",
            "health_endpoint_responding": "passed",
          },
        },
      };
      localRemediations[remIndex] = updated;

      // Update incident to resolved
      const incIndex = localIncidents.findIndex((i) => i.incident_id === rem.incident_id);
      if (incIndex !== -1) {
        localIncidents[incIndex] = {
          ...localIncidents[incIndex],
          status: "resolved",
        };
      }

      // Update service status
      const srvIndex = localServices.findIndex((s) => s.name === rem.target_service);
      if (srvIndex !== -1) {
        localServices[srvIndex] = {
          ...localServices[srvIndex],
          status: "running",
          health: "healthy",
          error_rate: 0.04,
          cpu_usage: 28.5,
          memory_usage: 42.1,
        };
      }

      localAuditLogs.unshift({
        id: `AUD-${Date.now().toString().slice(-4)}`,
        incident_id: rem.incident_id,
        action: "remediation_executed",
        actor: "sentinel-executor",
        details: { remediation_id: remediationId, result: "success" },
        timestamp: new Date().toISOString(),
      });

      return { success: true, remediation: updated, isMock: true };
    }

    try {
      const data = await apiFetch(`/remediations/${remediationId}/execute`, { method: 'POST' });
      return { ...data, isMock: false };
    } catch (err) {
      console.warn(`[SentinelAPI] executeRemediation fallback:`, err.message);
      return { success: false, error: err.message, isMock: true };
    }
  },

  /**
   * Get audit logs
   * GET /api/audit-logs
   */
  async getAuditLogs() {
    if (isForceMock) {
      return { logs: localAuditLogs, total: localAuditLogs.length, isMock: true };
    }
    try {
      const data = await apiFetch('/audit-logs');
      const logs = data.logs || data;
      return { logs, total: logs.length, isMock: false };
    } catch (err) {
      console.warn('[SentinelAPI] getAuditLogs falling back to mock:', err.message);
      return { logs: localAuditLogs, total: localAuditLogs.length, isMock: true };
    }
  },

  /**
   * Get all remediations (helper for remediation view)
   */
  async getRemediations() {
    return { remediations: localRemediations, total: localRemediations.length, isMock: true };
  },

  /**
   * Get metrics for charts
   */
  async getMetrics() {
    return { metrics: MOCK_METRICS, isMock: true };
  },

  /**
   * Reset local mock data to defaults (useful for testing)
   */
  resetMockData() {
    localServices = [...MOCK_SERVICES];
    localIncidents = [...MOCK_INCIDENTS];
    localRemediations = [...MOCK_REMEDIATIONS];
    localAuditLogs = [...MOCK_AUDIT_LOGS];
  },
};

