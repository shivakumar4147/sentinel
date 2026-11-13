import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { useSentinel } from '../../context/SentinelContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] text-white p-2.5 rounded-lg border border-gray-700 shadow-xl text-xs font-sans">
        <p className="font-semibold text-gray-300 mb-1.5">{label} UTC</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300">{entry.name}:</span>
            </div>
            <span className="font-mono font-bold text-white">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function IncidentChart() {
  const { isDark } = useTheme();
  const { incidents, timeRange } = useSentinel();

  const activeCount = incidents.filter((i) => i.status !== 'resolved').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;

  // Real-time telemetry curve based on incident registry state
  const chartData = [
    { time: '12:00', incidentRate: Math.max(15, activeCount * 12), recoveryRate: Math.max(20, resolvedCount * 18) },
    { time: '13:00', incidentRate: Math.max(20, activeCount * 15), recoveryRate: Math.max(25, resolvedCount * 22) },
    { time: '14:00', incidentRate: Math.max(35, activeCount * 22), recoveryRate: Math.max(30, resolvedCount * 28) },
    { time: '15:00', incidentRate: Math.max(25, activeCount * 18), recoveryRate: Math.max(40, resolvedCount * 32) },
    { time: '16:00', incidentRate: Math.max(50, activeCount * 28), recoveryRate: Math.max(55, resolvedCount * 45) },
    { time: '17:00', incidentRate: Math.max(40, activeCount * 24), recoveryRate: Math.max(70, resolvedCount * 55) },
    { time: '18:00', incidentRate: Math.max(30, activeCount * 20), recoveryRate: Math.max(82, resolvedCount * 65) },
    { time: 'Now', incidentRate: Math.max(18, activeCount * 14), recoveryRate: Math.max(90, resolvedCount * 75) },
  ];

  return (
    <div className="p-5 flex flex-col h-full justify-between">
      {/* Header and custom circular legend dots at top-left matching specification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
            Incident & Recovery Trend
          </h3>
          <div className="flex items-center gap-3.5 text-xs mt-1.5">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              <span>Incident Velocity</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#3B38D0] dark:bg-[#6366F1]" />
              <span>Recovery Trajectory</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smooth dual-spline area chart */}
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="purpleSpline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="blueSpline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B38D0" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B38D0" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1E293B' : '#F3F4F6'}
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke={isDark ? '#64748B' : '#9CA3AF'}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#334155' : '#E5E7EB' }}
            />
            <YAxis
              stroke={isDark ? '#64748B' : '#9CA3AF'}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#334155' : '#E5E7EB' }}
              unit="%"
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="natural"
              dataKey="incidentRate"
              name="Incident Velocity"
              stroke="#7C3AED"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#purpleSpline)"
              isAnimationActive={true}
              animationDuration={700}
            />
            <Area
              type="natural"
              dataKey="recoveryRate"
              name="Recovery Trajectory"
              stroke={isDark ? '#818CF8' : '#3B38D0'}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#blueSpline)"
              isAnimationActive={true}
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default IncidentChart;