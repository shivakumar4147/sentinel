import React from 'react';

export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const sizeClasses = {
    xs: 'text-[11px] px-2 py-0.5 font-medium',
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-xs px-3 py-1 font-medium',
  };

  const variantMap = {
    // Incident Severities / Alert states
    critical: 'bg-white dark:bg-[#0D1424] text-[#E11D48] dark:text-[#FB7185] border border-gray-200 dark:border-slate-800',
    high: 'bg-white dark:bg-[#0D1424] text-[#E11D48] dark:text-[#FB7185] border border-gray-200 dark:border-slate-800',
    warning: 'bg-white dark:bg-[#0D1424] text-[#D97706] dark:text-[#FBBF24] border border-gray-200 dark:border-slate-800',
    medium: 'bg-white dark:bg-[#0D1424] text-[#D97706] dark:text-[#FBBF24] border border-gray-200 dark:border-slate-800',
    low: 'bg-white dark:bg-[#0D1424] text-[#4F46E5] dark:text-[#818CF8] border border-gray-200 dark:border-slate-800',
    info: 'bg-white dark:bg-[#0D1424] text-[#6344F5] dark:text-[#A78BFA] border border-gray-200 dark:border-slate-800',
    
    // Statuses
    healthy: 'bg-white dark:bg-[#0D1424] text-[#059669] dark:text-[#34D399] border border-gray-200 dark:border-slate-800',
    running: 'bg-white dark:bg-[#0D1424] text-[#059669] dark:text-[#34D399] border border-gray-200 dark:border-slate-800',
    resolved: 'bg-white dark:bg-[#0D1424] text-[#059669] dark:text-[#34D399] border border-gray-200 dark:border-slate-800',
    completed: 'bg-white dark:bg-[#0D1424] text-[#059669] dark:text-[#34D399] border border-gray-200 dark:border-slate-800',
    approved: 'bg-white dark:bg-[#0D1424] text-[#059669] dark:text-[#34D399] border border-gray-200 dark:border-slate-800',
    
    degraded: 'bg-white dark:bg-[#0D1424] text-[#D97706] dark:text-[#FBBF24] border border-gray-200 dark:border-slate-800',
    awaiting_approval: 'bg-white dark:bg-[#0D1424] text-[#D97706] dark:text-[#FBBF24] border border-gray-200 dark:border-slate-800',
    pending: 'bg-white dark:bg-[#0D1424] text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800',
    
    investigating: 'bg-white dark:bg-[#0D1424] text-[#6344F5] dark:text-[#A78BFA] border border-gray-200 dark:border-slate-800',
    executing: 'bg-white dark:bg-[#0D1424] text-[#4F46E5] dark:text-[#818CF8] border border-gray-200 dark:border-slate-800',
    remediating: 'bg-white dark:bg-[#0D1424] text-[#6344F5] dark:text-[#A78BFA] border border-gray-200 dark:border-slate-800',

    rejected: 'bg-white dark:bg-[#0D1424] text-[#E11D48] dark:text-[#FB7185] border border-gray-200 dark:border-slate-800',
    failed: 'bg-white dark:bg-[#0D1424] text-[#E11D48] dark:text-[#FB7185] border border-gray-200 dark:border-slate-800',
    stopped: 'bg-white dark:bg-[#0D1424] text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800',
    
    // AI distinction
    'ai-recommendation': 'bg-white dark:bg-[#0D1424] text-[#6344F5] dark:text-[#A78BFA] border border-gray-200 dark:border-slate-800',
    'verified-fact': 'bg-white dark:bg-[#0D1424] text-[#059669] dark:text-[#34D399] border border-gray-200 dark:border-slate-800',
    
    // Default
    default: 'bg-white dark:bg-[#0D1424] text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800',
    neutral: 'bg-white dark:bg-[#0D1424] text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800',
    purple: 'bg-white dark:bg-[#0D1424] text-[#6344F5] dark:text-[#A78BFA] border border-gray-200 dark:border-slate-800',
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