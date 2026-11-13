import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  AlertTriangle,
  FileSearch,
  CheckSquare,
  Wrench,
  FileText,
  Settings,
  Shield,
  Search,
  MoreVertical,
  Globe,
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { incidents, remediations } = useSentinel();
  const [sidebarSearch, setSidebarSearch] = useState('');

  const activeIncidentsCount = incidents.filter(
    (i) => i.status !== 'resolved'
  ).length;

  const pendingApprovalsCount = remediations.filter(
    (r) => r.status === 'awaiting_approval' || r.status === 'pending_approval'
  ).length;

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/services',
      label: 'Services',
      icon: Server,
      badge: null,
    },
    {
      to: '/incidents',
      label: 'Incidents',
      icon: AlertTriangle,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : null,
      badgeColor: 'bg-white dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-[#E11D48] dark:text-rose-400',
    },
    {
      to: '/investigation',
      label: 'AI Investigation',
      icon: FileSearch,
      badge: null,
    },
    {
      to: '/live-target',
      label: 'Live Storefront',
      icon: Globe,
      badge: 'Live',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-bold',
    },
    {
      to: '/approvals',
      label: 'Approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      badgeColor: 'bg-white dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-[#D97706] dark:text-amber-400',
    },
    {
      to: '/remediation',
      label: 'Remediation',
      icon: Wrench,
      badge: null,
    },
    {
      to: '/audit-logs',
      label: 'Audit Logs',
      icon: FileText,
      badge: null,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] border-r border-gray-200/90 dark:border-[#232D42] flex flex-col justify-between flex-shrink-0 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Logo Header */}
          <div className="h-16 px-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white shadow-sm shadow-blue-500/25">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-base tracking-tight">
                Sentinel
              </div>
            </div>
          </div>

          {/* Search bar in sidebar */}
          <div className="px-4 mb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#131824] border border-gray-200 dark:border-[#232D42] rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#2563EB] transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 py-2 px-3 space-y-1.5 overflow-y-auto">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white dark:bg-[#161D2B] text-[#2563EB] dark:text-[#60A5FA] font-semibold shadow-2xs border border-gray-200/90 dark:border-[#232D42]'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-[#131824]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 transition-colors ${
                            isActive ? 'text-[#2563EB] dark:text-[#60A5FA]' : 'text-slate-400 dark:text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold flex-shrink-0 ${
                            item.badgeColor || 'bg-slate-100 dark:bg-[#131824] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom Profile Card */}
        <div className="p-3 border-t border-gray-200/90 dark:border-[#232D42]">
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#131824] border border-gray-200/90 dark:border-[#232D42] shadow-2xs hover:bg-slate-50 dark:hover:bg-[#1A2234] transition-colors flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-xs font-bold text-white shadow-2xs flex-shrink-0">
                DS
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">Darrell Steward</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate">oncall@sentinel.internal</div>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}