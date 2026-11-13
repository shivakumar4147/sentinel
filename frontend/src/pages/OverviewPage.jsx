import React from 'react';
import { useSentinel } from '../context/SentinelContext';
import { TasksOverviewChart } from '../components/dashboard/TasksOverviewChart';
import { RecentIncidentsCard } from '../components/dashboard/RecentIncidentsCard';
import { AppleKpiCard } from '../components/dashboard/AppleKpiCard';
import { SystemEfficiencyCard } from '../components/dashboard/SystemEfficiencyCard';
import { Filter, Bell, FileSearch, CheckSquare, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OverviewPage() {
  const { incidents, remediations } = useSentinel();

  const criticalIncidents = incidents.filter(
    (i) => i.severity === 'critical' && i.status !== 'resolved'
  ).length;

  const pendingApprovals = remediations.filter(
    (r) => r.status === 'awaiting_approval' || r.status === 'pending_approval' || r.status === 'changes_suggested'
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Critical Alert Bar (Apple solid matte styling, if critical incidents exist) */}
      {criticalIncidents > 0 && (
        <div className="p-4 sm:p-5 rounded-[20px] bg-[#161318] dark:bg-[#150F14] border border-red-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-[0_4px_24px_rgba(239,68,68,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-[#FF5B48]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">
                  Action Required: INC-8492
                </span>
                <span className="bg-red-950/70 border border-red-700/50 text-[#FF6363] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                  Critical
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Postgres connection pool at 99.4%. Remediation plan awaiting on-call operator sign-off.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-center">
            <Link to="/investigation?id=INC-8492">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#221C24] hover:bg-[#2F2633] text-white border border-white/10 transition-all cursor-pointer">
                <FileSearch className="w-3.5 h-3.5 text-slate-300" />
                AI Diagnosis
              </button>
            </Link>
            <Link to="/approvals">
              <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#E11D48] hover:bg-[#BE123C] text-white transition-all shadow-xs cursor-pointer">
                <CheckSquare className="w-3.5 h-3.5" />
                Review Approval ({pendingApprovals})
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Dashboard Title & Filter Header Row (Matching Reference Image) */}
      <div className="flex items-center justify-between select-none">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Dashboard
        </h1>

        <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E5E5EA] dark:border-white/[0.08] bg-white dark:bg-[#141522] text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] shadow-2xs hover:bg-slate-50 dark:hover:bg-[#1A1B2C] transition-all cursor-pointer">
          <span>Filter</span>
          <Filter className="w-3 h-3 text-slate-400 dark:text-[#A78BFA]" />
        </button>
      </div>

      {/* Asymmetric 2-Column Dashboard Grid Matching Reference Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Wide, ~66% - 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Row 1: Tasks Overview Spline Telemetry Chart */}
          <TasksOverviewChart />

          {/* Row 2: Recent Incidents Table + 2 Stacked Apple KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Recent Incidents Table Card (~58% width - 7 cols) */}
            <div className="md:col-span-7 flex flex-col">
              <RecentIncidentsCard />
            </div>

            {/* Two Stacked Apple KPI Cards (~42% width - 5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between gap-6">
              <AppleKpiCard
                title="Total Balance"
                value="$ 80.440"
                trend="+8% To the last month"
                glow={true}
              />
              <AppleKpiCard
                title="Total Balance"
                value="$ 84.220"
                trend="+8% To the last month"
                glow={true}
              />
            </div>
          </div>
        </div>

        {/* Right Column (Narrow, ~34% - 4 cols): Transactions / System Efficiency with Arc Gauge */}
        <div className="lg:col-span-4 h-full">
          <SystemEfficiencyCard />
        </div>
      </div>
    </div>
  );
}

export default OverviewPage;
