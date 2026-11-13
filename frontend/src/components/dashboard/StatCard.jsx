import React from 'react';
import { Card } from '../common/Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendPositive = true,
}) {
  return (
    <Card className="p-5 flex flex-col justify-between" hover={false}>
      <div>
        {/* Title row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 tracking-tight flex items-center gap-1.5">
            {title}
            <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
          </span>
        </div>

        {/* Value with clean colored text trend */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {value}
          </span>
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                trendPositive ? 'text-[#059669] dark:text-emerald-400' : 'text-[#E11D48] dark:text-rose-400'
              }`}
            >
              {trendPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-[#059669] dark:text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-[#E11D48] dark:text-rose-400" />
              )}
              {trend}
            </span>
          )}
        </div>
      </div>

      {/* Subtitle below value */}
      <div className="mt-2 text-xs text-gray-400 dark:text-slate-500 font-medium">
        {subtitle}
      </div>
    </Card>
  );
}

export default StatCard;