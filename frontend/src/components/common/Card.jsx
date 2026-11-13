import React from 'react';

export function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.03)] transition-colors ${
        hover ? 'duration-300 hover:shadow-[0_8px_24px_rgba(108,92,231,0.06)] hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-5 pb-3 border-b border-[#F4F5F9] dark:border-slate-800 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-sm font-semibold text-[#1E1B4B] dark:text-white flex items-center gap-2 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-slate-400 dark:text-slate-400 mt-0.5 ${className}`} {...props}>
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
    <div className={`p-4 bg-[#FAFBFE] dark:bg-[#0D1424] border-t border-[#F4F5F9] dark:border-slate-800 rounded-b-2xl flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}