import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SentinelAPI, getMockMode, setMockMode } from '../services/api';
import { useToast } from './ToastContext';

const SentinelContext = createContext(null);

export function SentinelProvider({ children }) {
  const { addToast } = useToast();

  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [remediations, setRemediations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMockMode, setIsMockModeState] = useState(getMockMode());
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [timeRange, setTimeRange] = useState('Last 24 Hours');

  // Load all system data
  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);

    try {
      const [hRes, sRes, iRes, rRes, aRes, mRes] = await Promise.all([
        SentinelAPI.getHealth().catch(() => ({ status: 'unknown', isMock: true })),
        SentinelAPI.getServices(),
        SentinelAPI.getIncidents(),
        SentinelAPI.getRemediations(),
        SentinelAPI.getAuditLogs(),
        SentinelAPI.getMetrics(),
      ]);

      setHealth(hRes);
      setServices(sRes.services || []);
      setIncidents(iRes.incidents || []);
      setRemediations(rRes.remediations || []);
      setAuditLogs(aRes.logs || []);
      setMetrics(mRes.metrics || null);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('[SentinelContext] Error loading telemetry:', err);
      setError(err.message || 'Failed to load system telemetry');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle Mock Mode
  const toggleMockMode = (enable) => {
    setMockMode(enable);
    setIsMockModeState(enable);
    addToast({
      type: enable ? 'info' : 'warning',
      title: enable ? 'Mock Telemetry Active' : 'Live API Mode Enabled',
      message: enable
        ? 'Using simulated cloud telemetry and AI responses for safe testing.'
        : 'Connecting directly to backend API at ' + import.meta.env.VITE_API_BASE_URL,
    });
    fetchData();
  };

  // Reset demo state
  const resetDemoData = () => {
    SentinelAPI.resetMockData();
    fetchData();
    addToast({
      type: 'info',
      title: 'Demo Environment Reset',
      message: 'All simulated services, incidents, and approvals have been reset to default state.',
    });
  };

  // Trigger AI Investigation
  const investigateIncident = async (incidentId) => {
    try {
      const res = await SentinelAPI.investigateIncident(incidentId);
      addToast({
        type: 'success',
        title: 'AI Investigation Complete',
        message: `Root cause identified with ${Math.round((res.investigation?.confidence || 0.9) * 100)}% confidence score.`,
      });
      await fetchData(true);
      return res;
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Investigation Failed',
        message: err.message || 'Could not query AI inference engine',
      });
      throw err;
    }
  };

  // Operator Approves Remediation
  const approveRemediation = async (remediationId, notes = '', approver = 'oncall-operator') => {
    try {
      const res = await SentinelAPI.approveRemediation(remediationId, notes, approver);
      addToast({
        type: 'success',
        title: 'Remediation Approved',
        message: `Remediation #${remediationId} authorized. Status changed to "Approved". Awaiting execution step.`,
      });
      await fetchData(true);
      return res;
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Approval Rejected by Policy',
        message: err.message,
      });
      throw err;
    }
  };

  // Operator Rejects Remediation or Submits Changes Suggested
  const rejectRemediation = async (remediationId, reason = '', operator = 'oncall-operator', suggestion = null) => {
    try {
      const isSuggestion = Boolean(suggestion || (reason && reason.toLowerCase().includes('suggestion')));
      const res = await SentinelAPI.rejectRemediation(remediationId, reason, operator, suggestion);
      if (isSuggestion) {
        addToast({
          type: 'info',
          title: 'Changes Suggested',
          message: `Request #${remediationId}: Operator feedback logged. Backend AI is formulating a revised plan...`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Remediation Rejected',
          message: `Remediation #${remediationId} was marked rejected. Reason logged to audit trail.`,
        });
      }
      await fetchData(true);
      return res;
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message,
      });
      throw err;
    }
  };

  // AI Revision Loop: Synthesize revised proposal based on operator feedback
  const reviseRemediation = async (remediationId, suggestion = '', operator = 'oncall-operator') => {
    try {
      const res = await SentinelAPI.reviseRemediation(remediationId, suggestion, operator);
      addToast({
        type: 'success',
        title: 'AI Revision Ready',
        message: `New remediation proposal formulated for #${remediationId}. Ready for review.`,
      });
      await fetchData(true);
      return res;
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Revision Failed',
        message: err.message,
      });
      throw err;
    }
  };

  // Operator/System Executes Remediation
  const executeRemediation = async (remediationId) => {
    try {
      const res = await SentinelAPI.executeRemediation(remediationId);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Remediation Executed & Verified',
          message: `Fix applied successfully. Autonomous post-check verified recovery.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Execution Error',
          message: res.error || 'Remediation failed verification.',
        });
      }
      await fetchData(true);
      return res;
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Execution Failed',
        message: err.message,
      });
      throw err;
    }
  };

  return (
    <SentinelContext.Provider
      value={{
        services,
        incidents,
        remediations,
        auditLogs,
        health,
        metrics,
        loading,
        error,
        isMockMode,
        lastRefreshed,
        timeRange,
        setTimeRange,
        refreshData: fetchData,
        toggleMockMode,
        resetDemoData,
        investigateIncident,
        approveRemediation,
        rejectRemediation,
        reviseRemediation,
        executeRemediation,
      }}
    >
      {children}
    </SentinelContext.Provider>
  );
}

export function useSentinel() {
  const context = useContext(SentinelContext);
  if (!context) {
    throw new Error('useSentinel must be used within a SentinelProvider');
  }
  return context;
}

