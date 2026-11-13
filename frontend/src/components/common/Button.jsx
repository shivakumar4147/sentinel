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
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#2563EB]/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const sizeClasses = {
    xs: 'text-xs px-2.5 py-1 gap-1.5',
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2',
  };

  const variantClasses = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm shadow-blue-500/20 border border-blue-600/30',
    secondary: 'bg-white dark:bg-[#131824] hover:bg-slate-50 dark:hover:bg-[#1A2234] text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-[#232D42] shadow-2xs',
    danger: 'bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-sm shadow-rose-500/20 border border-rose-600/30',
    warning: 'bg-[#D97706] hover:bg-[#B45309] text-white shadow-sm border border-amber-600/30',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-[#1A2234] text-[#2563EB] dark:text-[#60A5FA]',
    outline: 'bg-white dark:bg-[#131824] border border-gray-200 dark:border-[#232D42] hover:border-[#2563EB] dark:hover:border-[#60A5FA] text-[#2563EB] dark:text-[#60A5FA]',
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