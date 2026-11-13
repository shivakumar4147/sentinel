import React, { useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  Search,
  Clock,
  RefreshCw,
  Code,
} from 'lucide-react';

export function AuditLogsPage() {
  const { auditLogs, loading, refreshData } = useSentinel();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.incident_id && log.incident_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction =
      actionFilter === 'ALL' ||
      (actionFilter === 'DETECTION' && log.action.includes('incident')) ||
      (actionFilter === 'AI' && (log.action.includes('ai') || log.action.includes('investigation'))) ||
      (actionFilter === 'SAFETY' && log.action.includes('safety')) ||
      (actionFilter === 'APPROVAL' && (log.action.includes('approval') || log.action.includes('suggestion'))) ||
      (actionFilter === 'REMEDIATION' && log.action.includes('remediation')) ||
      (actionFilter === 'VERIFICATION' && log.action.includes('verification'));

    const serviceInDetails = log.details?.service || '';
    const matchesService =
      serviceFilter === 'ALL' || serviceInDetails.toLowerCase() === serviceFilter.toLowerCase();

    return matchesSearch && matchesAction && matchesService;
  });

  const getActionBadge = (action) => {
    if (action.includes('incident')) {
      return (
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0D1424] text-[#E11D48] dark:text-[#FB7185]">
          DETECTION
        </span>
      );
    }
    if (action.includes('ai') || action.includes('investigation')) {
      return (
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0D1424] text-[#6344F5] dark:text-[#A78BFA]">
          AI DIAGNOSIS
        </span>
      );
    }
    if (action.includes('safety')) {
      return (
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0D1424] text-[#4F46E5] dark:text-[#818CF8]">
          SAFETY POLICY
        </span>
      );
    }
    if (action.includes('approval') || action.includes('suggestion')) {
      return (
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0D1424] text-[#059669] dark:text-[#34D399]">
          {action.includes('suggestion') ? 'SUGGESTION APPROVED' : 'APPROVAL'}
        </span>
      );
    }
    if (action.includes('remediation')) {
      return (
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0D1424] text-[#059669] dark:text-[#34D399]">
          REMEDIATION
        </span>
      );
    }
    return (
      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0D1424] text-gray-700 dark:text-slate-300">
        VERIFIED
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search and Filters */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#6C5CE7] transition-all shadow-soft"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="xs"
              icon={RefreshCw}
              loading={loading}
              onClick={() => refreshData()}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Action Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 rounded-2xl shadow-soft text-xs transition-colors">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mr-1 text-[11px]">Action:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'DETECTION', label: 'Detection' },
              { id: 'AI', label: 'AI Diagnosis' },
              { id: 'SAFETY', label: 'Safety Policy' },
              { id: 'APPROVAL', label: 'Approvals' },
              { id: 'REMEDIATION', label: 'Remediation' },
              { id: 'VERIFICATION', label: 'Verification' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActionFilter(f.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  actionFilter === f.id
                    ? 'bg-[#6344F5] text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-400 text-[11px] font-bold uppercase">Service:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-slate-800 dark:text-white font-mono text-xs focus:outline-none focus:border-[#6C5CE7]"
            >
              <option value="ALL" className="dark:bg-[#111726]">All Services</option>
              <option value="postgres-db" className="dark:bg-[#111726]">postgres-db</option>
              <option value="payment-worker" className="dark:bg-[#111726]">payment-worker</option>
              <option value="auth-service" className="dark:bg-[#111726]">auth-service</option>
              <option value="api-gateway" className="dark:bg-[#111726]">api-gateway</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chronological Audit Log Stream */}
      <Card className="p-0 overflow-hidden" hover={false}>
        <div className="p-4 border-b border-[#F4F5F9] dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Audit Trail Records ({filteredLogs.length})
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-400 font-mono">Immutable Compliance Stream</span>
        </div>
        <div className="divide-y divide-[#F4F5F9] dark:divide-slate-800">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 hover:bg-[#F8F9FD] dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[#1E1B4B] dark:text-white bg-[#F6F7FB] dark:bg-slate-800 px-2 py-0.5 rounded-full text-[11px] font-bold">
                    {log.id}
                  </span>
                  {getActionBadge(log.action)}
                  {log.incident_id && (
                    <span className="font-mono text-[#6C5CE7] dark:text-[#A78BFA] font-bold">
                      [{log.incident_id}]
                    </span>
                  )}
                  <span className="text-slate-400 dark:text-slate-400 font-mono text-[11px]">
                    Actor: <strong className="text-slate-700 dark:text-slate-300">{log.actor}</strong>
                  </span>
                </div>

                <div className="text-slate-800 dark:text-slate-200 font-semibold font-mono text-xs">
                  {log.action.replace(/_/g, ' ')}
                </div>

                <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-3xl">
                  {Object.entries(log.details || {})
                    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                    .join(' | ')}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F4F5F9] dark:border-slate-800">
                <div className="text-right font-mono text-[11px] text-slate-400 dark:text-slate-400">
                  <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="xs"
                  icon={Code}
                  onClick={() => setSelectedLog(log)}
                >
                  Raw JSON
                </Button>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-400">
              No audit records found matching your filter criteria.
            </div>
          )}
        </div>
      </Card>

      {/* Raw JSON Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.id}`}
          description={`Timestamp: ${new Date(selectedLog.timestamp).toISOString()}`}
          size="md"
          footer={
            <Button variant="secondary" size="xs" onClick={() => setSelectedLog(null)}>
              Close
            </Button>
          }
        >
          <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap break-all max-h-80 max-w-full">
            {JSON.stringify(selectedLog, null, 2)}
          </pre>
        </Modal>
      )}
    </div>
  );
}

export default AuditLogsPage;