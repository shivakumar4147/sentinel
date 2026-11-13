import React from 'react';

export function StatusIndicator({ status = 'healthy', size = 'md' }) {
  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const colorMap = {
    healthy: 'bg-emerald-500',
    running: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    warning: 'bg-amber-500',
    critical: 'bg-rose-500',
    stopped: 'bg-rose-500',
    offline: 'bg-slate-400',
  };

  const dotColor = colorMap[status?.toLowerCase()] || 'bg-slate-400';
  const dotSize = sizeMap[size] || sizeMap.md;

  return (
    <span className="inline-flex items-center justify-center">
      <span className={`inline-block rounded-full ${dotSize} ${dotColor}`} />
    </span>
  );
}

export default StatusIndicator;
