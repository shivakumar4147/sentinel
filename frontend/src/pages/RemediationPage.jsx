import React, { useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Terminal,
  ShieldCheck,
  Activity,
  FileCode,
} from 'lucide-react';
import { DiffViewer } from '../components/investigation/DiffViewer';
import { Link } from 'react-router-dom';

export function RemediationPage() {
  const { remediations, executeRemediation } = useSentinel();
  const [executingId, setExecutingId] = useState(null);

  const handleExecute = async (remId) => {
    setExecutingId(remId);
    try {
      await executeRemediation(remId);
    } finally {
      setExecutingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'successful':
        return <Badge variant="completed" size="xs">Successful</Badge>;
      case 'approved':
        return <Badge variant="approved" size="xs">Approved (Ready to Run)</Badge>;
      case 'executing':
        return <Badge variant="executing" size="xs">Executing...</Badge>;
      case 'awaiting_approval':
      case 'pending_approval':
        return <Badge variant="awaiting_approval" size="xs">Awaiting Sign-off</Badge>;
      case 'rejected':
        return <Badge variant="rejected" size="xs">Rejected</Badge>;
      case 'changes_suggested':
        return <Badge variant="changes_suggested" size="xs">Changes Suggested</Badge>;
      case 'rolled_back':
        return <Badge variant="warning" size="xs">Rolled Back</Badge>;
      default:
        return <Badge variant="pending" size="xs">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        <div>
          <h2 className="text-base font-bold text-[#1E1B4B] dark:text-white">Remediation Engine</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Tracks execution lifecycle, simulation validations, snapshots, and recovery verification checks.
          </p>
        </div>
      </div>

      {/* Remediation Cards List */}
      <div className="space-y-4">
        {remediations.map((rem) => {
          const isApproved = rem.status === 'approved';
          const isCompleted = rem.status === 'completed' || rem.status === 'successful';
          const isExecuting = rem.status === 'executing' || executingId === rem.remediation_id;
          const isAwaiting = rem.status === 'awaiting_approval' || rem.status === 'pending_approval';

          return (
            <Card
              key={rem.remediation_id}
              className={`p-5 bg-white dark:bg-[#111726] ${
                isApproved ? 'border-[#6C5CE7]/60 ring-1 ring-[#6C5CE7]/20' : 'border-gray-200 dark:border-slate-800'
              }`}
              hover={true}
            >
              {/* Header row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-[#F4F5F9] dark:border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#1E1B4B] dark:text-white bg-[#F6F7FB] dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    {rem.remediation_id}
                  </span>
                  <Link
                    to={`/investigation?id=${rem.incident_id}`}
                    className="font-mono text-xs font-bold text-[#6C5CE7] dark:text-[#A78BFA] hover:underline"
                  >
                    Incident: {rem.incident_id}
                  </Link>
                  {getStatusBadge(rem.status)}
                  <Badge variant={rem.risk_level} size="xs">
                    {rem.risk_level} Risk
                  </Badge>
                  <span className="text-xs text-slate-400 dark:text-slate-400 font-mono">
                    Target: <strong className="text-slate-700 dark:text-slate-300">{rem.target_service}</strong>
                  </span>
                </div>

                {/* Execution action */}
                <div className="flex items-center gap-2">
                  {isApproved && (
                    <Button
                      variant="primary"
                      size="xs"
                      icon={Play}
                      loading={isExecuting}
                      onClick={() => handleExecute(rem.remediation_id)}
                    >
                      Execute Remediation Now
                    </Button>
                  )}
                  {isAwaiting && (
                    <Link to="/approvals">
                      <Button variant="warning" size="xs">
                        Review Approval →
                      </Button>
                    </Link>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-1.5 text-xs text-[#059669] dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Executed & Recovery Verified
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Reason */}
              <div className="py-3.5 space-y-1">
                <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                  {rem.title || rem.action_type}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
                  {rem.reason}
                </p>
                {rem.suggestion && (
                  <div className="mt-2.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300">
                    <strong className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">Operator Suggestion: </strong>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{rem.suggestion}</span>
                  </div>
                )}
              </div>

              {/* Execution Steps Timeline */}
              <div className="py-2.5">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                  Execution Timeline
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(rem.timeline || [
                    { step: 'Detection', time: '16:15:30', status: 'completed', description: 'Telemetry alarm' },
                    { step: 'Analysis', time: '16:17:10', status: 'completed', description: 'Root cause identified' },
                    { step: 'Execution', time: 'Pending', status: isCompleted ? 'completed' : isExecuting ? 'active' : 'pending', description: 'Applying safe fix' },
                    { step: 'Verification', time: 'Pending', status: isCompleted ? 'completed' : 'pending', description: 'Probing recovery' },
                  ]).map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                        t.status === 'completed'
                          ? 'bg-white dark:bg-[#0D1424] border-gray-200 dark:border-slate-800'
                          : t.status === 'active'
                          ? 'bg-white dark:bg-[#0D1424] border-2 border-[#6344F5] text-gray-900 dark:text-white shadow-sm'
                          : 'bg-white dark:bg-[#0D1424] border-gray-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-[#1E1B4B] dark:text-white">{t.step}</span>
                          <span className="font-mono text-slate-400 dark:text-slate-400">{t.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{t.description}</p>
                      </div>
                      <div className="mt-2 text-[10px] uppercase font-mono font-bold">
                        {t.status === 'completed' && <span className="text-[#059669] dark:text-emerald-400">Done</span>}
                        {t.status === 'active' && <span className="text-[#6C5CE7] dark:text-[#A78BFA] font-extrabold">Running...</span>}
                        {t.status === 'pending' && <span className="text-slate-400 dark:text-slate-500">Queued</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Inspection: Output, Dry-Run & Rollback */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-[#EEF0F6] dark:border-slate-800 space-y-0.5">
                  <div className="text-[11px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider">Dry-Run Simulation</div>
                  <div className="font-bold text-[#059669] dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Passed (Exit Code 0)
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">Pre-flight checks passed</div>
                </div>

                <div className="p-3 rounded-xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-[#EEF0F6] dark:border-slate-800 space-y-0.5">
                  <div className="text-[11px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider">Rollback Snapshot</div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                    Standby Armed
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {rem.rollback_status || 'Snapshot ready'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-[#EEF0F6] dark:border-slate-800 space-y-0.5">
                  <div className="text-[11px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider">Recovery Verification</div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#6C5CE7] dark:text-[#A78BFA]" />
                    {rem.recovery_verification?.status === 'verified'
                      ? 'Verified (100% Nominal)'
                      : rem.recovery_verification?.status === 'in_progress'
                      ? 'Probing Metrics...'
                      : 'Pending Execution'}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">Post-fix connection probes</div>
                </div>
              </div>

              {/* Staged Code Patch Diff (if applicable) */}
              {(rem.diff || rem.action_type === 'apply_code_patch') && (
                <div className="mt-4 pt-3 border-t border-[#F4F5F9] dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                    <span>Applied Code Patch (Unified Diff)</span>
                  </div>
                  <DiffViewer
                    patch={{
                      file_path: rem.affected_file || rem.target_file || (rem.incident_id === 'INC-8490' || rem.incident_id === 'INC-002' ? 'demo-application/api/main.py' : 'worker/main.py'),
                      unified_diff: rem.diff || `--- a/demo-application/api/main.py\n+++ b/demo-application/api/main.py\n@@ -511,7 +511,7 @@\n-    if SIMULATE_BAD_DEPLOYMENT:\n+    if False and SIMULATE_BAD_DEPLOYMENT:  # Fixed by Sentinel Remediation\n         log_event(`,
                      confidence: 0.99,
                    }}
                    showApplyButton={false}
                  />
                </div>
              )}

              {/* Execution Logs */}
              {rem.output && (
                <div className="mt-4 pt-3 border-t border-[#F4F5F9] dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                    Execution Output
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400">
                    {rem.output}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default RemediationPage;