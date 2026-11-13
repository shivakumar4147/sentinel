import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  RefreshCw,
  Clock,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';
import { useTheme } from '../context/ThemeContext';

export function Header({ setMobileOpen }) {
  const location = useLocation();
  const { loading, refreshData, isMockMode, toggleMockMode, incidents } = useSentinel();
  const { isDark, toggleTheme } = useTheme();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRange, setTimeRange] = useState('Last 24 Hours');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'Incident Analytics';
      case '/services':
        return 'Service Infrastructure';
      case '/incidents':
        return 'Incident Registry';
      case '/investigation':
        return 'AI Root-Cause Investigation';
      case '/approvals':
        return 'Safety Approvals Queue';
      case '/remediation':
        return 'Remediation Engine';
      case '/audit-logs':
        return 'Audit & Compliance Logs';
      case '/settings':
        return 'Platform Settings';
      default:
        return 'Sentinel Dashboard';
    }
  };

  const title = getPageTitle(location.pathname);
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');

  return (
    <header className="h-16 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 bg-[#F6F7FB]/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-colors">
      {/* Left: Mobile toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 shadow-2xs"
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        <h1 className="text-xl font-bold text-[#1E1B4B] dark:text-white tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Time range dropdown pill */}
        <div className="relative">
          <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Mock/Live API toggle pill */}
        <button
          onClick={() => toggleMockMode(!isMockMode)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 bg-white dark:bg-[#111726] ${
            isMockMode
              ? 'border-gray-200 dark:border-slate-800 text-[#6344F5] dark:text-[#A78BFA] hover:bg-gray-50 dark:hover:bg-slate-800'
              : 'border-gray-200 dark:border-slate-800 text-[#059669] dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}
          title="Toggle Mock Telemetry vs Live Backend API"
        >
          <span className="hidden sm:inline">
            {isMockMode ? 'Mock Data' : 'Live API'}
          </span>
        </button>

        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-2xs"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>

        {/* Telemetry Refresh */}
        <button
          onClick={() => refreshData()}
          disabled={loading}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          title="Refresh Telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#6344F5] dark:text-[#A78BFA]' : ''}`} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all relative"
            title="Active Incidents"
          >
            <Bell className="w-3.5 h-3.5" />
            {activeIncidents.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E11D48] rounded-full ring-2 ring-white dark:ring-[#111726]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                <span>Active Incident Alerts</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-normal">
                  {activeIncidents.length} Pending
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                {activeIncidents.map((inc) => (
                  <div key={inc.incident_id} className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{inc.incident_id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          inc.severity === 'critical'
                            ? 'text-[#E11D48] dark:text-rose-400 bg-white dark:bg-[#0D1424] border-gray-200 dark:border-slate-800'
                            : 'text-[#D97706] dark:text-amber-400 bg-white dark:bg-[#0D1424] border-gray-200 dark:border-slate-800'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">{inc.title}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex justify-between font-mono">
                      <span>{inc.service}</span>
                      <span>{inc.duration} ago</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}