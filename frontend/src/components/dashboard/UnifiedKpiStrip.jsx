import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function UnifiedKpiStrip() {
  const kpis = [
    {
      title: 'Monitored Fleet',
      value: '4 Nodes',
      trend: '0.5%',
      isPositive: true,
      subtitle: '4 Active Containers',
    },
    {
      title: 'Recovery Rate',
      value: '86.84%',
      trend: '1.7%',
      isPositive: false,
      subtitle: '33 Resolved (7d)',
    },
    {
      title: 'Error Rate',
      value: '2.63%',
      trend: '2.3%',
      isPositive: false,
      subtitle: '1 Degraded (504s)',
    },
    {
      title: 'Auto-Remediated',
      value: '75.0%',
      trend: '1.0%',
      isPositive: true,
      subtitle: '15 Actions Executed',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#131824] border border-gray-200/90 dark:border-[#232D42] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200/90 dark:divide-[#232D42] shadow-soft transition-colors">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className="p-6 flex flex-col justify-between hover:bg-slate-50/60 dark:hover:bg-[#1A2234] transition-colors select-none"
        >
          <div>
            {/* Header: Title + external link icon */}
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                {kpi.title}
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
              </span>
            </div>

            {/* Value & Clean Trend */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {kpi.value}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                  kpi.isPositive ? 'text-[#059669] dark:text-emerald-400' : 'text-[#E11D48] dark:text-rose-400'
                }`}
              >
                {kpi.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#059669] dark:text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-[#E11D48] dark:text-rose-400" />
                )}
                {kpi.trend}
              </span>
            </div>
          </div>

          {/* Subtitle */}
          <div className="mt-2 text-xs text-gray-400 dark:text-slate-500 font-medium">
            {kpi.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}

export default UnifiedKpiStrip;