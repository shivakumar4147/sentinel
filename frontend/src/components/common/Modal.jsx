import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Solid Dim Backdrop (No liquid glass) */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className={`w-full ${sizeClasses[size] || sizeClasses.md} transform overflow-hidden rounded-[22px] bg-white dark:bg-[#0F1018] border border-[#E5E5EA] dark:border-white/[0.08] p-6 text-left align-middle shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all relative animate-slide-up`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3.5 border-b border-[#E5E5EA] dark:border-white/[0.06]">
            <div>
              {title && <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>}
              {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="py-4 text-sm text-slate-700 dark:text-slate-300 max-h-[75vh] overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="pt-3.5 border-t border-[#E5E5EA] dark:border-white/[0.06] flex items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;
