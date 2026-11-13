import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Filter, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSentinel } from '../../context/SentinelContext';

export function TasksOverviewChart() {
  const { isDark } = useTheme();
  const { timeRange } = useSentinel();
  const [filterActive, setFilterActive] = useState(false);

  // 12 data points matching the Jan - Dec reference image layout
  const rawData = [
    { name: 'Jan', value: 16000, secondary: 20000, bars: 14000 },
    { name: 'Feb', value: 18500, secondary: 21000, bars: 17000 },
    { name: 'Mar', value: 24500, secondary: 23000, bars: 22000 },
    { name: 'Apr', value: 13000, secondary: 17000, bars: 12000 },
    { name: 'May', value: 15500, secondary: 19500, bars: 14000 },
    { name: 'June', value: 21000, secondary: 18000, bars: 19000, isPin: true },
    { name: 'July', value: 15000, secondary: 20500, bars: 13500 },
    { name: 'Aug', value: 20000, secondary: 22000, bars: 18500 },
    { name: 'Sept', value: 21500, secondary: 19000, bars: 20000 },
    { name: 'Oct', value: 31000, secondary: 29000, bars: 28000 },
    { name: 'Nov', value: 24000, secondary: 22000, bars: 22500 },
    { name: 'Dec', value: 26000, secondary: 25000, bars: 24000 },
  ];

  return (
    <div className="bg-white dark:bg-[#0F1018] border border-[#E5E5EA] dark:border-white/[0.07] rounded-[22px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.035)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all">
      {/* Top Header: Title & Filter Pill Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
          Tasks Overview
        </h2>

        <button
          onClick={() => setFilterActive(!filterActive)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            filterActive
              ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#0A0B10] border-transparent shadow-xs'
              : 'bg-white dark:bg-[#141522] text-slate-700 dark:text-[#D1D5DB] border-[#E5E5EA] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#1A1B2C]'
          }`}
        >
          <span>Filter</span>
          <Filter className="w-3 h-3 text-slate-400 dark:text-[#A78BFA]" />
        </button>
      </div>

      {/* Main Dual-Spline & Needle Bar Chart with Vertical Pin */}
      <div className="w-full h-64 sm:h-72 relative select-none">
        {/* Floating Indicator Tooltip at 'June' matching reference image (2 June / 12:30) */}
        <div
          className="absolute top-6 left-[46%] -translate-x-1/2 z-20 hidden sm:flex flex-col items-center pointer-events-none transition-transform"
          style={{ transform: 'translateX(-50%)' }}
        >
          <div className="bg-[#12131C] text-white border border-white/10 px-2.5 py-1 rounded-lg text-center shadow-lg text-[10px] leading-tight">
            <div className="font-semibold text-slate-200">2 June</div>
            <div className="text-slate-400 text-[9px] font-mono">12:30</div>
          </div>
          {/* Subtle downward stem indicator */}
          <div className="w-px h-6 bg-gradient-to-b from-[#A78BFA] to-transparent" />
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rawData}
            margin={{ top: 25, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {/* Lilac wave gradient */}
              <linearGradient id="lilacWaveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C4B5FD" stopOpacity={0.28} />
                <stop offset="60%" stopColor="#A78BFA" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.0} />
              </linearGradient>

              {/* Bar drop stem gradient */}
              <linearGradient id="stemBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C4B5FD" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#C4B5FD" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* Subtle horizontal dashed grid lines */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? 'rgba(255, 255, 255, 0.04)' : '#F0F0F3'}
              vertical={false}
            />

            {/* X-Axis */}
            <XAxis
              dataKey="name"
              stroke={isDark ? '#64748B' : '#9CA3AF'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={6}
            />

            {/* Y-Axis */}
            <YAxis
              stroke={isDark ? '#64748B' : '#9CA3AF'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 40000]}
              ticks={[0, 10000, 20000, 30000, 40000]}
              tickFormatter={(v) => (v === 0 ? '0K' : `${v / 1000}K`)}
              dx={-4}
            />

            {/* Custom interactive tooltip */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#12131C] text-white p-2.5 rounded-xl border border-white/10 shadow-xl text-xs font-sans">
                      <p className="font-semibold text-slate-300 mb-1">{label} Telemetry</p>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-3 text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#D8B4FE]" />
                            Volume:
                          </span>
                          <span className="font-mono font-bold text-white">
                            {payload[0]?.value?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Vertical needle drop lines / lollipop stems (matching reference screenshot) */}
            <Bar
              dataKey="bars"
              fill="url(#stemBarGrad)"
              barSize={1.5}
              isAnimationActive={true}
            />

            {/* Secondary dashed wave */}
            <Line
              type="natural"
              dataKey="secondary"
              stroke={isDark ? 'rgba(216, 180, 254, 0.35)' : 'rgba(139, 92, 246, 0.4)'}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={true}
            />

            {/* Main Glowing Spline Wave Curve */}
            <Area
              type="natural"
              dataKey="value"
              stroke="#D8B4FE"
              strokeWidth={2.5}
              fill="url(#lilacWaveGrad)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#FFFFFF',
                stroke: '#A78BFA',
                strokeWidth: 3,
              }}
            />

            {/* Vertical stem reference line at 'June' */}
            <ReferenceLine
              x="June"
              stroke="#A78BFA"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TasksOverviewChart;
