import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export function ClusterTelemetryRow() {
  const { isDark } = useTheme();
  const [activeCardId, setActiveCardId] = useState('db-pool');
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const cards = [
    {
      id: 'db-pool',
      title: 'DB Pool Saturation',
      value: '99.4%',
      subtitle: '198 / 200 slots in use',
      bars: [30, 45, 60, 50, 75, 88, 100, 95, 99],
      timestamps: ['15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30'],
    },
    {
      id: 'worker-heap',
      title: 'Worker Heap Memory',
      value: '82%',
      subtitle: '840 MB of 1024 MB',
      bars: [25, 30, 40, 48, 55, 68, 74, 80, 82],
      timestamps: ['15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30'],
    },
    {
      id: 'gateway-err',
      title: 'Gateway Error Rate',
      value: '14.8%',
      subtitle: 'Elevated 504 timeouts',
      bars: [5, 8, 12, 10, 20, 35, 50, 70, 65],
      timestamps: ['15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30'],
    },
    {
      id: 'auth-resp',
      title: 'Auth Response Time',
      value: '1.4ms',
      subtitle: 'P99 SLA nominal',
      bars: [15, 14, 16, 15, 14, 15, 14, 14, 14],
      timestamps: ['15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30'],
    },
  ];

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white tracking-tight">
          Cluster Health & Anomaly Rates
        </h2>
        <Link
          to="/investigation?id=INC-8492"
          className="text-xs font-bold text-[#6344F5] dark:text-[#A78BFA] hover:opacity-80 tracking-wider uppercase transition-opacity"
        >
          INSPECT DIAGNOSTICS
        </Link>
      </div>

      {/* 4-column bordered container */}
      <div className="bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-slate-800 transition-colors">
        {cards.map((item) => {
          const isCardHovered = hoveredCardId === item.id;
          const isCardActive = activeCardId === item.id;
          const isHighlighted = isCardHovered || (hoveredCardId === null && isCardActive);

          return (
            <div
              key={item.id}
              onClick={() => setActiveCardId(item.id)}
              onMouseEnter={() => setHoveredCardId(item.id)}
              onMouseLeave={() => {
                setHoveredCardId(null);
                setHoveredBar(null);
              }}
              className="p-5 flex flex-col justify-between cursor-pointer relative bg-white dark:bg-[#111726] hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors duration-150 group select-none"
            >
              <div>
                {/* Title & Info Icon */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-700 dark:text-slate-300">
                    {item.title}
                  </span>
                  <div className="text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors" title={item.subtitle}>
                    <Info className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Big Bold Number */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {item.value}
                  </span>
                </div>

                {/* Subtitle */}
                <div className="text-xs text-gray-400 dark:text-slate-400 font-medium mt-1">
                  {item.subtitle}
                </div>
              </div>

              {/* 9-Bar Micro-Sparkline */}
              <div className="mt-6 relative">
                {/* Floating Tooltip on bar hover */}
                {hoveredBar && hoveredBar.cardId === item.id && (
                  <div
                    className="absolute -top-7 transform -translate-x-1/2 bg-[#111827] text-white text-[10px] font-mono font-semibold py-0.5 px-2 rounded shadow-md pointer-events-none z-20 whitespace-nowrap"
                    style={{
                      left: `${((hoveredBar.barIdx + 0.5) / item.bars.length) * 100}%`,
                    }}
                  >
                    {hoveredBar.time}: {hoveredBar.value}%
                  </div>
                )}

                <div className="flex items-end gap-1.5 h-12 pt-2">
                  {item.bars.map((height, bIdx) => {
                    const isThisBarHovered =
                      hoveredBar?.cardId === item.id && hoveredBar?.barIdx === bIdx;

                    let barColor = isDark ? '#1E293B' : '#E5E7EB';
                    if (isHighlighted) {
                      barColor = isThisBarHovered
                        ? (isDark ? '#818CF8' : '#4329C7')
                        : (isDark ? '#6344F5' : '#6344F5');
                    }

                    return (
                      <div
                        key={bIdx}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          setHoveredBar({
                            cardId: item.id,
                            barIdx: bIdx,
                            value: height,
                            time: item.timestamps[bIdx] || `Point ${bIdx + 1}`,
                          });
                        }}
                        onMouseLeave={() => setHoveredBar(null)}
                        className="flex-1 rounded-t-xs transition-all duration-150 ease-out origin-bottom cursor-pointer relative"
                        style={{
                          height: `${Math.max(12, height)}%`,
                          backgroundColor: barColor,
                          transform: isThisBarHovered ? 'scaleY(1.15) translateY(-2px)' : 'none',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ClusterTelemetryRow;