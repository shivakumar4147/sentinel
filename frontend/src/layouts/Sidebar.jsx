import React from 'react';
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
  Layers,
  LogOut,
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { incidents, remediations } = useSentinel();

  const activeIncidentsCount = incidents.filter(
    (i) => i.status !== 'resolved'
  ).length;

  const pendingApprovalsCount = remediations.filter(
    (r) => r.status === 'awaiting_approval' || r.status === 'pending_approval' || r.status === 'changes_suggested'
  ).length;

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/incidents',
      label: 'Incidents',
      icon: AlertTriangle,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : null,
      badgeColor: 'bg-[#E11D48] text-white',
    },
    {
      to: '/investigation',
      label: 'AI Investigation',
      icon: FileSearch,
      badge: null,
    },
    {
      to: '/approvals',
      label: 'Approvals Queue',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      badgeColor: 'bg-[#8B5CF6] text-white',
    },
    {
      to: '/remediation',
      label: 'Remediation Engine',
      icon: Wrench,
      badge: null,
    },
    {
      to: '/services',
      label: 'Services Infrastructure',
      icon: Server,
      badge: null,
    },
    {
      to: '/audit-logs',
      label: 'Audit & Compliance',
      icon: FileText,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Apple-style Vertical Squircle Dock (Matching Reference Image) */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-20 h-screen bg-white dark:bg-[#07080D] border-r border-[#E5E5EA] dark:border-white/[0.07] flex flex-col items-center justify-between py-5 flex-shrink-0 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Squircle Logo */}
        <div className="flex flex-col items-center gap-6 w-full">
          <NavLink
            to="/"
            className="w-12 h-12 rounded-[18px] bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center text-gray-900 dark:text-white shadow-soft transition-transform active:scale-95 group relative"
            title="Sentinel Platform"
          >
            <Shield className="w-5 h-5 text-gray-900 dark:text-white group-hover:scale-105 transition-transform" />
            <span className="pointer-events-none absolute left-16 z-50 px-3 py-1.5 rounded-xl bg-gray-950 text-white text-xs font-semibold shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
              Sentinel Core
            </span>
          </NavLink>

          {/* Navigation Squircles (Middle) */}
          <nav className="flex flex-col items-center gap-3 w-full px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-200 relative group cursor-pointer ${
                      isActive
                        ? 'bg-[#1D1D1F] dark:bg-[#D8B4FE] text-white dark:text-[#0A0B10] shadow-md dark:shadow-[0_0_20px_rgba(216,180,254,0.35)] scale-100'
                        : 'text-slate-400 dark:text-[#8E95A5] hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="w-5 h-5 flex-shrink-0" />

                      {/* Badge indicator on top-right of squircle */}
                      {item.badge && (
                        <span
                          className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#07080D] shadow-sm ${
                            item.badgeColor || 'bg-[#E11D48] text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Apple-style floating tooltip */}
                      <span className="pointer-events-none absolute left-16 z-50 px-3 py-1.5 rounded-xl bg-gray-950 text-white text-xs font-semibold shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Settings & Logout Squircles (Matching Reference Image Dock) */}
        <div className="flex flex-col items-center gap-3 w-full px-3 pt-3 border-t border-[#E5E5EA] dark:border-white/[0.07]">
          {/* Settings NavLink */}
          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `w-12 h-12 rounded-[18px] flex items-center justify-center transition-all relative group cursor-pointer ${
                isActive
                  ? 'bg-[#1D1D1F] dark:bg-[#D8B4FE] text-white dark:text-[#0A0B10] shadow-md dark:shadow-[0_0_20px_rgba(216,180,254,0.35)]'
                  : 'text-slate-400 dark:text-[#8E95A5] hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            <span className="pointer-events-none absolute left-16 z-50 px-3 py-1.5 rounded-xl bg-gray-950 text-white text-xs font-semibold shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
              Platform Settings
            </span>
          </NavLink>

          {/* Logout Squircle Action Button */}
          <button
            onClick={() => {
              if (window.confirm('Disconnect session from Sentinel Core?')) {
                window.location.reload();
              }
            }}
            className="w-12 h-12 rounded-[18px] flex items-center justify-center text-slate-400 dark:text-[#8E95A5] hover:text-[#E11D48] dark:hover:text-[#FF6363] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all relative group cursor-pointer"
            title="Disconnect session"
          >
            <LogOut className="w-5 h-5" />
            <span className="pointer-events-none absolute left-16 z-50 px-3 py-1.5 rounded-xl bg-gray-950 text-white text-xs font-semibold shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
              Logout Session
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}