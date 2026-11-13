import React, { useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { MetricGauge } from '../components/common/MetricGauge';
import { Modal } from '../components/common/Modal';
import {
  Search,
  RefreshCw,
  Clock,
} from 'lucide-react';

export function ServicesPage() {
  const { services, loading, refreshData } = useSentinel();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedService, setSelectedService] = useState(null);

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.displayName && service.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.container_name && service.container_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.type && service.type.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'HEALTHY' && service.health === 'healthy') ||
      (statusFilter === 'DEGRADED' && (service.health === 'degraded' || service.health === 'warning')) ||
      (statusFilter === 'CRITICAL' && service.status === 'critical');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search services, containers, or types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#6C5CE7] transition-all shadow-soft"
          />
        </div>

        {/* Status Filter Buttons & Refresh */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'HEALTHY', 'DEGRADED', 'CRITICAL'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === filter
                  ? 'bg-[#6344F5] text-white shadow-sm'
                  : 'bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
          <Button
            variant="secondary"
            size="xs"
            icon={RefreshCw}
            loading={loading}
            onClick={() => refreshData()}
            className="ml-auto sm:ml-1"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => {
          const isCritical = service.status === 'critical' || service.health === 'critical';
          const isDegraded = service.status === 'degraded' || service.health === 'degraded' || service.health === 'warning';

          return (
            <Card
              key={service.name || service.id}
              className="p-5 flex flex-col justify-between"
              hover={true}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white font-mono truncate">
                        {service.displayName || service.name}
                      </h3>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 truncate">
                      <span>{service.type}</span>
                      <span className="font-mono text-slate-400">{service.version || 'v1.0.0'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge
                      variant={isCritical ? 'critical' : isDegraded ? 'degraded' : 'healthy'}
                      size="xs"
                    >
                      {service.status}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-400">
                      {service.replicas || '1/1 active'}
                    </span>
                  </div>
                </div>

                {/* Container info */}
                <div className="mt-4 p-2.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-700 dark:text-slate-300 truncate">{service.container_name || service.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] flex-shrink-0 pl-2">
                    Err: <strong className={service.error_rate > 5 ? 'text-[#E11D48] dark:text-rose-400' : 'text-[#059669] dark:text-emerald-400'}>
                      {(service.error_rate || 0).toFixed(2)}%
                    </strong>
                  </span>
                </div>

                {/* Resource Metrics Gauges */}
                <div className="mt-4 space-y-2.5">
                  <MetricGauge
                    label="CPU Load"
                    value={service.cpu_usage || 0}
                    max={100}
                    unit="%"
                  />
                  <MetricGauge
                    label="Memory Usage"
                    value={service.memory_usage || 0}
                    max={100}
                    unit="%"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-3 border-t border-[#F4F5F9] dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1 truncate text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">Last check: {service.last_health_check || 'Live'}</span>
                </div>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => setSelectedService(service)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 text-xs text-slate-400">
          No services match your search or filter.
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <Modal
          isOpen={!!selectedService}
          onClose={() => setSelectedService(null)}
          title={selectedService.displayName || selectedService.name}
          description={`Container: ${selectedService.container_name}`}
          size="lg"
          footer={
            <Button variant="secondary" size="xs" onClick={() => setSelectedService(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
                <div className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Status</div>
                <div className={`font-mono text-xs font-bold capitalize mt-0.5 ${
                  selectedService.status === 'critical' ? 'text-[#E11D48] dark:text-rose-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {selectedService.status}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
                <div className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Health</div>
                <div className="font-mono text-xs font-bold text-[#059669] dark:text-emerald-400 capitalize mt-0.5">
                  {selectedService.health}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
                <div className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Error Rate</div>
                <div className="font-mono text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                  {(selectedService.error_rate || 0).toFixed(2)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
                <div className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Uptime</div>
                <div className="font-mono text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                  {Math.floor((selectedService.uptime_seconds || 86400) / 3600)} hrs
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="font-bold text-gray-900 dark:text-white text-xs">Runtime Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1 min-w-0">
                  <div className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Endpoint</div>
                  <div className="font-mono text-gray-900 dark:text-slate-100 break-all text-xs bg-white dark:bg-[#151D30] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 select-all">
                    {selectedService.endpoint || 'Internal socket'}
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Replicas</div>
                  <div className="font-mono text-gray-900 dark:text-slate-100 text-xs bg-white dark:bg-[#151D30] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
                    {selectedService.replicas || '1/1'}
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Dependencies</div>
                  <div className="font-mono text-gray-900 dark:text-slate-100 text-xs bg-white dark:bg-[#151D30] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
                    {selectedService.dependencies?.length ? selectedService.dependencies.join(', ') : 'None'}
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">Last Deployment</div>
                  <div className="font-mono text-gray-900 dark:text-slate-100 text-xs bg-white dark:bg-[#151D30] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
                    {selectedService.last_deployment ? new Date(selectedService.last_deployment).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {selectedService.description && (
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-gray-900 dark:text-white font-semibold">Description: </strong>
                {selectedService.description}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ServicesPage;