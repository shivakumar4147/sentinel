import React, { useState } from 'react';
import { MoreHorizontal, ArrowRight, FileText, Server, Database, ShieldCheck, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SystemEfficiencyCard() {
  const [activeTab, setActiveTab] = useState('efficiency');

  // Core monitored services formatted exactly like the reference items
  const items = [
    {
      id: 'svc-1',
      name: 'Apple',
      serviceName: 'api-gateway',
      subtitle: 'Willum Bickham',
      tag: 'Ingress Envoy',
      amount: '+ $ 240',
      metric: '+ 18ms',
      time: '20:20',
      status: 'healthy',
    },
    {
      id: 'svc-2',
      name: 'Zoom',
      serviceName: 'auth-service',
      subtitle: 'Willum Bickham',
      tag: 'OIDC / JWT Pool',
      amount: '+ $ 240',
      metric: '+ 24ms',
      time: '20:20',
      status: 'healthy',
    },
    {
      id: 'svc-3',
      name: 'Woody Alen',
      serviceName: 'postgres-db',
      subtitle: 'Willum Bickham',
      tag: 'Primary Leader',
      amount: '+ $ 240',
      metric: '+ 142ms',
      time: '20:20',
      status: 'warning',
    },
    {
      id: 'svc-4',
      name: 'Owen Wilson',
      serviceName: 'payment-worker',
      subtitle: 'Willum Bickham',
      tag: 'Async BullMQ',
      amount: '+ $ 240',
      metric: '+ 32ms',
      time: '20:20',
      status: 'remediated',
    },
    {
      id: 'svc-5',
      name: 'Adam Driver',
      serviceName: 'redis-cache',
      subtitle: 'Willum Bickham',
      tag: 'L1/L2 Eviction Pool',
      amount: '+ $ 240',
      metric: '+ 2ms',
      time: '20:20',
      status: 'healthy',
    },
    {
      id: 'svc-6',
      name: 'Stanley Kubrick',
      serviceName: 'notification-svc',
      subtitle: 'Willum Bickham',
      tag: 'Webhooks Fleet',
      amount: '+ $ 240',
      metric: '+ 15ms',
      time: '20:20',
      status: 'healthy',
    },
    {
      id: 'svc-7',
      name: 'Adam Driver',
      serviceName: 'search-indexer',
      subtitle: 'Willum Bickham',
      tag: 'Vector Sync',
      amount: '+ $ 240',
      metric: '+ 28ms',
      time: '20:20',
      status: 'healthy',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0F1018] border border-[#E5E5EA] dark:border-white/[0.07] rounded-[22px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.035)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all flex flex-col justify-between h-full select-none">
      {/* Top Header: Title "Transactions" / System Efficiency + Options (...) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            Transactions
          </h3>
          <button
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* EIR Subheader link matching reference image */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-[#8E95A5] mb-2 font-mono">
          <span>EIR</span>
          <Link
            to="/services"
            className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors"
            title="View infrastructure services"
          >
            <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        {/* Semicircular Arc Gauge (Matching Reference Image) */}
        <div className="relative flex flex-col items-center justify-center pt-2 pb-5">
          {/* Atmospheric Lilac Radial Glow Bloom below the arc */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-44 h-24 bg-[#A78BFA] opacity-25 dark:opacity-30 blur-2xl rounded-full pointer-events-none" />

          {/* SVG Arc Gauge */}
          <svg className="w-52 h-28 overflow-visible" viewBox="0 0 200 110">
            <defs>
              <linearGradient id="arcLilacGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#C4B5FD" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>

            {/* Background Arc Track */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="currentColor"
              className="text-slate-100 dark:text-white/[0.06]"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Foreground Progress Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#arcLilacGradient)"
              strokeWidth="14"
              strokeDasharray="251.3"
              strokeDashoffset="138" // ~45% progress fill matching the reference 44.80%
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Inside Gauge Center Numbers */}
          <div className="absolute top-14 text-center">
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              44.80%
            </div>
            <div className="text-[11px] text-slate-400 dark:text-[#8E95A5] font-semibold tracking-wider">
              Efficiency
            </div>
          </div>
        </div>
      </div>

      {/* Date / Section Header: "4 June" */}
      <div className="mt-1">
        <div className="text-xs font-bold text-gray-800 dark:text-slate-200 mb-3">
          4 June
        </div>

        {/* List of items matching reference screenshot */}
        <div className="divide-y divide-[#E5E5EA] dark:divide-white/[0.04]">
          {items.map((item) => (
            <div
              key={item.id}
              className="py-2.5 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-white/[0.02] px-1 rounded-xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Squircle Document Icon Button */}
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#141522] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0 group-hover:border-[#A78BFA]/40 transition-colors">
                  <FileText className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-[#8B5CF6] dark:group-hover:text-[#C4B5FD] transition-colors">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {/* Right Side: Amount and Time */}
              <div className="text-right flex-shrink-0 font-mono">
                <div className="text-xs font-semibold text-gray-900 dark:text-slate-200">
                  {item.amount}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                  {item.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SystemEfficiencyCard;
