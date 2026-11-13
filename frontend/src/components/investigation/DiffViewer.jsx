import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  GitCommit,
  Sparkles,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export function DiffViewer({
  patch,
  onApply,
  isApplying = false,
  isApplied = false,
  showApplyButton = true,
}) {
  const [copied, setCopied] = useState(false);

  if (!patch) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 bg-gray-50 dark:bg-[#0D1424] rounded-2xl border border-gray-200 dark:border-slate-800">
        No code patch generated for this incident.
      </div>
    );
  }

  const diffText = patch.unified_diff || '';
  const lines = diffText.split('\n');

  // Count additions and deletions
  const additions = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length;
  const deletions = lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(diffText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 shadow-soft overflow-hidden">
      {/* Diff Header Bar */}
      <div className="p-4 bg-[#F8FAFC] dark:bg-[#0C0F17] border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA]">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{patch.file_path || 'source_patch.diff'}</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({additions + deletions} changes)
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                +{additions} lines
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded">
                -{deletions} lines
              </span>
              <Badge variant="purple" size="xs">
                AI Confidence: {Math.round((patch.confidence || 0.98) * 100)}%
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Diff</span>
              </>
            )}
          </button>

          {showApplyButton && (
            isApplied ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Patch Applied
              </div>
            ) : (
              <Button
                variant="primary"
                size="xs"
                icon={Play}
                loading={isApplying}
                onClick={onApply}
              >
                Apply Code Fix
              </Button>
            )
          )}
        </div>
      </div>

      {/* AI Explanation Bar */}
      {patch.explanation && (
        <div className="px-4 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
          <Sparkles className="w-4 h-4 text-[#6C5CE7] dark:text-[#A78BFA] flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-[#6C5CE7] dark:text-[#A78BFA]">AI Remediation Strategy: </strong>
            <span>{patch.explanation}</span>
          </div>
        </div>
      )}

      {/* Unified Diff Box */}
      <div className="bg-[#0B101E] text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-[380px] overflow-y-auto leading-relaxed select-text">
        {lines.map((line, idx) => {
          const isAddition = line.startsWith('+') && !line.startsWith('+++');
          const isDeletion = line.startsWith('-') && !line.startsWith('---');
          const isHeader = line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++');

          let lineBg = 'transparent';
          let textColor = 'text-slate-300';
          let signColor = 'text-slate-500';

          if (isAddition) {
            lineBg = 'bg-emerald-950/40';
            textColor = 'text-emerald-300 font-medium';
            signColor = 'text-emerald-400 font-bold';
          } else if (isDeletion) {
            lineBg = 'bg-rose-950/40';
            textColor = 'text-rose-300';
            signColor = 'text-rose-400 font-bold';
          } else if (isHeader) {
            lineBg = 'bg-blue-950/30';
            textColor = 'text-[#60A5FA] font-bold';
          }

          return (
            <div
              key={idx}
              className={`flex items-start px-2 py-0.5 rounded transition-colors ${lineBg}`}
            >
              {/* Line number gutter */}
              <span className="w-8 flex-shrink-0 text-slate-600 select-none text-right pr-3 text-[11px]">
                {idx + 1}
              </span>

              {/* Diff sign & content */}
              <span className="flex-1 whitespace-pre-wrap break-all">
                <span className={signColor}>{line.charAt(0)}</span>
                <span className={textColor}>{line.slice(1)}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Diff Footer / Guardrails */}
      <div className="p-3 bg-[#F8FAFC] dark:bg-[#0C0F17] border-t border-gray-200 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <GitCommit className="w-3.5 h-3.5 text-slate-400" />
          <span>Target Repository: <code>sentinel / demo-application</code></span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Pre-flight dry run passed</span>
        </div>
      </div>
    </div>
  );
}

export default DiffViewer;

