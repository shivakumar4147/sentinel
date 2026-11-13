import React from 'react';
import {
  Brain,
  Code2,
  FileCode,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Zap,
} from 'lucide-react';

export function PipelineStageTracker({ stageStatus = {}, confidence = 0.98 }) {
  const stages = [
    {
      id: 'diagnosis',
      title: '1. Incident Diagnosis',
      icon: Brain,
      desc: 'Telemetry & log correlation',
      status: stageStatus.diagnosis?.status || 'succeeded',
      duration: stageStatus.diagnosis?.duration_ms || 120,
    },
    {
      id: 'code_inspection',
      title: '2. Code Inspection',
      icon: Code2,
      desc: 'Static AST & vulnerability scan',
      status: stageStatus.code_inspection?.status || 'succeeded',
      duration: stageStatus.code_inspection?.duration_ms || 240,
    },
    {
      id: 'patch_generation',
      title: '3. Patch Generation',
      icon: FileCode,
      desc: 'Unified diff synthesis',
      status: stageStatus.patch_generation?.status || 'succeeded',
      duration: stageStatus.patch_generation?.duration_ms || 310,
    },
    {
      id: 'test_generation',
      title: '4. Test Generation',
      icon: PlayCircle,
      desc: 'Pytest regression suite',
      status: stageStatus.test_generation?.status || 'succeeded',
      duration: stageStatus.test_generation?.duration_ms || 190,
    },
    {
      id: 'test_result_analysis',
      title: '5. Verification',
      icon: CheckCircle2,
      desc: 'Safety impact evaluation',
      status: stageStatus.test_result_analysis?.status || 'succeeded',
      duration: stageStatus.test_result_analysis?.duration_ms || 80,
    },
  ];

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 shadow-soft">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#6C5CE7] dark:text-[#A78BFA]" />
          <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Sentinel 5-Stage Autonomous Pipeline
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
          <span>Engine: <strong className="text-[#6C5CE7] dark:text-[#A78BFA]">Gemini / Groq / Ollama</strong></span>
          <span>•</span>
          <span>Confidence: <strong className="text-emerald-600 dark:text-emerald-400">{Math.round(confidence * 100)}%</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isSuccess = st.status === 'succeeded';
          const isSkipped = st.status === 'skipped';
          const isFailed = st.status === 'failed';

          return (
            <div
              key={st.id}
              className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                isSuccess
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                  : isFailed
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                  : 'bg-gray-50/60 dark:bg-[#0D1424] border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <Icon className="w-3.5 h-3.5 text-[#6C5CE7] dark:text-[#A78BFA]" />
                    <span className="truncate">{st.title}</span>
                  </div>
                  {isSuccess && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                      ✓ Done
                    </span>
                  )}
                  {isFailed && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold">
                      Failed
                    </span>
                  )}
                  {isSkipped && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-gray-200 dark:bg-slate-800 text-slate-500 font-bold">
                      Skipped
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                  {st.desc}
                </p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500">
                <span>Stage {idx + 1}/5</span>
                <span>{st.duration}ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PipelineStageTracker;

