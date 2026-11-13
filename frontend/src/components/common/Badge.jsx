import React from 'react';

export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const sizeClasses = {
    xs: 'text-[11px] px-2 py-0.5 font-medium',
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-xs px-3 py-1 font-medium',
  };

  const variantMap = {
    // Incident Severities / Alert states
    critical: 'bg-rose-50/50 dark:bg-[#131824] text-[#E11D48] dark:text-[#FB7185] border border-rose-200 dark:border-rose-900/40',
    high: 'bg-rose-50/50 dark:bg-[#131824] text-[#E11D48] dark:text-[#FB7185] border border-rose-200 dark:border-rose-900/40',
    warning: 'bg-amber-50/50 dark:bg-[#131824] text-[#D97706] dark:text-[#FBBF24] border border-amber-200 dark:border-amber-900/40',
    medium: 'bg-amber-50/50 dark:bg-[#131824] text-[#D97706] dark:text-[#FBBF24] border border-amber-200 dark:border-amber-900/40',
    low: 'bg-blue-50/50 dark:bg-[#131824] text-[#2563EB] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-900/40',
    info: 'bg-sky-50/50 dark:bg-[#131824] text-[#0284C7] dark:text-[#38BDF8] border border-sky-200 dark:border-sky-900/40',
    
    // Statuses
    healthy: 'bg-emerald-50/50 dark:bg-[#131824] text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/40',
    running: 'bg-emerald-50/50 dark:bg-[#131824] text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/40',
    resolved: 'bg-emerald-50/50 dark:bg-[#131824] text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/40',
    completed: 'bg-emerald-50/50 dark:bg-[#131824] text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/40',
    approved: 'bg-emerald-50/50 dark:bg-[#131824] text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/40',
    
    degraded: 'bg-amber-50/50 dark:bg-[#131824] text-[#D97706] dark:text-[#FBBF24] border border-amber-200 dark:border-amber-900/40',
    awaiting_approval: 'bg-amber-50/50 dark:bg-[#131824] text-[#D97706] dark:text-[#FBBF24] border border-amber-200 dark:border-amber-900/40',
    pending: 'bg-slate-50 dark:bg-[#131824] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800',
    
    investigating: 'bg-blue-50/50 dark:bg-[#131824] text-[#2563EB] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-900/40',
    executing: 'bg-sky-50/50 dark:bg-[#131824] text-[#0284C7] dark:text-[#38BDF8] border border-sky-200 dark:border-sky-900/40',
    remediating: 'bg-blue-50/50 dark:bg-[#131824] text-[#2563EB] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-900/40',

    rejected: 'bg-rose-50/50 dark:bg-[#131824] text-[#E11D48] dark:text-[#FB7185] border border-rose-200 dark:border-rose-900/40',
    changes_suggested: 'bg-blue-50/60 dark:bg-[#131824] text-[#2563EB] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-900/60 font-semibold',
    'changes suggested': 'bg-blue-50/60 dark:bg-[#131824] text-[#2563EB] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-900/60 font-semibold',
    revised_pending: 'bg-sky-50/60 dark:bg-[#131824] text-[#0284C7] dark:text-[#38BDF8] border border-sky-200 dark:border-sky-900/60 font-semibold',
    revised: 'bg-sky-50/60 dark:bg-[#131824] text-[#0284C7] dark:text-[#38BDF8] border border-sky-200 dark:border-sky-900/60 font-semibold',
    failed: 'bg-rose-50/50 dark:bg-[#131824] text-[#E11D48] dark:text-[#FB7185] border border-rose-200 dark:border-rose-900/40',
    stopped: 'bg-slate-50 dark:bg-[#131824] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800',
    
    // AI distinction (Cobalt/Cyan technical precision rather than generic purple)
    'ai-recommendation': 'bg-blue-50/50 dark:bg-[#131824] text-[#2563EB] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-900/40',
    'verified-fact': 'bg-emerald-50/50 dark:bg-[#131824] text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/40',
    
    // Default
    default: 'bg-slate-50 dark:bg-[#131824] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800',
    neutral: 'bg-slate-50 dark:bg-[#131824] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800',
    cobalt: 'bg-blue-50/50 dark:bg-[#131824] text-[#2563EB] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-900/40',
    cyan: 'bg-sky-50/50 dark:bg-[#131824] text-[#0284C7] dark:text-[#38BDF8] border border-sky-200 dark:border-sky-900/40',
  };

  const styleClass = variantMap[variant?.toLowerCase()] || variantMap.default;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md ${sizeClasses[size] || sizeClasses.sm} ${styleClass} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;