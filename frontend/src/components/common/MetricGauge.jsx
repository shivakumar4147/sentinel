import React from 'react';

export function MetricGauge({
  label,
  value,
  max = 100,
  unit = '%',
  warningThreshold = 75,
  criticalThreshold = 85,
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  let colorClass = 'bg-[#6C5CE7] dark:bg-[#8B5CF6]';
  let textColorClass = 'text-slate-800 dark:text-slate-200 font-medium';

  if (percentage >= criticalThreshold) {
    colorClass = 'bg-rose-500';
    textColorClass = 'text-rose-600 dark:text-rose-400 font-semibold';
  } else if (percentage >= warningThreshold) {
    colorClass = 'bg-amber-500';
    textColorClass = 'text-amber-600 dark:text-amber-400 font-semibold';
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
        <span className={`font-mono ${textColorClass}`}>
          {value}
          {unit}
        </span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default MetricGauge;