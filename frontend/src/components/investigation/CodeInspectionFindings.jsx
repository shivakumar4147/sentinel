import React from 'react';
import {
  AlertTriangle,
  Code2,
  FileSearch,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export function CodeInspectionFindings({ findings = [], filesInspected = [] }) {
  if (!findings || findings.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 bg-gray-50 dark:bg-[#0D1424] rounded-2xl border border-gray-200 dark:border-slate-800">
        No source-code vulnerabilities or syntax issues detected.
      </div>
    );
  }

  const getSeverityBadge = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return <Badge variant="critical" size="xs">Critical Severity</Badge>;
      case 'high':
        return <Badge variant="high" size="xs">High Severity</Badge>;
      case 'medium':
        return <Badge variant="warning" size="xs">Medium Severity</Badge>;
      default:
        return <Badge variant="info" size="xs">Info</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Inspected Files Summary */}
      {filesInspected.length > 0 && (
        <div className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-[#6C5CE7] dark:text-[#A78BFA]" />
            <span>Files Inspected:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900 dark:text-white">
              {filesInspected.map((f, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[11px]">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {findings.length} issue{findings.length !== 1 ? 's' : ''} identified
          </span>
        </div>
      )}

      {/* Findings List */}
      <div className="space-y-3.5">
        {findings.map((finding, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 shadow-soft space-y-3"
          >
            {/* Header: Title + Severity + File:Line */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-gray-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 flex-wrap">
                {getSeverityBadge(finding.severity)}
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {finding.title}
                </h4>
              </div>

              <div className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#6C5CE7] dark:text-[#A78BFA]" />
                <span className="text-[#6C5CE7] dark:text-[#A78BFA]">{finding.file_path}</span>
                <span>: L{finding.start_line}-{finding.end_line}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {finding.description}
            </p>

            {/* Evidence snippet */}
            {finding.evidence && finding.evidence.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Vulnerable Source Code Evidence
                </div>
                <div className="p-3 bg-[#0B101E] text-rose-300 rounded-xl font-mono text-xs overflow-x-auto border border-rose-950/40">
                  {finding.evidence.map((line, lIdx) => (
                    <div key={lIdx} className="leading-snug">{line}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            {finding.recommendation && (
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>AI Recommended Correction:</span>
                </div>
                <p className="text-[11px] leading-relaxed pl-5.5 text-emerald-900 dark:text-emerald-300">
                  {finding.recommendation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CodeInspectionFindings;

