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
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#A78BFA]/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97] cursor-pointer';

  const sizeClasses = {
    xs: 'text-xs px-2.5 py-1 gap-1.5',
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2',
  };

  const variantClasses = {
    primary: 'bg-[#1D1D1F] hover:bg-black dark:bg-[#C4B5FD] dark:hover:bg-[#D8B4FE] text-white dark:text-[#0A0B10] shadow-sm dark:shadow-[0_0_20px_rgba(196,181,253,0.3)]',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-[#141522] dark:hover:bg-[#1C1D2E] text-slate-800 dark:text-slate-200 border border-[#E5E5EA] dark:border-white/[0.08] shadow-2xs',
    danger: 'bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-sm shadow-rose-500/20 border border-rose-600/30',
    warning: 'bg-[#D97706] hover:bg-[#B45309] text-white shadow-sm border border-amber-600/30',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-[#141522] text-[#8B5CF6] dark:text-[#C4B5FD]',
    outline: 'bg-transparent border border-[#E5E5EA] dark:border-white/[0.1] hover:border-[#8B5CF6] dark:hover:border-[#C4B5FD] text-slate-800 dark:text-slate-200',
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