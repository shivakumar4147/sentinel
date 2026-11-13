import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSentinel } from '../context/SentinelContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Globe,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Zap,
  Terminal,
  Activity,
  ShieldCheck,
  Code2,
  FileCode,
  ArrowRight,
  Sparkles,
  Server,
} from 'lucide-react';

export function LiveWebsitePage() {
  const navigate = useNavigate();
  const {
    liveStoreStatus,
    fetchLiveStoreStatus,
    setLiveStoreScenario,
    simulateLiveCheckout,
    applyCodePatch,
    incidents,
  } = useSentinel();

  const [isInjecting, setIsInjecting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState({
    id: 101,
    name: "L'Amour Eau De Parfum",
    price: 165.0,
  });
  const [isApplyingPatch, setIsApplyingPatch] = useState(false);
  const [patchAppliedSuccess, setPatchAppliedSuccess] = useState(false);

  useEffect(() => {
    fetchLiveStoreStatus();
    const interval = setInterval(() => {
      fetchLiveStoreStatus();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const storeState = liveStoreStatus || {
    store_name: 'Veloura Parfums Storefront',
    store_url: 'http://localhost:5173',
    api_url: 'http://localhost:8000',
    active_scenario: 'normal',
    status: 'healthy',
    is_failing: false,
    total_orders: 142,
    failed_checkouts: 0,
    last_order_id: 'ORD-7FA912',
  };

  const isDegraded = storeState.active_scenario !== 'normal' || storeState.is_failing;

  // Find corresponding incident in Sentinel
  const relatedIncident =
    storeState.active_scenario === 'bad_deployment'
      ? incidents.find((i) => i.incident_id === 'INC-8490' || i.incident_id === 'INC-002') || incidents[0]
      : storeState.active_scenario === 'database_failure'
      ? incidents.find((i) => i.incident_id === 'INC-8492' || i.incident_id === 'INC-001') || incidents[0]
      : incidents[0];

  const handleScenarioChange = async (scenario) => {
    setIsInjecting(true);
    setCheckoutResult(null);
    try {
      await setLiveStoreScenario(scenario);
      setPatchAppliedSuccess(false);
    } finally {
      setIsInjecting(false);
    }
  };

  const handleCheckoutTest = async () => {
    setIsCheckingOut(true);
    setCheckoutResult(null);
    const start = performance.now();
    try {
      const res = await simulateLiveCheckout({
        product_id: selectedProduct.id,
        quantity: 1,
        amount: selectedProduct.price,
        user_email: 'customer@velouraparfums.com',
      });
      const duration = Math.round(performance.now() - start);
      setCheckoutResult({
        success: true,
        statusCode: 200,
        latencyMs: duration,
        data: res,
      });
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      setCheckoutResult({
        success: false,
        statusCode: 500,
        latencyMs: duration,
        error: err.message || 'HTTP 500 Internal Server Error: AttributeError',
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleApplyFixDirectly = async () => {
    if (!relatedIncident) return;
    setIsApplyingPatch(true);
    try {
      await applyCodePatch(relatedIncident.incident_id);
      setPatchAppliedSuccess(true);
      // Reset scenario to normal as the fix has landed
      await setLiveStoreScenario('normal');
      setCheckoutResult(null);
    } finally {
      setIsApplyingPatch(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Target Details */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 shadow-soft transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Veloura Parfums — Live Target Application</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                      isDegraded
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isDegraded ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                      }`}
                    />
                    {isDegraded ? 'Degraded / Anomaly' : 'Operational / Healthy'}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Production-grade e-commerce application hooked to Sentinel's autonomous telemetry, AST code inspection, and hotfix engine.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={storeState.store_url || 'http://localhost:5173'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-gray-100 dark:bg-[#0D1424] hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors border border-gray-200 dark:border-slate-800"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
              <span>Open Storefront (Port 5173)</span>
            </a>

            <Button
              variant="secondary"
              size="xs"
              icon={RefreshCw}
              onClick={fetchLiveStoreStatus}
            >
              Sync Status
            </Button>
          </div>
        </div>

        {/* Real-time Target Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Endpoint</div>
            <div className="font-mono font-bold text-gray-900 dark:text-white mt-0.5 truncate">
              {storeState.store_url || 'http://localhost:5173'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Scenario</div>
            <div className="font-mono font-bold text-[#2563EB] dark:text-[#60A5FA] mt-0.5 uppercase">
              {storeState.active_scenario || 'normal'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Confirmed Orders</div>
            <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {storeState.total_orders || 142} orders
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed Checkout Count</div>
            <div
              className={`font-mono font-bold mt-0.5 ${
                storeState.failed_checkouts > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {storeState.failed_checkouts || 0} failures
            </div>
          </div>
        </div>
      </div>

      {/* Active Incident & Hotfix CTA Banner (Shown when degraded or checkout 500) */}
      {isDegraded && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-indigo-50 dark:from-rose-950/40 dark:via-amber-950/30 dark:to-indigo-950/40 border border-rose-300 dark:border-rose-900/60 shadow-md animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-sm flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                    Live Incident Detected on Target Storefront
                  </span>
                  <Badge variant="critical" size="xs">
                    {relatedIncident?.incident_id || 'INC-8490'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed">
                  Checkout service is throwing <code className="font-mono text-rose-600 dark:text-rose-400 font-bold bg-white/80 dark:bg-black/40 px-1 rounded">500 Internal Server Error</code>. Sentinel's 5-stage pipeline has identified the bug in <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">demo-application/api/main.py</code> and generated a unified diff hotfix with regression tests!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link to={`/investigation?id=${relatedIncident?.incident_id || 'INC-8490'}`}>
                <Button variant="primary" size="sm" icon={FileCode}>
                  Inspect AI Code Fix & Diff →
                </Button>
              </Link>

              <Button
                variant="secondary"
                size="sm"
                icon={Sparkles}
                loading={isApplyingPatch}
                disabled={patchAppliedSuccess}
                onClick={handleApplyFixDirectly}
              >
                {patchAppliedSuccess ? '✓ Patch Applied' : 'Hotfix Live Store'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chaos Engineering Bar */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Chaos Engineering & Failure Scenario Triggers
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Inject realistic faults to watch Sentinel detect & synthesize code fixes in real-time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <button
            onClick={() => handleScenarioChange('bad_deployment')}
            disabled={isInjecting}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              storeState.active_scenario === 'bad_deployment'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/20'
                : 'bg-gray-50/70 dark:bg-[#0D1424] border-gray-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white mb-1">
              <span className="text-rose-600 dark:text-rose-400">⚡ Bad Deployment</span>
              {storeState.active_scenario === 'bad_deployment' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Triggers HTTP 500 failure check in <code className="font-mono text-[10px]">demo-application/api/main.py</code>.
            </p>
          </button>

          <button
            onClick={() => handleScenarioChange('database_failure')}
            disabled={isInjecting}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              storeState.active_scenario === 'database_failure'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/60 ring-2 ring-amber-500/20'
                : 'bg-gray-50/70 dark:bg-[#0D1424] border-gray-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-900'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white mb-1">
              <span className="text-amber-600 dark:text-amber-400">⚡ Connection Leak</span>
              {storeState.active_scenario === 'database_failure' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Exhausts PostgreSQL connection pool (198/200 unclosed sessions in worker).
            </p>
          </button>

          <button
            onClick={() => handleScenarioChange('high_cpu')}
            disabled={isInjecting}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              storeState.active_scenario === 'high_cpu'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-900/60 ring-2 ring-indigo-500/20'
                : 'bg-gray-50/70 dark:bg-[#0D1424] border-gray-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-900'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white mb-1">
              <span className="text-indigo-600 dark:text-indigo-400">⚡ High CPU Spike</span>
              {storeState.active_scenario === 'high_cpu' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Triggers synthetic encryption computation loop to spike CPU &gt; 92%.
            </p>
          </button>

          <button
            onClick={() => handleScenarioChange('normal')}
            disabled={isInjecting}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              storeState.active_scenario === 'normal'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/60 ring-2 ring-emerald-500/20'
                : 'bg-gray-50/70 dark:bg-[#0D1424] border-gray-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white mb-1">
              <span className="text-emerald-600 dark:text-emerald-400">🔄 Reset to Healthy</span>
              {storeState.active_scenario === 'normal' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Restores all services and endpoints to baseline operational parameters.
            </p>
          </button>
        </div>
      </Card>

      {/* Main Two-Column View: Interactive Storefront Simulation + Live Checkout Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Storefront Preview Frame */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Live Storefront Catalog & Checkout Preview
                </h3>
              </div>
              <div className="text-xs font-mono text-slate-400">Port 5173</div>
            </div>

            {/* Visual Storefront Simulation Card */}
            <div className="mt-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gradient-to-b from-[#FFFDF9] to-[#F8F5F0] dark:from-[#0F1420] dark:to-[#090D15] p-5 flex-1 flex flex-col justify-between">
              <div>
                {/* Brand Header */}
                <div className="text-center pb-4 border-b border-[#E8DFC8]/60 dark:border-slate-800">
                  <div className="font-serif text-xl font-bold tracking-widest text-[#4A1521] dark:text-pink-200 uppercase">
                    Veloura Parfums
                  </div>
                  <div className="text-[9px] tracking-widest text-[#8C6B32] dark:text-amber-400 uppercase mt-0.5">
                    Haute Parfumerie • Paris
                  </div>
                </div>

                {/* Fragrance Products Grid */}
                <div className="grid grid-cols-3 gap-3 my-4">
                  {[
                    { id: 101, name: "L'Amour", type: 'Eau De Parfum', price: 165.0, color: 'from-pink-100 to-rose-200' },
                    { id: 102, name: 'Rose Noir', type: 'Extrait De Parfum', price: 220.0, color: 'from-rose-900 to-black' },
                    { id: 103, name: "L'Or Impérial", type: 'Elixir Precieux', price: 280.0, color: 'from-amber-200 to-yellow-600' },
                  ].map((p) => {
                    const isSelected = selectedProduct.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#8C6B32] dark:border-amber-400 bg-white dark:bg-[#1A2234] shadow-md ring-2 ring-[#8C6B32]/30'
                            : 'border-transparent bg-white/70 dark:bg-[#131824] hover:bg-white dark:hover:bg-[#1A2234]'
                        }`}
                      >
                        <div className="w-12 h-16 mx-auto rounded-lg bg-gradient-to-b shadow-inner flex items-center justify-center text-xs font-serif font-bold text-white mb-2"
                             style={{
                               background: p.id === 101 ? 'linear-gradient(135deg, #fce7ea, #e895a6)' : p.id === 102 ? 'linear-gradient(135deg, #3d0712, #170105)' : 'linear-gradient(135deg, #d4af37, #8c6b32)',
                             }}
                        >
                          50ml
                        </div>
                        <div className="font-serif font-bold text-xs text-[#4A1521] dark:text-white truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{p.type}</div>
                        <div className="text-xs font-bold text-[#8C6B32] dark:text-amber-400 font-mono mt-1">
                          ${p.price.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shopping Cart Summary Strip */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#131824] border border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Selected: <strong className="text-gray-900 dark:text-white">{selectedProduct.name}</strong>
                  </span>
                </div>
                <div className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                  ${selectedProduct.price.toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Live Checkout Tester Console */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#6C5CE7] dark:text-[#A78BFA]" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Live API Checkout Tester
                  </h3>
                </div>
                <Badge variant="purple" size="xs">
                  POST /api/checkout
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Trigger an end-to-end checkout payload directly against the target service to observe incident interception and automated code patch synthesis.
                </div>

                {/* Form parameters */}
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Customer Email
                    </label>
                    <input
                      type="text"
                      disabled
                      value="guest@velouraparfums.com"
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-xs font-mono text-gray-700 dark:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Payment Authorization
                    </label>
                    <input
                      type="text"
                      disabled
                      value="VISA •••• 4242 (3D-Secure)"
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-xs font-mono text-gray-700 dark:text-slate-300"
                    />
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={Zap}
                  loading={isCheckingOut}
                  onClick={handleCheckoutTest}
                  className="w-full justify-center mt-3"
                >
                  Dispatch Checkout Request →
                </Button>
              </div>

              {/* Response Output Terminal */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>API Response Log</span>
                  {checkoutResult && (
                    <span
                      className={`font-mono ${
                        checkoutResult.success ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      HTTP {checkoutResult.statusCode} ({checkoutResult.latencyMs}ms)
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] space-y-1.5 min-h-[140px] max-h-[180px] overflow-y-auto">
                  {checkoutResult ? (
                    checkoutResult.success ? (
                      <div className="text-emerald-400 space-y-1">
                        <div>HTTP/1.1 200 OK</div>
                        <div>Content-Type: application/json</div>
                        <pre className="text-slate-300 whitespace-pre-wrap mt-1">
                          {JSON.stringify(checkoutResult.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-rose-400 space-y-1">
                        <div>HTTP/1.1 500 INTERNAL SERVER ERROR</div>
                        <div>X-Sentinel-Intercept: Triggered</div>
                        <div className="text-rose-300 font-bold mt-1">
                          {checkoutResult.error}
                        </div>
                        <div className="text-amber-400 text-[10px] mt-2 font-sans font-bold">
                          ⚡ Incident logged to Sentinel Control Plane. AST Code patch available.
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-slate-500 italic">
                      Click 'Dispatch Checkout Request' above to test the live endpoint...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Link to Investigation */}
            {checkoutResult && !checkoutResult.success && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
                <Link to={`/investigation?id=${relatedIncident?.incident_id || 'INC-8490'}`}>
                  <button className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold transition-all shadow-md cursor-pointer">
                    <FileCode className="w-4 h-4" />
                    <span>View AI Code Fix & Unified Diff →</span>
                  </button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LiveWebsitePage;

