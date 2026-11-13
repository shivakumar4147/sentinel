import React, { useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  RotateCcw,
  Save,
  Server,
  Shield,
  FileSearch,
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export function SettingsPage() {
  const { isMockMode, toggleMockMode, resetDemoData } = useSentinel();
  const { addToast } = useToast();

  const [apiUrl, setApiUrl] = useState(API_BASE_URL);
  const [pollingRate, setPollingRate] = useState('3000');
  const [autoRemediateLowRisk, setAutoRemediateLowRisk] = useState(true);
  const [enforceDryRun, setEnforceDryRun] = useState(true);
  const [requireDualSignoff, setRequireDualSignoff] = useState(false);
  const [aiModel, setAiModel] = useState('llama3:8b');

  const handleSaveSettings = () => {
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Platform preferences have been updated in session state.',
    });
  };

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in">
      {/* Top Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        <div>
          <h2 className="text-base font-bold text-[#1E1B4B] dark:text-white">
            Platform Settings & Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure backend connection endpoints, safety guardrails, and model options.
          </p>
        </div>

        <Button
          variant="secondary"
          size="xs"
          icon={RotateCcw}
          onClick={resetDemoData}
        >
          Reset Demo Data
        </Button>
      </div>

      {/* Section 1: Backend Connection */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#F4F5F9] dark:border-slate-800">
          <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Backend Connection & Telemetry
          </h3>
          <Badge variant={isMockMode ? 'purple' : 'healthy'} size="xs">
            {isMockMode ? 'Simulated Telemetry' : 'Live Backend'}
          </Badge>
        </div>
        <div className="mt-4 space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
            <div>
              <div className="font-bold text-[#1E1B4B] dark:text-white">Use Simulated Mock Telemetry</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Runs Sentinel with internal simulated infrastructure metrics and AI root-cause models.
              </div>
            </div>
            <button
              onClick={() => toggleMockMode(!isMockMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isMockMode ? 'bg-[#6C5CE7]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isMockMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                FastAPI Backend URL:
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#6C5CE7]"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 block">
                Target: http://localhost:8000/api
              </span>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Polling Interval (ms):
              </label>
              <input
                type="number"
                value={pollingRate}
                onChange={(e) => setPollingRate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#6C5CE7]"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 block">
                Default: 3,000ms
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 2: Safety Policy */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#F4F5F9] dark:border-slate-800">
          <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Safety Guardrails
          </h3>
        </div>
        <div className="mt-4 space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
            <div>
              <div className="font-bold text-[#1E1B4B] dark:text-white">Enforce Pre-Remediation Dry Run</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                Validates syntax and container locks before executing production commands.
              </div>
            </div>
            <input
              type="checkbox"
              checked={enforceDryRun}
              onChange={(e) => setEnforceDryRun(e.target.checked)}
              className="w-4 h-4 accent-[#6C5CE7]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
            <div>
              <div className="font-bold text-[#1E1B4B] dark:text-white">Auto-Remediate Low-Risk Incidents</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                Permits non-destructive actions (cache warm, safe restarts) without manual sign-off.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoRemediateLowRisk}
              onChange={(e) => setAutoRemediateLowRisk(e.target.checked)}
              className="w-4 h-4 accent-[#6C5CE7]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
            <div>
              <div className="font-bold text-[#1E1B4B] dark:text-white">Dual Sign-Off for Critical Remediations</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                Requires two independent operator approvals before terminating database sessions.
              </div>
            </div>
            <input
              type="checkbox"
              checked={requireDualSignoff}
              onChange={(e) => setRequireDualSignoff(e.target.checked)}
              className="w-4 h-4 accent-[#6C5CE7]"
            />
          </div>
        </div>
      </Card>

      {/* Section 3: Model config */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#F4F5F9] dark:border-slate-800">
          <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Model Configuration
          </h3>
        </div>
        <div className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                LLM Inference Model:
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#6C5CE7]"
              >
                <option value="llama3:8b" className="dark:bg-[#111726]">meta-llama/Llama-3-8B-Instruct</option>
                <option value="mistral:7b" className="dark:bg-[#111726]">mistralai/Mistral-7B-Instruct-v0.2</option>
                <option value="deepseek-coder:6.7b" className="dark:bg-[#111726]">deepseek-ai/deepseek-coder-6.7b</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Inference Timeout (seconds):
              </label>
              <input
                type="number"
                defaultValue={15}
                className="w-full px-3 py-2 bg-[#F6F7FB] dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-1">
        <Button variant="primary" size="md" icon={Save} onClick={handleSaveSettings}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}

export default SettingsPage;