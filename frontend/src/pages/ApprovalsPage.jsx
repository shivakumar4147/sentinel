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
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function ApprovalsPage() {
  const { remediations, approveRemediation, rejectRemediation } = useSentinel();

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

  const pendingApprovals = remediations.filter(
    (r) => r.status === 'awaiting_approval' || r.status === 'pending_approval'
  );

  const historicalApprovals = remediations.filter(
    (r) => r.status !== 'awaiting_approval' && r.status !== 'pending_approval'
  );

  const openApproveModal = (rem) => {
    setConfirmModal({
      isOpen: true,
      remediation: rem,
      notes: `Approved following telemetry review of ${rem.target_service}.`,
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

  const openRejectModal = (rem) => {
    setRejectModal({
      isOpen: true,
      remediation: rem,
      hasSuggestion: null,
      suggestion: '',
      operator: 'oncall-operator',
      isSubmitting: false,
    });
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal.remediation) return;
    if (rejectModal.hasSuggestion === 'yes' && !rejectModal.suggestion.trim()) {
      return;
    }
    setRejectModal((prev) => ({ ...prev, isSubmitting: true }));

    const hasSug = rejectModal.hasSuggestion === 'yes' && rejectModal.suggestion.trim().length > 0;
    const finalReason = hasSug
      ? `Rejected with suggestion: ${rejectModal.suggestion.trim()}`
      : 'Rejected by operator (No suggestion provided).';

    try {
      await rejectRemediation(
        rejectModal.remediation.remediation_id,
        finalReason,
        rejectModal.operator,
        hasSug ? rejectModal.suggestion.trim() : null
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
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Operator Approvals Queue</h2>
            <span className="text-[10px] font-mono font-bold text-[#6344F5] dark:text-[#A78BFA] bg-white dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 px-2 py-0.5 rounded-full">
              Safety Guardrails
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            High-risk actions require manual sign-off before staging into the Remediation Engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-right font-mono">
            <div className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase">Pending Sign-Off</div>
            <div className="text-lg font-bold text-[#D97706] dark:text-amber-400">{pendingApprovals.length}</div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div>
        <div className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
          Awaiting Decision ({pendingApprovals.length})
        </div>

        <div className="space-y-4">
          {pendingApprovals.map((rem) => (
            <Card
              key={rem.remediation_id}
              className="p-5 border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111726] overflow-hidden"
              hover={true}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Left Column: Details */}
                <div className="space-y-3 flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#1E1B4B] dark:text-white bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 rounded">
                      {rem.remediation_id}
                    </span>
                    <Link
                      to={`/investigation?id=${rem.incident_id}`}
                      className="font-mono text-xs font-bold text-[#6344F5] dark:text-[#A78BFA] hover:underline"
                    >
                      Ref: {rem.incident_id}
                    </Link>
                    <Badge variant={rem.risk_level} size="xs">
                      {rem.risk_level} Risk
                    </Badge>
                    <Badge variant="awaiting_approval" size="xs">
                      Awaiting Sign-off
                    </Badge>
                    <span className="text-xs text-slate-400 dark:text-slate-400 font-mono">
                      Target: <strong className="text-slate-700 dark:text-slate-300">{rem.target_service}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white">
                    {rem.title || rem.action_type}
                  </h3>

                  {/* Justification */}
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-xs">
                    <span className="font-bold text-[#1E1B4B] dark:text-white">Reason: </span>
                    <span className="text-slate-600 dark:text-slate-300 leading-relaxed">{rem.reason}</span>
                  </div>

                  {/* Expected Impact */}
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-xs">
                    <span className="font-bold text-[#059669] dark:text-emerald-400">Expected Impact: </span>
                    <span className="text-slate-600 dark:text-slate-300 leading-relaxed">{rem.expected_impact}</span>
                  </div>

                  {/* Safety Checks */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                      Safety Policy Validations
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {(rem.safety_checks || []).map((check, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 flex items-center justify-between text-[11px]"
                        >
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate mr-2">{check.check}</span>
                          <span
                            className={`font-bold flex-shrink-0 ${
                              check.passed ? 'text-[#059669] dark:text-emerald-400' : 'text-[#D97706] dark:text-amber-400'
                            }`}
                          >
                            {check.passed ? 'Passed' : 'Hold'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Command */}
                  {rem.suggested_command && (
                    <div className="pt-1">
                      <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-slate-400" />
                        Staged Command
                      </div>
                      <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-[#34D399] overflow-x-auto whitespace-pre-wrap break-all max-w-full">
                        {rem.suggested_command}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Right Column: Actions */}
                <div className="w-full lg:w-44 flex-shrink-0 flex flex-col gap-2.5 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:border-gray-100 dark:lg:border-slate-800 lg:pl-5">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckSquare}
                    onClick={() => openApproveModal(rem)}
                    className="w-full justify-center"
                  >
                    Authorize Action
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={XCircle}
                    onClick={() => openRejectModal(rem)}
                    className="w-full justify-center"
                  >
                    Reject Request
                  </Button>
                  <Link
                    to={`/investigation?id=${rem.incident_id}`}
                    className="text-xs text-[#6344F5] dark:text-[#A78BFA] hover:underline text-center w-full py-1 font-semibold block transition-colors"
                  >
                    View Diagnosis →
                  </Link>
                </div>
              </div>
            </Card>
          ))}

          {pendingApprovals.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-slate-800 text-xs text-slate-400">
              No pending remediation requests awaiting approval.
            </div>
          )}
        </div>
      </div>

      {/* Historical Approvals */}
      <div className="pt-2">
        <div className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          Decision History ({historicalApprovals.length})
        </div>

        <div className="space-y-2.5">
          {historicalApprovals.map((rem) => {
            const isSuggestionApproved =
              rem.status === 'suggestion_approved' ||
              (rem.rejection_reason && rem.rejection_reason.toLowerCase().includes('suggestion')) ||
              Boolean(rem.suggestion);

            const badgeText = isSuggestionApproved
              ? 'Suggestion Approved'
              : rem.status === 'rejected'
              ? 'Rejected'
              : rem.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

            const badgeVariant = isSuggestionApproved ? 'suggestion_approved' : rem.status;

            return (
              <Card key={rem.remediation_id} className="p-3.5 bg-white dark:bg-[#111726] border-gray-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[#1E1B4B] dark:text-white">{rem.remediation_id}</span>
                    <Badge variant={badgeVariant} size="xs">
                      {badgeText}
                    </Badge>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{rem.title || rem.action_type}</span>
                    <span className="text-slate-400 dark:text-slate-400 font-mono text-[11px]">({rem.target_service})</span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="font-mono">
                      Decided by: <strong className="text-slate-700 dark:text-slate-300">{rem.operator || 'Sentinel Policy'}</strong>
                    </span>
                    <Link
                      to="/remediation"
                      className="text-[#6C5CE7] dark:text-[#A78BFA] hover:underline font-bold flex items-center gap-0.5"
                    >
                      Remediation Engine <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {(rem.suggestion || (isSuggestionApproved && rem.rejection_reason)) && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#6344F5] dark:text-[#A78BFA] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">Operator Suggestion: </strong>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {rem.suggestion || rem.rejection_reason?.replace(/^Rejected with suggestion:\s*/i, '')}
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
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-200">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-gray-900 dark:text-white">
                <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                Sign-off Notice
              </div>
              <p className="leading-relaxed text-gray-600 dark:text-slate-300">
                You are authorizing execution on <strong>{confirmModal.remediation?.target_service}</strong>.
                This action will be marked ready for execution in the Remediation Engine.
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
                className="w-full px-3 py-2 bg-[#F6F7FB] dark:bg-[#0D1424] border border-[#EEF0F6] dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#6C5CE7]"
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
                className="w-full px-3 py-2 bg-[#F6F7FB] dark:bg-[#0D1424] border border-[#EEF0F6] dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#6C5CE7]"
                placeholder="State reason for sign-off..."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Dialog with Suggestion Flow */}
      {rejectModal.isOpen && (
        <Modal
          isOpen={rejectModal.isOpen}
          onClose={() => setRejectModal({ ...rejectModal, isOpen: false })}
          title={`Reject Request: ${rejectModal.remediation?.remediation_id}`}
          description="Review rejection and operator feedback"
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
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#E11D48] flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="font-bold text-gray-900 dark:text-white">
                  Rejecting: {rejectModal.remediation?.title || rejectModal.remediation?.action_type}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Target Service:{' '}
                  <strong className="text-slate-700 dark:text-slate-300 font-mono">
                    {rejectModal.remediation?.target_service}
                  </strong>
                </div>
              </div>
            </div>

            {/* Question: "Do you have any suggestion" */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#151D30] border border-gray-200 dark:border-slate-700 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#6344F5] dark:text-[#A78BFA] flex-shrink-0" />
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  Do you have any suggestion?
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Would you like to provide an alternative solution, action plan, or feedback regarding this rejection?
              </p>

              {/* Yes / No Options */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectModal((prev) => ({ ...prev, hasSuggestion: 'yes' }))}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    rejectModal.hasSuggestion === 'yes'
                      ? 'bg-[#6344F5] text-white shadow-sm ring-2 ring-[#6344F5]/30'
                      : 'bg-gray-100 dark:bg-[#0D1424] text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-800'
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
                      ? 'bg-slate-800 dark:bg-slate-600 text-white shadow-sm ring-2 ring-slate-600/30'
                      : 'bg-gray-100 dark:bg-[#0D1424] text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  No
                </button>
              </div>
            </div>

            {/* If Yes: Suggestion Textarea */}
            {rejectModal.hasSuggestion === 'yes' && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#6344F5] dark:text-[#A78BFA]" />
                    Please enter your suggestion:
                  </span>
                  <span className="text-[10px] text-[#6344F5] dark:text-[#A78BFA] font-medium font-mono">
                    Required with "Yes"
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={rejectModal.suggestion}
                  onChange={(e) =>
                    setRejectModal((prev) => ({ ...prev, suggestion: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#F6F7FB] dark:bg-[#0D1424] border border-[#EEF0F6] dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#6344F5] dark:focus:border-[#A78BFA] placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="e.g. Recommend scaling pool size to 250 connections first and warming redis cache before restarting..."
                  autoFocus
                />
              </div>
            )}

            {/* If No: Note */}
            {rejectModal.hasSuggestion === 'no' && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1424] border border-gray-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 animate-in fade-in duration-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-[#059669] flex-shrink-0" />
                <span>No suggestion will be added. You can now confirm the rejection.</span>
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
                className="w-full px-3 py-1.5 bg-[#F6F7FB] dark:bg-[#0D1424] border border-[#EEF0F6] dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ApprovalsPage;