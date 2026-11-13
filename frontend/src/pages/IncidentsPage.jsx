import React, { useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function IncidentsPage() {
  const { incidents, acceptAndApplySolution, rejectSolution } = useSentinel();

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState(null);

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      (incident.incident_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (incident.title || incident.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (incident.service || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (incident.summary || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === 'ALL' || incident.severity.toLowerCase() === severityFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'ALL' || incident.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, service, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#6C5CE7] transition-all shadow-soft"
          />
        </div>

        <div className="text-xs text-slate-400 dark:text-slate-400 font-mono">
          Showing {filteredIncidents.length} of {incidents.length} alerts
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 rounded-2xl shadow-soft text-xs transition-colors">
        {/* Severity */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 dark:text-slate-400 font-medium mr-1 text-[11px]">Severity:</span>
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                severityFilter === sev
                  ? 'bg-[#6344F5] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 dark:text-slate-400 font-medium mr-1 text-[11px]">Status:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'AWAITING_APPROVAL', label: 'Awaiting Sign-off' },
            { id: 'REMEDIATING', label: 'Remediating' },
            { id: 'RESOLVED', label: 'Resolved' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st.id
                  ? 'bg-[#6344F5] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.map((incident) => {
          return (
            <Card
              key={incident.incident_id}
              className="p-4 transition-all bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700"
              hover={true}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {incident.incident_id}
                    </span>
                    <Badge variant={incident.severity} size="xs">
                      {incident.severity}
                    </Badge>
                    <Badge variant={incident.status} size="xs">
                      {incident.status.replace(/_/g, ' ')}
                    </Badge>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {incident.title || incident.summary || incident.incident_id}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-slate-400 truncate max-w-3xl mt-1">
                    {incident.summary}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400 dark:text-slate-500 font-mono flex-wrap">
                    <span>Service: <strong className="text-gray-700 dark:text-slate-300">{incident.service}</strong></span>
                    <span>•</span>
                    <span>{incident.duration} active</span>
                    <span>•</span>
                    <span>{new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => setSelectedIncident(incident)}
                  >
                    Quick View
                  </Button>
                  <Link to={`/investigation?id=${incident.incident_id}`}>
                    <Button variant="primary" size="xs">
                      Investigate
                    </Button>
                  </Link>
                  {incident.status === 'awaiting_approval' && (
                    <Link to="/approvals">
                      <Button variant="warning" size="xs">
                        Sign-off →
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredIncidents.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 text-xs text-slate-400">
          No incidents match your filter criteria.
        </div>
      )}

      {/* Quick Incident Detail Modal */}
      {selectedIncident && (
        <Modal
          isOpen={!!selectedIncident}
          onClose={() => setSelectedIncident(null)}
          title={selectedIncident.incident_id}
          description={selectedIncident.title || selectedIncident.summary || selectedIncident.incident_id}
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2">
                {selectedIncident.status === 'awaiting_approval' && (
                  <>
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={async () => {
                        await rejectSolution(selectedIncident.remediation_id || selectedIncident.incident_id);
                        setSelectedIncident(null);
                      }}
                    >
                      Reject Fix
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      icon={CheckCircle2}
                      onClick={async () => {
                        await acceptAndApplySolution(selectedIncident.remediation_id || selectedIncident.incident_id);
                        setSelectedIncident(null);
                      }}
                    >
                      Accept & Apply Fix
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Link to={`/investigation?id=${selectedIncident.incident_id}`}>
                  <Button variant="secondary" size="xs">
                    Full Investigation →
                  </Button>
                </Link>
                <Button variant="secondary" size="xs" onClick={() => setSelectedIncident(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            {/* Direct Solution Box for Awaiting Approval */}
            {selectedIncident.status === 'awaiting_approval' && (
              <div className="p-3 rounded-xl bg-[#090D16] border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    AI Autonomous Remediation Solution
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {selectedIncident.target_file || 'demo-application/api/main.py'}
                  </span>
                </div>
                <div className="font-mono text-xs rounded-lg bg-[#05080F] border border-slate-800/80 p-2 overflow-x-auto leading-relaxed max-h-28 text-slate-300">
                  <div className="text-blue-400 font-bold">@@ -511,7 +511,7 @@ checkout</div>
                  <div className="text-slate-400">     # CONTROLLED BAD-DEPLOYMENT FAILURE</div>
                  <div className="text-rose-400 bg-rose-950/30">-    if SIMULATE_BAD_DEPLOYMENT:</div>
                  <div className="text-emerald-400 bg-emerald-950/30">+    if False and SIMULATE_BAD_DEPLOYMENT:  # Fixed by Sentinel Remediation</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400 dark:text-slate-400">Severity</div>
                <div className="mt-1">
                  <Badge variant={selectedIncident.severity} size="xs">
                    {selectedIncident.severity}
                  </Badge>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400 dark:text-slate-400">Status</div>
                <div className="mt-1">
                  <Badge variant={selectedIncident.status} size="xs">
                    {selectedIncident.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400 dark:text-slate-400">Service</div>
                <div className="font-mono text-xs font-bold text-gray-900 dark:text-white mt-1">
                  {selectedIncident.service}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400 dark:text-slate-400">Duration</div>
                <div className="font-mono text-xs font-bold text-gray-900 dark:text-white mt-1">
                  {selectedIncident.duration}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
              <strong className="text-gray-900 dark:text-white">Summary: </strong>
              {selectedIncident.summary}
            </div>

            {selectedIncident.evidence?.logs?.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto">
                {selectedIncident.evidence.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes('FATAL') || log.includes('ERROR')
                        ? 'text-rose-400'
                        : log.includes('WARN')
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default IncidentsPage;