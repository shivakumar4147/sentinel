import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { MetricGauge } from '../common/MetricGauge';
import { Server, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ServiceHealthGrid({ services = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Server className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          Service Status Overview
        </CardTitle>
        <Link
          to="/services"
          className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
        >
          View All <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
        {services.map((service) => {
          const isCritical = service.status === 'critical' || service.health === 'critical';
          const isDegraded = service.status === 'degraded' || service.health === 'degraded';

          return (
            <div
              key={service.name || service.id}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-white text-xs font-mono truncate">
                        {service.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {service.type}
                    </div>
                  </div>
                  <Badge
                    variant={isCritical ? 'critical' : isDegraded ? 'degraded' : 'healthy'}
                    size="xs"
                  >
                    {service.status}
                  </Badge>
                </div>

                <div className="mt-3 space-y-2">
                  <MetricGauge
                    label="CPU"
                    value={service.cpu_usage || 0}
                    max={100}
                    unit="%"
                  />
                  <MetricGauge
                    label="Memory"
                    value={service.memory_usage || 0}
                    max={100}
                    unit="%"
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-mono">Err: {(service.error_rate || 0).toFixed(2)}%</span>
                <span className="truncate">{service.last_health_check || 'Checked recently'}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default ServiceHealthGrid;