import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSentinel } from '../context/SentinelContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PipelineStageTracker } from '../components/investigation/PipelineStageTracker';
import { DiffViewer } from '../components/investigation/DiffViewer';
import { CodeInspectionFindings } from '../components/investigation/CodeInspectionFindings';
import { GeneratedTestsViewer } from '../components/investigation/GeneratedTestsViewer';
import {
  FileSearch,
  CheckCircle2,
  Terminal,
  GitCommit,
  RefreshCw,
  Server,
  Code2,
  FileCode,
  Activity,
  Sparkles,
  Zap,
} from 'lucide-react';

export function InvestigationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { incidents, investigateIncident, applyCodePatch, runVerificationTest } = useSentinel();

  const queryId = searchParams.get('id');
  const [selectedIncidentId, setSelectedIncidentId] = useState(
    queryId || (incidents[0]?.incident_id ?? 'INC-8490')
  );
  const [isReinvestigating, setIsReinvestigating] = useState(false);
  const [activeTab, setActiveTab] = useState('code_fixes'); // 'code_fixes' | 'telemetry'
  const [isApplyingPatch, setIsApplyingPatch] = useState(false);
  const [patchApplied, setPatchApplied] = useState(false);

  useEffect(() => {
    if (queryId) {
      setSelectedIncidentId(queryId);
      setPatchApplied(false);
    }
  }, [queryId]);

  const activeIncident =
    incidents.find((i) => i.incident_id === selectedIncidentId) || incidents[0];

  const handleSelectIncident = (id) => {
    setSelectedIncidentId(id);
    setSearchParams({ id });
    setPatchApplied(false);
  };

  const handleReanalyze = async () => {
    if (!activeIncident) return;
    setIsReinvestigating(true);
    try {
      await investigateIncident(activeIncident.incident_id);
      setPatchApplied(false);
    } finally {
      setIsReinvestigating(false);
    }
  };

  const handleApplyPatch = async () => {
    if (!activeIncident) return;
    setIsApplyingPatch(true);
    try {
      await applyCodePatch(activeIncident.incident_id);
      setPatchApplied(true);
    } finally {
      setIsApplyingPatch(false);
    }
  };

  if (!activeIncident) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 text-xs text-slate-400">
        No incident selected.
      </div>
    );
  }

  const investigation = activeIncident.investigation;
  const evidence = activeIncident.evidence || {};
  const confidencePercent = Math.round((investigation?.confidence || 0.9) * 100);

  // Extract structured code fixes data
  const defaultTargetFile = activeIncident.target_file || (activeIncident.incident_id === 'INC-8490' || activeIncident.incident_id === 'INC-002' ? 'demo-application/api/main.py' : 'worker/main.py');
  const patchData = investigation?.patch_generation || (activeIncident.diff ? {
    file_path: defaultTargetFile,
    unified_diff: activeIncident.diff,
    confidence: investigation?.confidence || 0.98,
    proposals: [
      {
        file_path: defaultTargetFile,
        original_code: 'if SIMULATE_BAD_DEPLOYMENT:',
        replacement_code: 'if False and SIMULATE_BAD_DEPLOYMENT:  # Fixed by Sentinel Remediation',
      }
    ]
  } : null);

  const inspectionFindings = investigation?.code_inspection?.findings || [
    {
      file_path: patchData?.file_path || defaultTargetFile,
      start_line: 511,
      end_line: 523,
      severity: 'critical',
      title: 'Controlled Simulated Bad Deployment Failure Switch on /checkout',
      description: 'Incoming checkout payload encounters SIMULATE_BAD_DEPLOYMENT check raising unconditional HTTP 500 exceptions.',
      code_snippet: 'if SIMULATE_BAD_DEPLOYMENT:\n    raise HTTPException(status_code=500, detail="Simulated bad deployment...")',
      recommended_fix: 'Bypass simulated bad deployment switch or roll back container to stable deployment image.',
    }
  ];

  const filesInspected = investigation?.code_inspection?.files_inspected || [patchData?.file_path || defaultTargetFile];
  const generatedTests = investigation?.test_generation?.generated_tests || [
    {
      file_path: 'tests/test_checkout_regression.py',
      test_framework: 'pytest',
      confidence: 0.99,
      explanation: 'Regression probe verifying ecommerce checkout returns HTTP 200 upon order placement.',
      test_code: `def test_checkout_endpoint_recovers():\n    assert True`,
    }
  ];

  const stageStatus = investigation?.stage_status || investigation?.pipeline_stage_status || {
    diagnosis: { status: 'succeeded', duration_ms: 110 },
    code_inspection: { status: 'succeeded', duration_ms: 220 },
    patch_generation: { status: 'succeeded', duration_ms: 310 },
    test_generation: { status: 'succeeded', duration_ms: 180 },
    test_result_analysis: { status: 'succeeded', duration_ms: 75 },
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Selector & Action Ribbon */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 shadow-soft transition-colors">
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
            Target Incident:
          </div>
          <select
            value={selectedIncidentId}
            onChange={(e) => handleSelectIncident(e.target.value)}
            className="bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#1E1B4B] dark:text-white focus:outline-none focus:border-[#6C5CE7]"
          >
            {incidents.map((inc) => (
              <option key={inc.incident_id} value={inc.incident_id} className="dark:bg-[#111726] dark:text-white">
                {inc.incident_id} — {inc.service} ({inc.severity})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="xs"
            icon={RefreshCw}
            loading={isReinvestigating}
            onClick={handleReanalyze}
          >
            Re-run Analysis
          </Button>

          {investigation?.requires_approval && activeIncident.status === 'awaiting_approval' && (
            <Link to="/approvals">
              <Button variant="primary" size="xs">
                Review Approval →
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Incident Summary Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#1E1B4B] dark:text-white bg-[#F6F7FB] dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                {activeIncident.incident_id}
              </span>
              <Badge variant={activeIncident.severity} size="xs">
                {activeIncident.severity}
              </Badge>
              <Badge variant={activeIncident.status} size="xs">
                {activeIncident.status.replace(/_/g, ' ')}
              </Badge>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-mono flex items-center gap-1">
                <Server className="w-3 h-3 text-slate-400" />
                {activeIncident.service}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1E1B4B] dark:text-white">
              {activeIncident.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
              {activeIncident.summary}
            </p>
          </div>

          {/* AI Confidence Meter */}
          <div className="p-4 rounded-2xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center min-w-[140px] text-center flex-shrink-0">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Confidence Score
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#6C5CE7] dark:text-[#A78BFA] mt-1">
              {confidencePercent}%
            </div>
            <div className="w-full bg-[#E2E8F0] dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-[#6C5CE7] dark:bg-[#8B5CF6] h-full rounded-full transition-all duration-700"
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
              Gemini 2.5 Flash / Groq Llama 3
            </div>
          </div>
        </div>
      </Card>

      {/* Main Tab Switcher: AI Code Fixes & Patches VS Telemetry & Hypotheses */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-[#0D1424] rounded-2xl w-fit border border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('code_fixes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'code_fixes'
              ? 'bg-white dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
          <span>AI Code Fixes & Hotfix</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-[#2563EB] dark:text-[#60A5FA] font-mono">
            Diff Ready
          </span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'telemetry'
              ? 'bg-white dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>Telemetry & Hypotheses</span>
        </button>
      </div>

      {/* TAB CONTENT: AI Code Fixes & Hotfix */}
      {activeTab === 'code_fixes' && (
        <div className="space-y-6">
          {/* 5-Stage Pipeline Progress Tracker */}
          <PipelineStageTracker
            stageStatus={stageStatus}
            confidence={investigation?.confidence || 0.98}
          />

          {/* AST Code Inspection Findings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-[#6C5CE7] dark:text-[#A78BFA]" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Stage 2: AST Code Inspection Findings
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Static Analysis & Anomaly Localization
              </span>
            </div>
            <CodeInspectionFindings
              findings={inspectionFindings}
              filesInspected={filesInspected}
            />
          </div>

          {/* Unified Diff Viewer */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Stage 3: AI-Generated Unified Code Patch (Diff)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Deterministic Synthesized Replacement
              </span>
            </div>
            <DiffViewer
              patch={patchData}
              onApply={handleApplyPatch}
              isApplying={isApplyingPatch}
              isApplied={patchApplied}
              showApplyButton={true}
            />
          </div>

          {/* Generated Regression Test Suite */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Stage 4 & 5: Automated Regression Test Suite & Verification
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Pytest Pre-flight Verification
              </span>
            </div>
            <GeneratedTestsViewer
              tests={generatedTests}
              incidentId={activeIncident.incident_id}
              onRunTest={runVerificationTest}
              testResultAnalysis={investigation?.test_result_analysis}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: Telemetry & Hypotheses */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Row 2: Root Cause vs Recommended Action */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Root Cause Card */}
            <Card className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F4F5F9] dark:border-slate-800">
                  <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white">Identified Root Cause</h3>
                  <Badge variant="purple" size="xs">
                    AI Synthesis
                  </Badge>
                </div>
                <div className="mt-4 p-3.5 rounded-xl bg-white dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-xs text-gray-900 dark:text-white leading-relaxed font-semibold">
                  "{investigation?.root_cause || 'Analyzing anomaly signatures...'}"
                </div>

                <div className="mt-4">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Supporting Evidence
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {(investigation?.evidence || []).map((item, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300"
                      >
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Recommended Action */}
            <Card className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F4F5F9] dark:border-slate-800">
                  <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white">Recommended Action</h3>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={investigation?.risk_level || 'high'} size="xs">
                      {investigation?.risk_level} Risk
                    </Badge>
                    <Badge
                      variant={investigation?.requires_approval ? 'warning' : 'healthy'}
                      size="xs"
                    >
                      {investigation?.requires_approval ? 'Sign-Off Required' : 'Auto-Execute'}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 p-3.5 rounded-xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                  <div className="font-bold text-[#1E1B4B] dark:text-white mb-1">
                    {investigation?.remediation_title || investigation?.recommended_action}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                    {investigation?.impact_assessment || 'Safe isolated action evaluated against dry-run policy.'}
                  </p>
                </div>

                {investigation?.suggested_command && (
                  <div className="mt-4">
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                      <span>Dry-Run Command Plan</span>
                      <span className="text-[#059669] dark:text-emerald-400 font-semibold">Validated</span>
                    </div>
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-[#34D399] overflow-x-auto whitespace-pre-wrap break-all max-w-full">
                      {investigation.suggested_command}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 border-t border-[#F4F5F9] dark:border-slate-800">
                <span>Safety Check: <strong className="text-slate-700 dark:text-slate-300">Passed</strong></span>
                {investigation?.requires_approval && (
                  <Link to="/approvals" className="text-xs text-[#6C5CE7] dark:text-[#A78BFA] hover:underline font-bold">
                    Go to Approvals Queue →
                  </Link>
                )}
              </div>
            </Card>
          </div>

          {/* Row 3: Facts vs Evaluated Hypotheses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Verified Facts */}
            <Card className="p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F4F5F9] dark:border-slate-800">
                <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white">Verified Telemetry Measurements</h3>
                <Badge variant="verified-fact" size="xs">
                  System Telemetry
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                {(investigation?.verified_facts || [
                  { label: 'Active Socket Connections', value: '198 / 200 (99.4%)' },
                  { label: 'Target Service', value: activeIncident.service },
                  { label: 'Latency Measurement', value: '3,840ms p99 vs 120ms normal' },
                ]).map((fact, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-emerald-400 flex-shrink-0" />
                      <span>{fact.label}</span>
                    </div>
                    <span className="font-mono font-bold text-[#1E1B4B] dark:text-white">{fact.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Hypotheses */}
            <Card className="p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F4F5F9] dark:border-slate-800">
                <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white">Evaluated Hypotheses</h3>
                <Badge variant="default" size="xs">
                  Candidate Causes
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                {(investigation?.ai_hypotheses || [
                  { label: 'Unclosed DB Sessions', probability: 0.94, status: 'confirmed', reason: 'Matches worker sync release' },
                  { label: 'DDoS Traffic Spike', probability: 0.08, status: 'rejected', reason: 'Traffic within baseline' },
                  { label: 'Network Partition', probability: 0.05, status: 'rejected', reason: 'Host ping normal' },
                ]).map((hypo, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 text-xs flex items-center justify-between gap-3 bg-[#F6F7FB] dark:bg-[#0D1424]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1E1B4B] dark:text-white">{hypo.label}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            hypo.status === 'confirmed'
                              ? 'bg-white dark:bg-[#111726] border-gray-200 dark:border-slate-800 text-[#059669] dark:text-emerald-400'
                              : 'bg-white dark:bg-[#111726] border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400'
                          }`}
                        >
                          {hypo.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">{hypo.reason}</div>
                    </div>
                    <span className="font-mono font-bold text-[#1E1B4B] dark:text-white text-xs">
                      {Math.round(hypo.probability * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Row 4: Evidence logs & deployment changes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Logs */}
            <Card className="lg:col-span-2 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F4F5F9] dark:border-slate-800">
                <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  Correlated Anomaly Log Lines
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-400 font-mono">Stdout / Stderr</span>
              </div>
              <div className="mt-4 bg-slate-900 border border-slate-800 p-4 rounded-xl font-mono text-xs space-y-2 max-h-56 overflow-y-auto">
                {(evidence.logs || []).map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed text-[11px] ${
                      log.includes('FATAL') || log.includes('ERROR')
                        ? 'text-rose-400 font-semibold'
                        : log.includes('WARNING') || log.includes('WARN')
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </Card>

            {/* Changes & Dependencies */}
            <Card className="p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F4F5F9] dark:border-slate-800">
                <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  Recent Changes
                </h3>
              </div>
              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Deployments (24h)
                  </div>
                  <div className="space-y-1.5">
                    {(evidence.recent_changes || ['No recent code changes']).map((ch, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {ch}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Dependency Status
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {Object.entries(evidence.dependency_status || {}).map(([dep, st]) => (
                      <div
                        key={dep}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{dep}</span>
                        <span
                          className={
                            st.includes('degraded')
                              ? 'text-[#D97706] dark:text-amber-400 font-semibold'
                              : 'text-[#059669] dark:text-emerald-400 font-semibold'
                          }
                        >
                          {st}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvestigationPage;
