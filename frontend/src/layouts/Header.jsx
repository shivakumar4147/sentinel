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
    <header className="h-16 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 bg-[#F5F5F7] dark:bg-[#07080D] border-b border-[#E5E5EA] dark:border-white/[0.07] transition-colors">
      {/* Left: Mobile toggle, Search input & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#141522] border border-[#E5E5EA] dark:border-white/[0.08] shadow-2xs cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Apple-style Pill Search Input (Matches Reference Image) */}
        <div className="relative hidden md:block">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Type to search..."
            className="w-48 lg:w-60 pl-9 pr-3.5 py-1.5 rounded-xl bg-white dark:bg-[#141522] border border-[#E5E5EA] dark:border-white/[0.08] text-xs text-gray-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#A78BFA] transition-all"
          />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">
          {title}
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Working Time Range Dropdown (Apple Pill Filter Button) */}
        <div className="relative" ref={timeDropdownRef}>
          <button
            onClick={() => setTimeDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#141522] border border-[#E5E5EA] dark:border-white/[0.08] text-xs font-semibold text-gray-800 dark:text-[#E2E8F0] shadow-2xs hover:bg-slate-50 dark:hover:bg-[#1B1C2E] transition-all cursor-pointer"
            aria-haspopup="listbox"
            aria-expanded={timeDropdownOpen}
          >
            <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>{timeRange || 'Last 24 Hours'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                timeDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Time range options */}
          {timeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#141522] border border-[#E5E5EA] dark:border-white/[0.08] rounded-2xl shadow-apple-card py-2 z-50 animate-slide-up">
              <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-[#E5E5EA] dark:border-white/[0.06]">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#C4B5FD] font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{opt.detail}</div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#C4B5FD] flex-shrink-0" />}
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
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 bg-white dark:bg-[#141522] cursor-pointer ${
            isMockMode
              ? 'border-[#E5E5EA] dark:border-white/[0.08] text-[#8B5CF6] dark:text-[#C4B5FD] hover:bg-slate-50 dark:hover:bg-[#1B1C2E]'
              : 'border-[#E5E5EA] dark:border-white/[0.08] text-[#059669] dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-[#1B1C2E]'
          }`}
          title="Toggle Mock Telemetry vs Live Backend API"
        >
          <span className="hidden sm:inline">
            {isMockMode ? 'Mock Telemetry' : 'Live API'}
          </span>
        </button>

        {/* Dark / Light Mode Toggle Button (Squircle) */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl text-slate-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#141522] border border-[#E5E5EA] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#1B1C2E] transition-all flex items-center justify-center shadow-2xs cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Notifications (Squircle) */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="w-9 h-9 rounded-xl text-slate-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#141522] border border-[#E5E5EA] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#1B1C2E] transition-all flex items-center justify-center relative cursor-pointer"
            title="Active Incidents"
          >
            <Bell className="w-4 h-4" />
            {activeIncidents.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E11D48] rounded-full ring-2 ring-white dark:ring-[#141522]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#141522] border border-[#E5E5EA] dark:border-white/[0.08] rounded-2xl shadow-apple-card py-2 z-50 animate-slide-up">
              <div className="px-4 py-2 border-b border-[#E5E5EA] dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                <span>Active Incident Alerts</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-normal">
                  {activeIncidents.length} Pending
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#E5E5EA] dark:divide-white/[0.04]">
                {activeIncidents.map((inc) => (
                  <div key={inc.incident_id} className="p-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{inc.incident_id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          inc.severity === 'critical'
                            ? 'text-[#E11D48] dark:text-rose-400 bg-white dark:bg-[#07080D] border-gray-200 dark:border-white/[0.08]'
                            : 'text-[#D97706] dark:text-amber-400 bg-white dark:bg-[#07080D] border-gray-200 dark:border-white/[0.08]'
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

        {/* User Profile Capsule (Matching the "Holland / Manager" pill in Reference Image) */}
        <div className="hidden sm:flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white dark:bg-[#141522] border border-[#E5E5EA] dark:border-white/[0.08] shadow-2xs select-none">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#C4B5FD] flex items-center justify-center text-[11px] font-bold text-[#0A0B10]">
            DS
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-bold text-gray-900 dark:text-white">Darrell Steward</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8E95A5]">Manager</div>
          </div>
        </div>
      </div>
    </header>
  );
}