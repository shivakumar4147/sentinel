import React, { useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { UnifiedKpiStrip } from '../components/dashboard/UnifiedKpiStrip';
import { ClusterTelemetryRow } from '../components/dashboard/ClusterTelemetryRow';
import { IncidentChart } from '../components/dashboard/IncidentChart';
import { ResourceUsageChart } from '../components/dashboard/ResourceUsageChart';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { Badge } from '../components/common/Badge';
import {
  AlertCircle,
  FileSearch,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileCode,
  ArrowRight,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function OverviewPage() {
  const {
    incidents,
    remediations,
    auditLogs,
    liveStoreStatus,
    acceptAndApplySolution,
    rejectSolution,
  } = useSentinel();

  const [isApplying, setIsApplying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Find the active checkout / critical incident
  const activeIncident =
    incidents.find(
      (i) =>
        i.status !== 'resolved' &&
        (i.incident_id === 'INC-002' ||
          i.service?.toLowerCase().includes('ecommerce') ||
          i.service?.toLowerCase().includes('checkout') ||
          i.summary?.toLowerCase().includes('checkout') ||
          i.severity === 'critical')
    ) || incidents.find((i) => i.status !== 'resolved');

  // Find corresponding remediation proposal
  const activeRemediation =
    remediations.find(
      (r) =>
        r.incident_id === activeIncident?.incident_id ||
        r.remediation_id === activeIncident?.remediation_id
    ) ||
    remediations.find(
      (r) => r.status === 'awaiting_approval' || r.status === 'pending_approval'
    );

  const isStoreDegraded =
    liveStoreStatus?.active_scenario !== 'normal' ||
    liveStoreStatus?.is_failing ||
    (activeIncident && activeIncident.status !== 'resolved');

  const hasPendingSolution =
    activeRemediation &&
    (activeRemediation.status === 'awaiting_approval' ||
      activeRemediation.status === 'pending_approval' ||
      activeRemediation.status === 'approved');

  const showSolutionCard = isStoreDegraded || hasPendingSolution;

  // Solution and Diff Data
  const targetFile =
    activeIncident?.target_file ||
    activeRemediation?.target_file ||
    'demo-application/api/main.py';

  const rawPatch =
    activeIncident?.investigation?.patch_generation?.patches?.[0] ||
    (activeIncident?.investigation?.patch_generation?.unified_diff
      ? activeIncident.investigation.patch_generation
      : null) ||
    (activeRemediation?.diff
      ? { file_path: targetFile, unified_diff: activeRemediation.diff }
      : null);

  const diffString =
    rawPatch?.unified_diff ||
    activeRemediation?.diff ||
    `--- a/demo-application/api/main.py\n+++ b/demo-application/api/main.py\n@@ -511,7 +511,7 @@\n     # CONTROLLED BAD-DEPLOYMENT FAILURE\n-    if SIMULATE_BAD_DEPLOYMENT:\n+    if False and SIMULATE_BAD_DEPLOYMENT:  # Fixed by Sentinel Remediation\n         log_event(\n`;

  const solutionExplanation =
    rawPatch?.explanation ||
    activeRemediation?.reason ||
    'Safely bypasses intentional bad deployment failure flag, restoring healthy checkout execution.';

  const handleAccept = async () => {
    setIsApplying(true);
    try {
      const remId =
        activeRemediation?.remediation_id ||
        activeIncident?.remediation_id ||
        'REM-102';
      await acceptAndApplySolution(remId, 'Operator approved fix from dashboard');
    } finally {
      setIsApplying(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const remId =
        activeRemediation?.remediation_id ||
        activeIncident?.remediation_id ||
        'REM-102';
      await rejectSolution(remId, 'Operator rejected fix from dashboard');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Dedicated Active Incident & AI Remediation Solution Card */}
      {showSolutionCard && (activeIncident || activeRemediation) ? (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0F1420] border-2 border-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.22)] text-white space-y-5 transition-all">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800/60 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  CRITICAL INCIDENT DETECTED
                </span>
                <span className="font-mono text-xs font-bold bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-200">
                  {activeIncident.incident_id}
                </span>
                <Badge variant={activeIncident.status || 'critical'} size="xs">
                  {(activeIncident.status || 'awaiting_approval').replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  {activeIncident.service || 'sentinel-ecommerce-api'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-1.5">
                {activeIncident.title || activeIncident.summary}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {activeIncident.summary ||
                  'HTTP 500 Internal Server Error detected on live storefront checkout.'}
              </p>
            </div>

            <Link
              to={`/investigation?id=${activeIncident.incident_id}`}
              className="self-start md:self-center"
            >
              <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer">
                <FileSearch className="w-3.5 h-3.5 text-slate-300" />
                View Full AI Analysis
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          {/* AI Solution Box (Directly Displayed, Not Hidden) */}
          <div className="p-4 rounded-xl bg-[#090D16] border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-950/60 text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>AI Autonomous Remediation Solution</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/50">
                      Unified Diff
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">{solutionExplanation}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                Target: {targetFile}
              </span>
            </div>

            {/* Code Diff Display */}
            <div className="font-mono text-xs rounded-lg bg-[#05080F] border border-slate-800/80 p-3 overflow-x-auto leading-relaxed max-h-48 scrollbar-thin">
              {diffString.split('\n').map((line, idx) => {
                const isAdd = line.startsWith('+') && !line.startsWith('+++');
                const isDel = line.startsWith('-') && !line.startsWith('---');
                const isHeader = line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++');

                let lineClass = 'text-slate-400';
                if (isAdd) lineClass = 'text-emerald-400 bg-emerald-950/30 -mx-3 px-3 block font-semibold';
                if (isDel) lineClass = 'text-rose-400 bg-rose-950/30 -mx-3 px-3 block font-semibold';
                if (isHeader) lineClass = 'text-blue-400/80 font-bold';

                return (
                  <div key={idx} className={lineClass}>
                    {line || ' '}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Decision Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-400">
              Operator Approval Gate: Review proposed diff before deployment.
            </div>

            <div className="flex items-center gap-3">
              {/* Reject Button */}
              <button
                onClick={handleReject}
                disabled={isRejecting || isApplying}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-700/60 shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                {isRejecting ? 'Rejecting...' : 'Reject Fix'}
              </button>

              {/* Accept & Apply Button */}
              <button
                onClick={handleAccept}
                disabled={isApplying || isRejecting}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isApplying ? 'Applying & Verifying...' : 'Accept & Apply Fix'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Operational Healthy State Banner */
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                <span>All Systems Operational & Telemetry Healthy</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Veloura Storefront checkout verified healthy (HTTP 200). AI safety and autonomous remediation standing by.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Link to="/live-website">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-700/50 transition-all cursor-pointer">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Storefront Controls & Chaos Lab
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Single Unified Top KPI Strip */}
      <UnifiedKpiStrip />

      {/* 3. Cluster Health & Anomaly Rates */}
      <ClusterTelemetryRow />

      {/* 4. 2-Column Analytics Chart Row */}
      <div className="bg-white dark:bg-[#131824] border border-gray-200/90 dark:border-[#232D42] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200/90 dark:divide-[#232D42] shadow-soft transition-colors">
        <IncidentChart />
        <ResourceUsageChart />
      </div>

      {/* 5. Recent Incidents & Audit Activity Stream Panels */}
      <ActivityFeed incidents={incidents} auditLogs={auditLogs} />
    </div>
  );
}

export default OverviewPage;
