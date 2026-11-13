import React, { useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  CheckSquare,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Terminal,
  HelpCircle,
  Check,
  X,
  MessageSquare,
  Sparkles,
  Bot,
  RefreshCw,
  Sliders,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import { DiffViewer } from '../components/investigation/DiffViewer';
import { Link } from 'react-router-dom';

export function ApprovalsPage() {
  const { remediations, approveRemediation, rejectRemediation, reviseRemediation } = useSentinel();

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    remediation: null,
    notes: '',
    approver: 'oncall-operator',
    isSubmitting: false,
  });

  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    remediation: null,
    hasSuggestion: null, // null | 'yes' | 'no'
    suggestion: '',
    operator: 'oncall-operator',
    isSubmitting: false,
  });

  // Track in-card AI revising loop state: { [remediationId]: { isAnalyzing: boolean, suggestion: string, justRevised: boolean } }
  const [revisingMap, setRevisingMap] = useState({});

  const pendingApprovals = remediations.filter(
    (r) => r.status === 'awaiting_approval' || r.status === 'pending_approval' || r.status === 'changes_suggested'
  );

  const historicalApprovals = remediations.filter(
    (r) => r.status !== 'awaiting_approval' && r.status !== 'pending_approval' && r.status !== 'changes_suggested'
  );

  const openApproveModal = (rem) => {
    setConfirmModal({
      isOpen: true,
      remediation: rem,
      notes: rem.is_revised
        ? `Approved revised plan (v${rem.revision || 2}) following operator feedback review.`
        : `Approved following telemetry review of ${rem.target_service}.`,
      approver: 'oncall-operator',
      isSubmitting: false,
    });
  };

  const handleApproveConfirm = async () => {
    if (!confirmModal.remediation) return;
    setConfirmModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await approveRemediation(
        confirmModal.remediation.remediation_id,
        confirmModal.notes,
        confirmModal.approver
      );
      setConfirmModal({ isOpen: false, remediation: null, notes: '', approver: '', isSubmitting: false });
    } catch (err) {
      setConfirmModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const openRejectModal = (rem, defaultHasSuggestion = null, initialSuggestion = '') => {
    setRejectModal({
      isOpen: true,
      remediation: rem,
      hasSuggestion: defaultHasSuggestion,
      suggestion: initialSuggestion || rem.last_suggestion || '',
      operator: 'oncall-operator',
      isSubmitting: false,
    });
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal.remediation) return;
    if (rejectModal.hasSuggestion === 'yes' && !rejectModal.suggestion.trim()) {
      return;
    }

    const remId = rejectModal.remediation.remediation_id;
    const hasSug = rejectModal.hasSuggestion === 'yes' && rejectModal.suggestion.trim().length > 0;
    const suggestionText = hasSug ? rejectModal.suggestion.trim() : '';

    setRejectModal((prev) => ({ ...prev, isSubmitting: true }));

    if (hasSug) {
      // 1. Close modal immediately and activate in-card AI loop on the same card
      setRejectModal({
        isOpen: false,
        remediation: null,
        hasSuggestion: null,
        suggestion: '',
        operator: 'oncall-operator',
        isSubmitting: false,
      });

      // 2. Set in-card state to "Changes Suggested" + AI synthesizing
      setRevisingMap((prev) => ({
        ...prev,
        [remId]: {
          isAnalyzing: true,
          suggestion: suggestionText,
          startedAt: Date.now(),
        },
      }));

      // 3. Log changes suggested in audit & backend
      await rejectRemediation(
        remId,
        `Changes Suggested: ${suggestionText}`,
        rejectModal.operator,
        suggestionText
      );

      // 4. Trigger backend AI revision loop: AI returns revised plan on the same problem
      try {
        await reviseRemediation(remId, suggestionText, rejectModal.operator);
        setRevisingMap((prev) => ({
          ...prev,
          [remId]: {
            isAnalyzing: false,
            justRevised: true,
            suggestion: suggestionText,
          },
        }));
      } catch (err) {
        setRevisingMap((prev) => ({
          ...prev,
          [remId]: {
            isAnalyzing: false,
            error: err.message,
          },
        }));
      }
    } else {
      // Direct rejection with no suggestion -> moves to Decision History
      try {
        await rejectRemediation(
          remId,
          'Rejected by operator (No suggestion provided).',
          rejectModal.operator,
          null
        );
        setRejectModal({
          isOpen: false,
          remediation: null,
          hasSuggestion: null,
          suggestion: '',
          operator: 'oncall-operator',
          isSubmitting: false,
        });
      } catch (err) {
        setRejectModal((prev) => ({ ...prev, isSubmitting: false }));
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Top Banner - Spacious & De-cluttered */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131824] border border-gray-200/90 dark:border-[#232D42] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Operator Approvals Queue</h2>
            <span className="text-[11px] font-mono font-bold text-[#2563EB] dark:text-[#60A5FA] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 px-2.5 py-0.5 rounded-full">
              Human-in-the-Loop Guardrail
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            High-risk infrastructure actions require operator sign-off. If you suggest modifications, Sentinel AI will revise the strategy interactively in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0C0F17] border border-gray-200 dark:border-[#232D42] text-right font-mono">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Awaiting Decision</div>
            <div className="text-xl font-bold text-[#2563EB] dark:text-[#60A5FA]">{pendingApprovals.length}</div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
            <span>Active Review Queue ({pendingApprovals.length})</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 normal-case font-normal">
            Collaborative AI refinement active
          </span>
        </div>

        <div className="space-y-6">
          {pendingApprovals.map((rem) => {
            const revisingInfo = revisingMap[rem.remediation_id];
            const isAnalyzing = revisingInfo?.isAnalyzing;
            const isRevised = rem.is_revised || rem.revision > 1 || revisingInfo?.justRevised;
            const activeSuggestion = revisingInfo?.suggestion || rem.last_suggestion || rem.suggestion;

            return (
              <Card
                key={rem.remediation_id}
                className={`p-6 sm:p-7 border transition-all duration-300 ${
                  isAnalyzing
                    ? 'border-blue-500/50 dark:border-blue-500/40 ring-1 ring-blue-500/20 shadow-glow-cobalt bg-white dark:bg-[#131824]'
                    : isRevised
                    ? 'border-blue-400/40 dark:border-blue-500/30 bg-white dark:bg-[#131824] shadow-md'
                    : 'border-gray-200/90 dark:border-[#232D42] bg-white dark:bg-[#131824]'
                }`}
                hover={!isAnalyzing}
              >
                {/* AI Revising Banner (Live in-card loop feedback) */}
                {isAnalyzing && (
                  <div className="mb-5 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 animate-ai-pulse">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB] dark:text-[#60A5FA]">
                        <Bot className="w-4 h-4 animate-spin text-[#2563EB] dark:text-[#60A5FA]" />
                        <span>Sentinel AI Synthesizing Revised Remediation Plan...</span>
                      </div>
                      <Badge variant="changes_suggested" size="xs">
                        Changes Suggested
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      Addressing operator feedback: <em className="font-semibold text-slate-900 dark:text-white">"{activeSuggestion}"</em>
                    </p>
                    <div className="w-full bg-blue-200/40 dark:bg-blue-950/60 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full animate-ai-shimmer rounded-full" />
                    </div>
                  </div>
                )}

                {/* AI Revised Plan Callout (When backend AI has generated a new proposal) */}
                {!isAnalyzing && isRevised && (
                  <div className="mb-5 p-4 rounded-xl bg-blue-50/50 dark:bg-[#162032] border border-blue-200/70 dark:border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span>AI Revised Proposal Ready for Review</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#2563EB] dark:text-[#60A5FA] font-mono font-bold">
                            Iteration v{rem.revision || 2}
                          </span>
                        </div>
                        {activeSuggestion && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">Operator guidance incorporated: </span>
                            <span>"{activeSuggestion}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-[#059669] dark:text-emerald-400 font-bold bg-white dark:bg-[#0C0F17] px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/40 self-start sm:self-center">
                      Safety Passed
                    </span>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left Column: Details */}
                  <div className="space-y-4 flex-1 min-w-0 w-full">
                    {/* Top Metadata Badges */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-gray-900 dark:text-white bg-slate-100 dark:bg-[#1A2234] px-2.5 py-0.5 rounded-md border border-gray-200 dark:border-[#232D42]">
                        {rem.remediation_id}
                      </span>
                      <Link
                        to={`/investigation?id=${rem.incident_id}`}
                        className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                      >
                        Ref: {rem.incident_id}
                      </Link>
                      <Badge variant={rem.risk_level} size="xs">
                        {rem.risk_level} Risk
                      </Badge>
                      <Badge variant={isRevised ? 'revised_pending' : 'awaiting_approval'} size="xs">
                        {isRevised ? 'Revised Proposal' : 'Awaiting Sign-off'}
                      </Badge>
                      <span className="text-xs text-slate-400 dark:text-slate-400 font-mono">
                        Target: <strong className="text-slate-800 dark:text-slate-200">{rem.target_service}</strong>
                      </span>
                    </div>

                    {/* Proposal Title */}
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                      {rem.title || rem.action_type}
                    </h3>

                    {/* Reason & Rationale */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0C0F17] border border-gray-100 dark:border-[#232D42] text-xs">
                      <span className="font-bold text-gray-900 dark:text-white">Analysis & Rationale: </span>
                      <span className="text-slate-600 dark:text-slate-300 leading-relaxed">{rem.reason}</span>
                    </div>

                    {/* Expected Impact */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0C0F17] border border-gray-100 dark:border-[#232D42] text-xs">
                      <span className="font-bold text-[#059669] dark:text-emerald-400">Expected Outcome: </span>
                      <span className="text-slate-600 dark:text-slate-300 leading-relaxed">{rem.expected_impact}</span>
                    </div>

                    {/* Safety Checks - Clean Grid */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Autonomous Safety Validations
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {(rem.safety_checks || []).map((check, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C0F17] border border-gray-100 dark:border-[#232D42] flex items-center justify-between text-[11px]"
                          >
                            <span className="text-slate-700 dark:text-slate-300 font-medium truncate mr-2">{check.check}</span>
                            <span
                              className={`font-bold flex-shrink-0 flex items-center gap-1 ${
                                check.passed ? 'text-[#059669] dark:text-emerald-400' : 'text-[#D97706] dark:text-amber-400'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {check.passed ? 'Verified' : 'Hold'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Staged Command */}
                    {rem.suggested_command && (
                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5 text-slate-400" />
                          Staged Execution Pipeline
                        </div>
                        <pre className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap break-all max-w-full leading-relaxed">
                          {rem.suggested_command}
                        </pre>
                      </div>
                    )}

                    {/* Staged Code Patch Diff (if applicable) */}
                    {(rem.diff || rem.action_type === 'apply_code_patch') && (
                      <div className="pt-2">
                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <FileCode className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                          <span>AI Code Patch Verification Diff</span>
                        </div>
                        <DiffViewer
                          patch={{
                            file_path: rem.affected_file || rem.target_file || (rem.incident_id === 'INC-8490' || rem.incident_id === 'INC-002' ? 'demo-application/api/main.py' : 'worker/main.py'),
                            unified_diff: rem.diff || `--- a/demo-application/api/main.py\n+++ b/demo-application/api/main.py\n@@ -511,7 +511,7 @@\n-    if SIMULATE_BAD_DEPLOYMENT:\n+    if False and SIMULATE_BAD_DEPLOYMENT:  # Fixed by Sentinel Remediation\n         log_event(`,
                            confidence: 0.99,
                          }}
                          showApplyButton={false}
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="w-full lg:w-48 flex-shrink-0 flex flex-col gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:border-gray-100 dark:lg:border-[#232D42] lg:pl-6">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckSquare}
                      disabled={isAnalyzing}
                      onClick={() => openApproveModal(rem)}
                      className="w-full justify-center shadow-md shadow-blue-500/10"
                    >
                      {isRevised ? 'Authorize Revised Plan' : 'Authorize Action'}
                    </Button>

                    {/* Suggest Changes (Triggers in-card AI loop) */}
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Sliders}
                      disabled={isAnalyzing}
                      onClick={() => openRejectModal(rem, 'yes')}
                      className="w-full justify-center"
                    >
                      {isRevised ? 'Suggest Further Changes' : 'Suggest Changes'}
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      disabled={isAnalyzing}
                      onClick={() => openRejectModal(rem, 'no')}
                      className="w-full justify-center"
                    >
                      Reject Request
                    </Button>

                    <Link
                      to={`/investigation?id=${rem.incident_id}`}
                      className="text-xs text-[#2563EB] dark:text-[#60A5FA] hover:underline text-center w-full py-1.5 font-semibold block transition-colors"
                    >
                      View AI Diagnosis →
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}

          {pendingApprovals.length === 0 && (
            <div className="p-16 text-center rounded-2xl bg-white dark:bg-[#131824] border border-gray-200/90 dark:border-[#232D42] text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-600 dark:text-slate-300">All Remediations Reviewed</div>
              <div>No pending remediation actions currently awaiting operator sign-off.</div>
            </div>
          )}
        </div>
      </div>

      {/* Historical Approvals Section - Clean & Spacious */}
      <div className="pt-4 space-y-3">
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Decision History & Audit Trail ({historicalApprovals.length})
        </div>

        <div className="space-y-3">
          {historicalApprovals.map((rem) => {
            const isChangesSuggested =
              rem.status === 'changes_suggested' ||
              (rem.rejection_reason && rem.rejection_reason.toLowerCase().includes('suggestion')) ||
              Boolean(rem.suggestion);

            const badgeVariant = isChangesSuggested ? 'changes_suggested' : rem.status;
            const badgeText = isChangesSuggested
              ? 'Changes Suggested'
              : rem.status === 'rejected'
              ? 'Rejected'
              : rem.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <Card key={rem.remediation_id} className="p-4 bg-white dark:bg-[#131824] border-gray-200/90 dark:border-[#232D42]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{rem.remediation_id}</span>
                    <Badge variant={badgeVariant} size="xs">
                      {badgeText}
                    </Badge>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{rem.title || rem.action_type}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">({rem.target_service})</span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="font-mono">
                      Decided by: <strong className="text-slate-800 dark:text-slate-200">{rem.operator || 'Sentinel Policy'}</strong>
                    </span>
                    <Link
                      to="/remediation"
                      className="text-[#2563EB] dark:text-[#60A5FA] hover:underline font-bold flex items-center gap-0.5"
                    >
                      Remediation Engine <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {(rem.suggestion || (isChangesSuggested && rem.rejection_reason)) && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-[#1C2436] text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">Operator Feedback: </strong>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {rem.suggestion || rem.rejection_reason?.replace(/^Rejected with suggestion:\s*|^Changes Suggested:\s*/i, '')}
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmModal.isOpen && (
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          title={`Confirm Authorization: ${confirmModal.remediation?.remediation_id}`}
          description="Verification of Safety Policy & On-Call Responsibility"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="xs"
                icon={CheckSquare}
                loading={confirmModal.isSubmitting}
                onClick={handleApproveConfirm}
              >
                Confirm Approval
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0C0F17] border border-gray-200 dark:border-[#232D42] text-gray-800 dark:text-slate-200">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-gray-900 dark:text-white">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                Sign-off Notice
              </div>
              <p className="leading-relaxed text-gray-600 dark:text-slate-300">
                You are authorizing execution on <strong>{confirmModal.remediation?.target_service}</strong>.
                This action will be marked ready for autonomous staging in the Remediation Engine.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Operator Identifier:
              </label>
              <input
                type="text"
                value={confirmModal.approver}
                onChange={(e) =>
                  setConfirmModal({ ...confirmModal, approver: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0C0F17] border border-gray-200 dark:border-[#232D42] rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Approval Notes:
              </label>
              <textarea
                rows={2}
                value={confirmModal.notes}
                onChange={(e) =>
                  setConfirmModal({ ...confirmModal, notes: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0C0F17] border border-gray-200 dark:border-[#232D42] rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#2563EB]"
                placeholder="State reason for sign-off..."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Suggestion & Rejection Dialog with Feedback Loop Trigger */}
      {rejectModal.isOpen && (
        <Modal
          isOpen={rejectModal.isOpen}
          onClose={() => setRejectModal({ ...rejectModal, isOpen: false })}
          title={
            rejectModal.hasSuggestion === 'yes'
              ? `Suggest Modifications: ${rejectModal.remediation?.remediation_id}`
              : `Review Request: ${rejectModal.remediation?.remediation_id}`
          }
          description="Operator input will be sent to Sentinel AI for real-time plan refinement"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setRejectModal({ ...rejectModal, isOpen: false })}
              >
                Cancel
              </Button>
              <Button
                variant={rejectModal.hasSuggestion === 'yes' ? 'primary' : 'danger'}
                size="xs"
                loading={rejectModal.isSubmitting}
                disabled={
                  rejectModal.hasSuggestion === null ||
                  (rejectModal.hasSuggestion === 'yes' && !rejectModal.suggestion.trim())
                }
                onClick={handleRejectConfirm}
              >
                {rejectModal.hasSuggestion === 'yes' ? 'Confirm Suggestion' : 'Confirm Rejection'}
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Target context banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0C0F17] border border-gray-200 dark:border-[#232D42] text-gray-800 dark:text-slate-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="font-bold text-gray-900 dark:text-white">
                  Target: {rejectModal.remediation?.title || rejectModal.remediation?.action_type}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Service:{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {rejectModal.remediation?.target_service}
                  </strong>
                </div>
              </div>
            </div>

            {/* Question: "Do you have any suggestion?" */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#161D2B] border border-gray-200 dark:border-[#232D42] shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] flex-shrink-0" />
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  Do you have any suggestion?
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                If you suggest changes, Sentinel AI will immediately process your advice and revise this remediation plan for your re-review.
              </p>

              {/* Yes / No Options */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectModal((prev) => ({ ...prev, hasSuggestion: 'yes' }))}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    rejectModal.hasSuggestion === 'yes'
                      ? 'bg-[#2563EB] text-white shadow-sm ring-2 ring-blue-500/30'
                      : 'bg-slate-100 dark:bg-[#0C0F17] text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-[#232D42] hover:bg-slate-200 dark:hover:bg-[#1A2234]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRejectModal((prev) => ({ ...prev, hasSuggestion: 'no', suggestion: '' }))
                  }
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    rejectModal.hasSuggestion === 'no'
                      ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm ring-2 ring-slate-600/30'
                      : 'bg-slate-100 dark:bg-[#0C0F17] text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-[#232D42] hover:bg-slate-200 dark:hover:bg-[#1A2234]'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  No
                </button>
              </div>
            </div>

            {/* If Yes: Suggestion Textarea */}
            {rejectModal.hasSuggestion === 'yes' && (
              <div className="space-y-1.5 animate-slide-up">
                <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                    Please enter your suggestion for Sentinel AI:
                  </span>
                  <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-medium font-mono">
                    Required with "Yes"
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={rejectModal.suggestion}
                  onChange={(e) =>
                    setRejectModal((prev) => ({ ...prev, suggestion: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0C0F17] border border-gray-200 dark:border-[#232D42] rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#2563EB] dark:focus:border-[#60A5FA] placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="e.g. Recommend scaling pool size to 250 connections first and warming redis cache before restarting..."
                  autoFocus
                />
              </div>
            )}

            {/* If No: Note */}
            {rejectModal.hasSuggestion === 'no' && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0C0F17] border border-gray-200 dark:border-[#232D42] text-xs text-slate-600 dark:text-slate-400 animate-slide-up flex items-center gap-2">
                <Check className="w-4 h-4 text-[#059669] flex-shrink-0" />
                <span>No suggestion will be sent. The request will be permanently rejected.</span>
              </div>
            )}

            {/* Operator Identifier */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-xs">
                Operator Identifier:
              </label>
              <input
                type="text"
                value={rejectModal.operator}
                onChange={(e) =>
                  setRejectModal((prev) => ({ ...prev, operator: e.target.value }))
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0C0F17] border border-gray-200 dark:border-[#232D42] rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ApprovalsPage;
