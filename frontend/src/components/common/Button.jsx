import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#6C5CE7]/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeClasses = {
    xs: 'text-xs px-2.5 py-1 gap-1.5',
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2',
  };

  const variantClasses = {
    primary: 'bg-[#6C5CE7] hover:bg-[#5B4EDB] text-white shadow-sm shadow-[#6C5CE7]/20',
    secondary: 'bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-[#EEF0F6] dark:border-slate-800 shadow-sm',
    danger: 'bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-sm shadow-rose-500/20',
    warning: 'bg-[#D97706] hover:bg-[#B45309] text-white shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-[#6344F5] dark:text-[#A78BFA]',
    outline: 'bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 hover:border-[#6344F5] dark:hover:border-[#A78BFA] text-[#6344F5] dark:text-[#A78BFA]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
}

export default Button;