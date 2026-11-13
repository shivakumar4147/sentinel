import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSentinel } from '../context/SentinelContext';
import { ArrowRight, Info } from 'lucide-react';

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isMockMode } = useSentinel();

  return (
    <div className="h-screen w-screen bg-white dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex overflow-hidden transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white dark:bg-[#090D16] transition-colors">
        <Header setMobileOpen={setMobileOpen} />

        {/* Development Mock Telemetry Banner */}
        {isMockMode && (
          <div className="bg-[#EEF0F6] dark:bg-[#0D1424] border-b border-gray-200 dark:border-slate-800 px-4 py-1.5 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between flex-shrink-0 transition-colors">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <span>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">Demo Environment:</strong>{' '}
                Viewing simulated cloud telemetry and AI root causes.
              </span>
            </div>
            <Link
              to="/settings"
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-900 dark:text-slate-200 hover:underline"
            >
              Configure Live Backend <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Scrollable Body Container with scrollbar between navigation and body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden nav-body-scrollbar">
          <div className="nav-body-content min-w-0">
            <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto min-w-0 bg-white dark:bg-[#090D16] transition-colors">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}