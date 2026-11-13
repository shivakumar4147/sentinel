import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Clock,
  ChevronDown,
  Sun,
  Moon,
  Check,
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';
import { useTheme } from '../context/ThemeContext';

export function Header({ setMobileOpen }) {
  const location = useLocation();
  const { isMockMode, toggleMockMode, incidents, timeRange, setTimeRange, refreshData } = useSentinel();
  const { isDark, toggleTheme } = useTheme();

  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const timeDropdownRef = useRef(null);

  const timeOptions = [
    { id: '24h', label: 'Last 24 Hours', detail: 'Real-time telemetry & alerts' },
    { id: '3d', label: 'Last 3 Days', detail: '72h multi-service trend' },
    { id: '1w', label: '1 Week', detail: 'Weekly reliability & MTTR' },
    { id: '1m', label: '1 Month', detail: 'Monthly SLO & uptime metrics' },
  ];

  // Close time dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target)) {
        setTimeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    <header className="h-16 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 bg-[#F8FAFC]/95 dark:bg-[#0C0F17]/95 backdrop-blur-md border-b border-gray-200/90 dark:border-[#232D42] transition-colors">
      {/* Left: Mobile toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#131824] border border-gray-200 dark:border-[#232D42] shadow-2xs cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Time range working dropdown */}
        <div className="relative" ref={timeDropdownRef}>
          <button
            onClick={() => setTimeDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#131824] border border-gray-200 dark:border-[#232D42] text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-[#1A2234] transition-all cursor-pointer"
            aria-haspopup="listbox"
            aria-expanded={timeDropdownOpen}
          >
            <Clock className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
            <span>{timeRange || 'Last 24 Hours'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                timeDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Time range options */}
          {timeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#131824] border border-gray-200 dark:border-[#232D42] rounded-xl shadow-xl py-1.5 z-50 animate-slide-up">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-gray-100 dark:border-[#1C2436]">
                Telemetry Time Window
              </div>
              <div className="p-1 space-y-0.5">
                {timeOptions.map((opt) => {
                  const isSelected = (timeRange || 'Last 24 Hours') === opt.label;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTimeRange(opt.label);
                        setTimeDropdownOpen(false);
                        refreshData(true);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A2234]'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{opt.detail}</div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA] flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mock/Live API toggle pill */}
        <button
          onClick={() => toggleMockMode(!isMockMode)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 bg-white dark:bg-[#131824] cursor-pointer ${
            isMockMode
              ? 'border-gray-200 dark:border-[#232D42] text-[#2563EB] dark:text-[#60A5FA] hover:bg-slate-50 dark:hover:bg-[#1A2234]'
              : 'border-gray-200 dark:border-[#232D42] text-[#059669] dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-[#1A2234]'
          }`}
          title="Toggle Mock Telemetry vs Live Backend API"
        >
          <span className="hidden sm:inline">
            {isMockMode ? 'Mock Telemetry' : 'Live API'}
          </span>
        </button>

        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#131824] border border-gray-200 dark:border-[#232D42] hover:bg-slate-50 dark:hover:bg-[#1A2234] transition-all shadow-2xs cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#131824] border border-gray-200 dark:border-[#232D42] hover:bg-slate-50 dark:hover:bg-[#1A2234] transition-all relative cursor-pointer"
            title="Active Incidents"
          >
            <Bell className="w-3.5 h-3.5" />
            {activeIncidents.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E11D48] rounded-full ring-2 ring-white dark:ring-[#131824]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#131824] border border-gray-200 dark:border-[#232D42] rounded-xl shadow-xl py-2 z-50 animate-slide-up">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-[#1C2436] flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                <span>Active Incident Alerts</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-normal">
                  {activeIncidents.length} Pending
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-[#1C2436]">
                {activeIncidents.map((inc) => (
                  <div key={inc.incident_id} className="p-3 hover:bg-slate-50 dark:hover:bg-[#1A2234] transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{inc.incident_id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          inc.severity === 'critical'
                            ? 'text-[#E11D48] dark:text-rose-400 bg-white dark:bg-[#0C0F17] border-gray-200 dark:border-[#232D42]'
                            : 'text-[#D97706] dark:text-amber-400 bg-white dark:bg-[#0C0F17] border-gray-200 dark:border-[#232D42]'
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