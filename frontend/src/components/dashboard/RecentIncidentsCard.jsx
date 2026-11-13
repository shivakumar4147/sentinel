import React, { useState } from 'react';
import { Filter, ChevronDown, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSentinel } from '../../context/SentinelContext';

export function RecentIncidentsCard() {
  const { incidents, timeRange, setTimeRange } = useSentinel();
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('Last 7 Days');
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  // Timeframe options
  const timeframeOptions = ['Last 24 Hours', 'Last 3 Days', 'Last 7 Days', 'Last 1 Month'];

  // Map incidents to display rows matching the reference layout
  const rows = [
    {
      id: 'INC-8492',
      name: 'Willum Bickham',
      role: 'Postgres Connection Saturation',
      category: 'IT Info',
      severity: 'Critical',
      amount: '$740.000',
      metric: '99.4% Pool',
      date: 'June 20.2026',
    },
    {
      id: 'INC-8491',
      name: 'Guy Hawkins',
      role: 'Payment Worker Queue Stall',
      category: 'SaaS',
      severity: 'High',
      amount: '$740.000',
      metric: '412 req/s',
      date: 'June 20.2026',
    },
    {
      id: 'INC-8490',
      name: 'Howard',
      role: 'Auth Token Renewal Latency',
      category: 'Operational',
      severity: 'Medium',
      amount: '$740.000',
      metric: '2.4x norm',
      date: 'June 20.2026',
    },
    {
      id: 'INC-8489',
      name: 'Guy Hawkins',
      role: 'Redis Key Eviction Cascade',
      category: 'SaaS',
      severity: 'Resolved',
      amount: '$740.000',
      metric: 'Auto-Cleared',
      date: 'June 20.2026',
    },
    {
      id: 'INC-8488',
      name: 'Howard',
      role: 'API Gateway Ingress Jitter',
      category: 'Operational',
      severity: 'Low',
      amount: '$740.000',
      metric: '18ms',
      date: 'June 20.2026',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0F1018] border border-[#E5E5EA] dark:border-white/[0.07] rounded-[22px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.035)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all flex flex-col justify-between">
      {/* Card Header matching reference: Title + Timeframe Pill + Filter Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
          Recent Incidents
        </h3>

        <div className="flex items-center gap-2">
          {/* Timeframe selector pill */}
          <div className="relative">
            <button
              onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E5EA] dark:border-white/[0.08] bg-slate-50 dark:bg-[#141522] text-xs font-semibold text-slate-700 dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#1A1B2C] transition-colors cursor-pointer"
            >
              <span>{selectedTimeframe}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {timeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#141522] border border-[#E5E5EA] dark:border-white/[0.08] rounded-xl shadow-lg py-1.5 z-30 animate-fade-in">
                {timeframeOptions.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      setSelectedTimeframe(tf);
                      setTimeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                      selectedTimeframe === tf
                        ? 'font-bold text-[#8B5CF6] dark:text-[#C4B5FD] bg-purple-50 dark:bg-purple-950/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter button pill */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              filterOpen
                ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#0A0B10] border-transparent'
                : 'bg-white dark:bg-[#141522] text-slate-700 dark:text-[#D1D5DB] border-[#E5E5EA] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#1A1B2C]'
            }`}
          >
            <span>Filter</span>
            <Filter className="w-3 h-3 text-slate-400 dark:text-[#A78BFA]" />
          </button>
        </div>
      </div>

      {/* Table content matching the reference image layout: Name | Category | Amount | Date */}
      <div className="overflow-x-auto select-none">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-400 dark:text-[#6B7280] border-b border-[#E5E5EA] dark:border-white/[0.05]">
              <th className="pb-3 font-normal">Name</th>
              <th className="pb-3 font-normal text-center">Category</th>
              <th className="pb-3 font-normal text-right">Impact</th>
              <th className="pb-3 font-normal text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5EA] dark:divide-white/[0.04]">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="group hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                {/* Name */}
                <td className="py-3.5 pr-2">
                  <Link to={`/investigation?id=${row.id}`} className="block">
                    <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#8B5CF6] dark:group-hover:text-[#C4B5FD] transition-colors">
                      {row.name}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {row.id} • {row.role}
                    </div>
                  </Link>
                </td>

                {/* Category Pill Badge (Matching the rounded badges in reference image: IT Info, SaaS, Operational) */}
                <td className="py-3.5 px-2 text-center">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#141522] border border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-[#9CA3AF]">
                    {row.category}
                  </span>
                </td>

                {/* Amount / Impact */}
                <td className="py-3.5 px-2 text-right">
                  <div className="text-xs font-mono font-semibold text-gray-900 dark:text-[#F3F4F6]">
                    {row.amount}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {row.metric}
                  </div>
                </td>

                {/* Date */}
                <td className="py-3.5 pl-2 text-right">
                  <div className="text-xs font-mono text-slate-600 dark:text-[#9CA3AF]">
                    {row.date}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentIncidentsCard;
