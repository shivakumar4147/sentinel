import React from 'react';

export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const sizeClasses = {
    xs: 'text-[11px] px-2.5 py-0.5 font-semibold rounded-full',
    sm: 'text-xs px-3 py-0.5 font-semibold rounded-full',
    md: 'text-xs px-3.5 py-1 font-semibold rounded-full',
  };

  const variantMap = {
    // Incident Severities / Alert states
    critical: 'bg-rose-50/60 dark:bg-rose-950/40 text-[#E11D48] dark:text-[#FB7185] border border-rose-200 dark:border-rose-900/50',
    high: 'bg-rose-50/60 dark:bg-rose-950/40 text-[#E11D48] dark:text-[#FB7185] border border-rose-200 dark:border-rose-900/50',
    warning: 'bg-amber-50/60 dark:bg-amber-950/40 text-[#D97706] dark:text-[#FBBF24] border border-amber-200 dark:border-amber-900/50',
    medium: 'bg-amber-50/60 dark:bg-amber-950/40 text-[#D97706] dark:text-[#FBBF24] border border-amber-200 dark:border-amber-900/50',
    low: 'bg-purple-50/60 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#C4B5FD] border border-purple-200 dark:border-purple-900/50',
    info: 'bg-sky-50/60 dark:bg-sky-950/40 text-[#0284C7] dark:text-[#38BDF8] border border-sky-200 dark:border-sky-900/50',
    
    // Statuses
    healthy: 'bg-emerald-50/60 dark:bg-emerald-950/40 text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/50',
    running: 'bg-emerald-50/60 dark:bg-emerald-950/40 text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/50',
    resolved: 'bg-emerald-50/60 dark:bg-emerald-950/40 text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/50',
    completed: 'bg-emerald-50/60 dark:bg-emerald-950/40 text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/50',
    approved: 'bg-emerald-50/60 dark:bg-emerald-950/40 text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/50',
    
    degraded: 'bg-amber-50/60 dark:bg-amber-950/40 text-[#D97706] dark:text-[#FBBF24] border border-amber-200 dark:border-amber-900/50',
    awaiting_approval: 'bg-purple-50/60 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#C4B5FD] border border-purple-200 dark:border-purple-900/50',
    pending: 'bg-slate-100 dark:bg-[#141522] text-slate-700 dark:text-slate-300 border border-[#E5E5EA] dark:border-white/[0.08]',
    
    investigating: 'bg-purple-50/60 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#C4B5FD] border border-purple-200 dark:border-purple-900/50',
    executing: 'bg-sky-50/60 dark:bg-sky-950/40 text-[#0284C7] dark:text-[#38BDF8] border border-sky-200 dark:border-sky-900/50',
    remediating: 'bg-purple-50/60 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#C4B5FD] border border-purple-200 dark:border-purple-900/50',

    rejected: 'bg-rose-50/60 dark:bg-rose-950/40 text-[#E11D48] dark:text-[#FB7185] border border-rose-200 dark:border-rose-900/50',
    changes_suggested: 'bg-purple-50/80 dark:bg-purple-950/50 text-[#7C3AED] dark:text-[#D8B4FE] border border-purple-200 dark:border-purple-800/60 font-bold',
    'changes suggested': 'bg-purple-50/80 dark:bg-purple-950/50 text-[#7C3AED] dark:text-[#D8B4FE] border border-purple-200 dark:border-purple-800/60 font-bold',
    revised_pending: 'bg-purple-50/80 dark:bg-purple-950/50 text-[#7C3AED] dark:text-[#D8B4FE] border border-purple-200 dark:border-purple-800/60 font-bold',
    revised: 'bg-purple-50/80 dark:bg-purple-950/50 text-[#7C3AED] dark:text-[#D8B4FE] border border-purple-200 dark:border-purple-800/60 font-bold',
    failed: 'bg-rose-50/60 dark:bg-rose-950/40 text-[#E11D48] dark:text-[#FB7185] border border-rose-200 dark:border-rose-900/50',
    stopped: 'bg-slate-100 dark:bg-[#141522] text-slate-700 dark:text-slate-300 border border-[#E5E5EA] dark:border-white/[0.08]',
    
    // AI distinction
    'ai-recommendation': 'bg-purple-50/60 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#C4B5FD] border border-purple-200 dark:border-purple-900/50',
    'verified-fact': 'bg-emerald-50/60 dark:bg-emerald-950/40 text-[#059669] dark:text-[#34D399] border border-emerald-200 dark:border-emerald-900/50',
    
    // Default
    default: 'bg-slate-100 dark:bg-[#141522] text-slate-700 dark:text-slate-300 border border-[#E5E5EA] dark:border-white/[0.08]',
    neutral: 'bg-slate-100 dark:bg-[#141522] text-slate-700 dark:text-slate-300 border border-[#E5E5EA] dark:border-white/[0.08]',
  };

  const styleClass = variantMap[variant?.toLowerCase()] || variantMap.default;

  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClasses[size] || sizeClasses.sm} ${styleClass} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;