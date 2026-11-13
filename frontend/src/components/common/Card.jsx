import React from 'react';

export function Card({ children, className = '', hover = true, glow = false, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-[#0F1018] border border-[#E5E5EA] dark:border-white/[0.07] rounded-[22px] shadow-[0_4px_20px_rgba(0,0,0,0.035)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all ${
        glow ? 'apple-card-glow' : ''
      } ${
        hover ? 'duration-300 hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.65)] hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/[0.14]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-5 pb-3 border-b border-[#E5E5EA] dark:border-white/[0.06] flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-4 bg-slate-50 dark:bg-[#0A0B12] border-t border-[#E5E5EA] dark:border-white/[0.06] rounded-b-[22px] flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}