import React from 'react';
import { useSentinel } from '../context/SentinelContext';
import { UnifiedKpiStrip } from '../components/dashboard/UnifiedKpiStrip';
import { ClusterTelemetryRow } from '../components/dashboard/ClusterTelemetryRow';
import { IncidentChart } from '../components/dashboard/IncidentChart';
import { ResourceUsageChart } from '../components/dashboard/ResourceUsageChart';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { AlertCircle, FileSearch, CheckSquare, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OverviewPage() {
  const { incidents, remediations, auditLogs } = useSentinel();

  const criticalIncidents = incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length;
  const pendingApprovals = remediations.filter(
    (r) => r.status === 'awaiting_approval' || r.status === 'pending_approval' || r.status === 'changes_suggested'
  ).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Action Required: Critical Warning Card matching reference image design */}
      {criticalIncidents > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#161D2B] border border-red-500/40 ring-1 ring-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.28)] flex flex-col md:flex-row md:items-center justify-between gap-5 text-white transition-all">
          <div className="space-y-2 min-w-0 flex-1">
            {/* Header: Bell icon + Title matching reference */}
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-[#FF5B48] fill-[#FF5B48] flex-shrink-0" />
              <h3 className="font-bold text-base sm:text-lg text-white tracking-tight">
                Action Required: INC-8492
              </h3>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl pl-7.5">
              Postgres pool at 99.4%. Remediation plan awaiting on-call sign-off.
            </p>

            {/* Tag pill + Metric matching the reference image */}
            <div className="flex items-center gap-3 pt-1 pl-7.5">
              <span className="bg-[#381B22] border border-[#5C232B] text-[#FF6363] text-[11px] font-bold uppercase px-3 py-0.5 rounded-full tracking-wider">
                CRITICAL
              </span>
              <span className="text-[#FF6363] font-bold font-mono text-sm sm:text-base tracking-tight">
                +99.4%
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-center pl-7.5 md:pl-0">
            <Link to="/investigation?id=INC-8492">
              <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#222938] hover:bg-[#2C3547] text-white border border-slate-700/70 transition-all shadow-xs active:scale-[0.98] cursor-pointer">
                <FileSearch className="w-3.5 h-3.5 flex-shrink-0 text-slate-300" />
                AI Diagnosis
              </button>
            </Link>
            <Link to="/approvals">
              <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-md shadow-rose-950/40 transition-all active:scale-[0.98] cursor-pointer">
                <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" />
                Review Approval ({pendingApprovals})
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* 1. Single Unified Top KPI Strip */}
      <UnifiedKpiStrip />

      {/* 2. Cluster Health & Anomaly Rates */}
      <ClusterTelemetryRow />

      {/* 3. 2-Column Analytics Chart Row */}
      <div className="bg-white dark:bg-[#131824] border border-gray-200/90 dark:border-[#232D42] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200/90 dark:divide-[#232D42] shadow-soft transition-colors">
        <IncidentChart />
        <ResourceUsageChart />
      </div>

      {/* 4. Recent Incidents & Audit Activity Stream Panels */}
      <ActivityFeed incidents={incidents} auditLogs={auditLogs} />
    </div>
  );
}

export default OverviewPage;