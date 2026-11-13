import React from 'react';
import { Badge } from '../common/Badge';
import { Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ActivityFeed({ incidents = [], auditLogs = [] }) {
  const recentIncidents = incidents.slice(0, 3);
  const recentLogs = auditLogs.slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Recent Incidents Panel */}
      <div className="bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            Recent Incidents
          </h3>
          <Link
            to="/incidents"
            className="text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            All Incidents <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-slate-800 p-0 flex-1">
          {recentIncidents.map((incident) => (
            <div
              key={incident.incident_id}
              className="p-3.5 hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {incident.incident_id}
                  </span>
                  <Badge variant={incident.severity} size="xs">
                    {incident.severity}
                  </Badge>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {incident.title}
                  </h4>
                </div>
                <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-3">
                  <span className="font-mono text-gray-600 dark:text-slate-300">{incident.service}</span>
                  <span className="text-gray-400 dark:text-slate-500">{incident.duration} ago</span>
                  {incident.status === 'awaiting_approval' && (
                    <span className="text-[#D97706] dark:text-amber-400 font-medium">Awaiting Approval</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to={`/investigation?id=${incident.incident_id}`}
                  className="text-xs font-semibold text-[#6344F5] dark:text-[#A78BFA] hover:opacity-80 transition-opacity"
                >
                  Diagnose →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Activity Stream */}
      <div className="bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            Audit Activity Stream
          </h3>
          <Link
            to="/audit-logs"
            className="text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            Audit Trail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-slate-800 p-0 flex-1">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-gray-900 dark:text-white font-mono text-xs">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  {log.incident_id && (
                    <span className="text-[#6344F5] dark:text-[#A78BFA] font-mono text-[11px] font-bold">[{log.incident_id}]</span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                  Actor: <span className="text-gray-700 dark:text-slate-300 font-mono">{log.actor}</span>
                  {log.details?.root_cause && (
                    <span className="ml-2 text-gray-600 dark:text-slate-400 truncate">— {log.details.root_cause}</span>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-gray-400 dark:text-slate-500 font-mono flex-shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ActivityFeed;