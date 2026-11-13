import { describe, it, expect, beforeEach } from 'vitest';
import { SentinelAPI, setMockMode } from './api';

describe('SentinelAPI Client (Member 2)', () => {
  beforeEach(() => {
    setMockMode(true);
    SentinelAPI.resetMockData();
  });

  it('fetches system health with expected structure', async () => {
    const health = await SentinelAPI.getHealth();
    expect(health).toBeDefined();
    expect(health.status).toBe('healthy');
    expect(health.version).toBe('0.1.0');
  });

  it('fetches 4 monitored services with accurate runtime metrics', async () => {
    const res = await SentinelAPI.getServices();
    expect(res.services).toHaveLength(4);
    const apiGateway = res.services.find((s) => s.name === 'api-gateway');
    expect(apiGateway).toBeDefined();
    expect(apiGateway.cpu_usage).toBeGreaterThan(0);
    expect(apiGateway.container_name).toBe('sentinel_api_gateway_1');
  });

  it('fetches incidents containing critical, warning and resolved incidents', async () => {
    const res = await SentinelAPI.getIncidents();
    expect(res.incidents.length).toBeGreaterThanOrEqual(3);
    const critical = res.incidents.find((i) => i.severity === 'critical');
    const warning = res.incidents.find((i) => i.severity === 'warning');
    const resolved = res.incidents.find((i) => i.status === 'resolved');

    expect(critical).toBeDefined();
    expect(critical.incident_id).toBe('INC-8492');
    expect(warning).toBeDefined();
    expect(resolved).toBeDefined();
  });

  it('fetches single incident details with AI investigation payload', async () => {
    const inc = await SentinelAPI.getIncident('INC-8492');
    expect(inc.incident_id).toBe('INC-8492');
    expect(inc.investigation).toBeDefined();
    expect(inc.investigation.confidence).toBeGreaterThan(0.9);
    expect(inc.investigation.root_cause).toContain('payment-worker');
  });

  it('executes approval flow and logs audit record', async () => {
    const res = await SentinelAPI.approveRemediation(
      'REM-301',
      'Tested with SRE key',
      'operator-alice'
    );
    expect(res.success).toBe(true);
    expect(res.remediation.status).toBe('approved');
    expect(res.remediation.operator).toBe('operator-alice');

    // Verify audit log recorded
    const logs = await SentinelAPI.getAuditLogs();
    const approvalLog = logs.logs.find(
      (l) => l.action === 'remediation_approved' && l.actor === 'operator-alice'
    );
    expect(approvalLog).toBeDefined();
  });

  it('executes remediation and verifies recovery checks', async () => {
    const res = await SentinelAPI.executeRemediation('REM-301');
    expect(res.success).toBe(true);
    expect(res.remediation.status).toBe('completed');
    expect(res.remediation.recovery_verification.recovered).toBe(true);

    // Corresponding incident should transition to resolved
    const inc = await SentinelAPI.getIncident('INC-8492');
    expect(inc.status).toBe('resolved');
  });
});

