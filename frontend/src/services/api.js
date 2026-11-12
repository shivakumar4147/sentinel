/**
 * Sentinel Frontend API Client
 * Service module for Member 2 connecting to the Sentinel Backend API.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const SentinelAPI = {
  getHealth: () => request('/health'),
  getServices: () => request('/services'),
  getIncidents: () => request('/incidents'),
  getIncident: (incidentId) => request(`/incidents/${incidentId}`),
  investigateIncident: (incidentId) => request(`/incidents/${incidentId}/investigate`, { method: 'POST' }),
  approveRemediation: (remediationId, notes = '') =>
    request(`/remediations/${remediationId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  rejectRemediation: (remediationId, reason = '') =>
    request(`/remediations/${remediationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  executeRemediation: (remediationId) =>
    request(`/remediations/${remediationId}/execute`, { method: 'POST' }),
  verifyIncident: (incidentId) =>
    request(`/incidents/${incidentId}/verify`, { method: 'POST' }),
  getAuditLogs: () => request('/audit-logs'),
};
