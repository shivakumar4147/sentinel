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
    <div className="h-screen w-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex overflow-hidden transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F8FAFC] dark:bg-[#0C0F17] transition-colors">
        <Header setMobileOpen={setMobileOpen} />

        {/* Development Mock Telemetry Banner */}
        {isMockMode && (
          <div className="bg-slate-100/80 dark:bg-[#131824] border-b border-gray-200/80 dark:border-[#232D42] px-6 py-2 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between flex-shrink-0 transition-colors">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <span>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">Demo Sandbox:</strong>{' '}
                Simulated cloud telemetry & autonomous AI remediation engine.
              </span>
            </div>
            <Link
              to="/settings"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
            >
              Configure Live Backend <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Scrollable Body Container with scrollbar between navigation and body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden nav-body-scrollbar">
          <div className="nav-body-content min-w-0">
            <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto min-w-0 bg-[#F8FAFC] dark:bg-[#0C0F17] transition-colors">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}