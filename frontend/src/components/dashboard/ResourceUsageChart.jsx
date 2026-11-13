import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
        <p className="font-semibold text-gray-200 mb-1.5">{label}</p>
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

export function ResourceUsageChart() {
  const { isDark } = useTheme();
  const { services } = useSentinel();

  const data = (services || []).map((s) => ({
    category: s.name,
    throughput: Math.round(s.cpu_usage || 0),
    memory: Math.round(s.memory_usage || 0),
  }));

  return (
    <div className="p-5 flex flex-col h-full justify-between">
      {/* Header and custom circular legend dots at top matching specification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
            Performance By Service Type
          </h3>
          <div className="flex items-center gap-3.5 text-xs mt-1.5">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#3B38D0] dark:bg-[#6366F1]" />
              <span>Throughput Load</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#D8E0F8] dark:bg-[#334155]" />
              <span>Memory Utilization</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grouped vertical bar chart */}
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1E293B' : '#F3F4F6'}
              vertical={false}
            />
            <XAxis
              dataKey="category"
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
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="throughput"
              name="Throughput Load"
              fill={isDark ? '#6366F1' : '#3B38D0'}
              radius={[3, 3, 0, 0]}
              barSize={16}
              isAnimationActive={true}
              animationDuration={700}
            />
            <Bar
              dataKey="memory"
              name="Memory Utilization"
              fill={isDark ? '#334155' : '#D8E0F8'}
              radius={[3, 3, 0, 0]}
              barSize={16}
              isAnimationActive={true}
              animationDuration={700}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ResourceUsageChart;