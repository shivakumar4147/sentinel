import React from 'react';
import { Command, MoreHorizontal, ArrowUp } from 'lucide-react';

export function AppleKpiCard({
  icon: Icon = Command,
  title = 'Total Balance',
  value = '$ 80.440',
  trend = '+8% To the last month',
  trendPositive = true,
  glow = true,
  onMenuClick,
}) {
  return (
    <div
      className={`bg-white dark:bg-[#0F1018] border border-[#E5E5EA] dark:border-white/[0.07] rounded-[22px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.035)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all relative overflow-hidden select-none ${
        glow ? 'apple-card-glow' : ''
      }`}
    >
      {/* Top Header: Squircle Icon + Title + More Options (...) */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          {/* Squircle Icon Button with Soft Purple Tint */}
          <div className="w-10 h-10 rounded-[14px] bg-slate-100 dark:bg-[#1E1F30] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[#7C3AED] dark:text-[#C4B5FD] shadow-2xs">
            <Icon className="w-4 h-4" />
          </div>

          <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-[#D1D5DB]">
            {title}
          </span>
        </div>

        <button
          onClick={onMenuClick}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Large Bold Metric Value */}
      <div className="my-3 relative z-10">
        <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {value}
        </span>
      </div>

      {/* Bottom Trend Pill matching reference image */}
      <div className="relative z-10 flex items-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#151624] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#9CA3AF]">
          <span className="w-3.5 h-3.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7C3AED] dark:text-[#C4B5FD] flex items-center justify-center flex-shrink-0">
            <ArrowUp className="w-2.5 h-2.5" />
          </span>
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}

export default AppleKpiCard;
