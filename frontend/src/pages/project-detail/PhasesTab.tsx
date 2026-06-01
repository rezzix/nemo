import { useState, useEffect, useCallback, useRef } from 'react';
import type { PhaseDto, ClientPaymentDto, DeliverableDto } from '@/types';
import { listPhases, createPhase, updatePhase, deletePhase, listDeliverables, createDeliverable, updateDeliverable, deleteDeliverable, uploadDeliverableAttachment, deleteDeliverableAttachment, getDeliverableAttachmentDownloadUrl, listClientPayments, createClientPayment, updateClientPayment, deleteClientPayment } from '@/api/phases';
import axios from 'axios';
import { formatDate, formatCurrency, formatCurrencyUnit, deliverableStateBadge, deliverableStateLabel, deadlineBadge, deadlineLabel } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

export default function PhasesTab({ projectId, canEdit, canManagePayments = false }: { projectId: number; canEdit: boolean; canManagePayments?: boolean }) {
  const [phases, setPhases] = useState<PhaseDto[]>([]);
  const [deliverables, setDeliverables] = useState<DeliverableDto[]>([]);
  const [payments, setPayments] = useState<Record<number, ClientPaymentDto[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedPhaseId, setExpandedPhaseId] = useState<number | null>(null);

  // Phase form state
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState<PhaseDto | null>(null);
  const [phaseForm, setPhaseForm] = useState({ name: '', description: '', startDate: '', endDate: '', plannedAmount: '', status: 'OPEN' });
  const [phaseSaving, setPhaseSaving] = useState(false);
  const [phaseError, setPhaseError] = useState<string | null>(null);

  // Deliverable form state
  const [showDeliverableForm, setShowDeliverableForm] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<DeliverableDto | null>(null);
  const [deliverableForm, setDeliverableForm] = useState({ name: '', description: '', phaseId: 0, dueDate: '', state: 'DRAFT' as DeliverableDto['state'] });
  const [deliverableSaving, setDeliverableSaving] = useState(false);
  const [deliverableError, setDeliverableError] = useState<string | null>(null);

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ClientPaymentDto | null>(null);
  const [paymentFormPhaseId, setPaymentFormPhaseId] = useState<number>(0);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: '', reference: '', notes: '' });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Attachment state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingForDeliverableId, setUploadingForDeliverableId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, d] = await Promise.all([listPhases(projectId), listDeliverables(projectId)]);
      setPhases(p);
      setDeliverables(d);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchPayments = async (phaseId: number) => {
    try {
      const p = await listClientPayments(projectId, phaseId);
      setPayments(prev => ({ ...prev, [phaseId]: p }));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (expandedPhaseId) fetchPayments(expandedPhaseId);
  }, [expandedPhaseId]);

  const deliverablesByPhase = (phaseId: number) => deliverables.filter(d => d.phaseId === phaseId);

  // Phase CRUD
  const openPhaseForm = (phase?: PhaseDto) => {
    if (phase) {
      setEditingPhase(phase);
      setPhaseForm({ name: phase.name, description: phase.description || '', startDate: phase.startDate || '', endDate: phase.endDate || '', plannedAmount: phase.plannedAmount || '', status: phase.status || 'OPEN' });
    } else {
      setEditingPhase(null);
      setPhaseForm({ name: '', description: '', startDate: '', endDate: '', plannedAmount: '', status: 'OPEN' });
    }
    setPhaseError(null);
    setShowPhaseForm(true);
  };

  const handlePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phaseForm.name.trim()) return;
    setPhaseSaving(true); setPhaseError(null);
    try {
      if (editingPhase) {
        await updatePhase(projectId, editingPhase.id, {
          name: phaseForm.name, description: phaseForm.description || undefined,
          startDate: phaseForm.startDate || undefined, endDate: phaseForm.endDate || undefined,
          plannedAmount: phaseForm.plannedAmount || undefined,
          status: phaseForm.status || undefined,
        });
      } else {
        await createPhase(projectId, {
          name: phaseForm.name, description: phaseForm.description || undefined,
          startDate: phaseForm.startDate || undefined, endDate: phaseForm.endDate || undefined,
          plannedAmount: phaseForm.plannedAmount || undefined,
          status: phaseForm.status || undefined,
        });
      }
      setShowPhaseForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save phase:', err);
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to save phase.';
      setPhaseError(msg);
    } finally { setPhaseSaving(false); }
  };

  const handlePhaseDelete = async (id: number) => {
    if (!confirm('Delete this phase and all its deliverables and payments?')) return;
    await deletePhase(projectId, id);
    fetchData();
  };

  const togglePhaseStatus = async (phase: PhaseDto) => {
    const newStatus = phase.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    await updatePhase(projectId, phase.id, { status: newStatus });
    fetchData();
  };

  // Deliverable CRUD
  const openDeliverableForm = (phaseId: number, deliverable?: DeliverableDto) => {
    if (deliverable) {
      setEditingDeliverable(deliverable);
      setDeliverableForm({ name: deliverable.name, description: deliverable.description || '', phaseId, dueDate: deliverable.dueDate || '', state: deliverable.state });
    } else {
      setEditingDeliverable(null);
      setDeliverableForm({ name: '', description: '', phaseId, dueDate: '', state: 'DRAFT' });
    }
    setDeliverableError(null);
    setShowDeliverableForm(true);
  };

  const handleDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverableForm.name.trim()) return;
    setDeliverableSaving(true); setDeliverableError(null);
    try {
      if (editingDeliverable) {
        await updateDeliverable(projectId, editingDeliverable.id, {
          name: deliverableForm.name, description: deliverableForm.description || undefined,
          state: deliverableForm.state, dueDate: deliverableForm.dueDate || undefined,
        });
      } else {
        await createDeliverable(projectId, {
          name: deliverableForm.name, description: deliverableForm.description || undefined,
          phaseId: deliverableForm.phaseId, dueDate: deliverableForm.dueDate || undefined,
        });
      }
      setShowDeliverableForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save deliverable:', err);
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to save deliverable.';
      setDeliverableError(msg);
    } finally { setDeliverableSaving(false); }
  };

  const handleDeliverableDelete = async (id: number) => {
    if (!confirm('Delete this deliverable?')) return;
    await deleteDeliverable(projectId, id);
    fetchData();
  };

  const handleStateChange = async (deliverable: DeliverableDto, newState: DeliverableDto['state']) => {
    await updateDeliverable(projectId, deliverable.id, { state: newState });
    fetchData();
  };

  const nextDeliverableState = (state: DeliverableDto['state']): DeliverableDto['state'] | null => {
    if (state === 'DRAFT') return 'DELIVERED';
    if (state === 'DELIVERED') return 'VALIDATED';
    return null;
  };

  // Payment CRUD
  const openPaymentForm = (phaseId: number, payment?: PhasePaymentDto) => {
    if (payment) {
      setEditingPayment(payment);
      setPaymentForm({ amount: payment.amount, paymentDate: payment.paymentDate || '', reference: payment.reference || '', notes: payment.notes || '' });
    } else {
      setEditingPayment(null);
      setPaymentForm({ amount: '', paymentDate: new Date().toISOString().split('T')[0], reference: '', notes: '' });
    }
    setPaymentFormPhaseId(phaseId);
    setPaymentError(null);
    setShowPaymentForm(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount) return;
    setPaymentSaving(true); setPaymentError(null);
    try {
      if (editingPayment) {
        await updateClientPayment(projectId, paymentFormPhaseId, editingPayment.id, {
          amount: paymentForm.amount, paymentDate: paymentForm.paymentDate || undefined,
          reference: paymentForm.reference || undefined, notes: paymentForm.notes || undefined,
        });
      } else {
        await createClientPayment(projectId, paymentFormPhaseId, {
          amount: paymentForm.amount, paymentDate: paymentForm.paymentDate || undefined,
          reference: paymentForm.reference || undefined, notes: paymentForm.notes || undefined,
        });
      }
      setShowPaymentForm(false);
      fetchPayments(paymentFormPhaseId);
      fetchData();
    } catch (err) {
      console.error('Failed to save payment:', err);
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to save payment.';
      setPaymentError(msg);
    } finally { setPaymentSaving(false); }
  };

  const handlePaymentDelete = async (phaseId: number, paymentId: number) => {
    if (!confirm('Delete this payment?')) return;
    await deleteClientPayment(projectId, phaseId, paymentId);
    fetchPayments(phaseId);
    fetchData();
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingForDeliverableId == null) return;
    setUploading(true);
    try {
      const att = await uploadDeliverableAttachment(projectId, uploadingForDeliverableId, file);
      setDeliverables(prev => prev.map(d =>
        d.id === uploadingForDeliverableId
          ? { ...d, attachments: [...d.attachments, att] }
          : d
      ));
    } catch (err) {
      console.error('Failed to upload attachment:', err);
    } finally {
      setUploading(false);
      setUploadingForDeliverableId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAttachmentDelete = async (deliverableId: number, attachmentId: number) => {
    if (!confirm('Delete this attachment?')) return;
    try {
      await deleteDeliverableAttachment(projectId, deliverableId, attachmentId);
      setDeliverables(prev => prev.map(d =>
        d.id === deliverableId
          ? { ...d, attachments: d.attachments.filter(a => a.id !== attachmentId) }
          : d
      ));
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const paymentProgress = (phase: PhaseDto) => {
    if (!phase.plannedAmount || Number(phase.plannedAmount) === 0) return { planned: 0, paid: Number(phase.totalPaid || 0), pct: 0, color: 'bg-gray-300' };
    const planned = Number(phase.plannedAmount);
    const paid = Number(phase.totalPaid || 0);
    const pct = Math.min(100, Math.round((paid / planned) * 100));
    const color = pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500';
    return { planned, paid, pct, color };
  };

  const spentProgress = (phase: PhaseDto) => {
    if (!phase.plannedAmount || Number(phase.plannedAmount) === 0) return { planned: 0, spent: Number(phase.spent || 0), pct: 0, color: 'bg-gray-300' };
    const planned = Number(phase.plannedAmount);
    const spent = Number(phase.spent || 0);
    const pct = Math.min(100, Math.round((spent / planned) * 100));
    const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';
    return { planned, spent, pct, color };
  };

  if (loading) return <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Phases ({phases.length})</h3>
        {canEdit && (
          <button onClick={() => openPhaseForm()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">+ Add Phase</button>
        )}
      </div>

      {phases.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No phases defined yet.</div>
      ) : (
        <div className="space-y-3">
          {phases.map(phase => {
            const isExpanded = expandedPhaseId === phase.id;
            const phaseDeliverables = deliverablesByPhase(phase.id);
            const progress = paymentProgress(phase);
            const sProgress = spentProgress(phase);
            const phasePayments = payments[phase.id] || [];
            return (
              <div key={phase.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      {canEdit ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePhaseStatus(phase); }}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${phase.status === 'CLOSED' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}
                          title={phase.status === 'OPEN' ? 'Open — click to close' : 'Closed — click to reopen'}
                        >
                          {phase.status === 'OPEN' ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" /></svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4" /></svg>
                          )}
                          {phase.status === 'OPEN' ? 'Open' : 'Closed'}
                        </button>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${phase.status === 'CLOSED' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                          {phase.status === 'OPEN' ? 'Open' : 'Closed'}
                        </span>
                      )}
                      <h4 className="font-medium text-gray-900">{phase.name}</h4>
                      {phaseDeliverables.length > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-600">{phaseDeliverables.length}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {(Number(phase.totalPaid || 0) > 0 || (progress.planned > 0) || Number(phase.spent || 0) > 0) && (
                        <div className="flex flex-col gap-1 min-w-[180px]">
                          {(Number(phase.totalPaid || 0) > 0 || progress.planned > 0) && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${progress.color}`} style={{ width: `${progress.pct}%` }} />
                              </div>
                              <span className="text-[11px] text-gray-500 whitespace-nowrap w-16 text-right">{formatCurrencyUnit(Number(phase.totalPaid || 0))}</span>
                            </div>
                          )}
                          {Number(phase.spent || 0) > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${Number(progress.planned) > 0 ? sProgress.color : 'bg-red-300'}`} style={{ width: `${sProgress.planned > 0 ? sProgress.pct : 100}%` }} />
                              </div>
                              <span className="text-[11px] text-gray-500 whitespace-nowrap w-16 text-right">{formatCurrencyUnit(Number(phase.spent))}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {(phase.startDate || phase.endDate) && (
                        <span className={`text-xs ${deadlineBadge(phase.endDate, phase.status === 'CLOSED' ? 'CLOSED' : undefined) || 'text-gray-400'}`}>
                          {phase.startDate && formatDate(phase.startDate)}
                          {phase.startDate && phase.endDate && ' → '}
                          {phase.endDate && formatDate(phase.endDate)}
                        </span>
                      )}
                      {deadlineLabel(phase.endDate, phase.status === 'CLOSED' ? 'CLOSED' : undefined) && (
                        <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-medium ${deadlineBadge(phase.endDate, phase.status === 'CLOSED' ? 'CLOSED' : undefined)}`}>
                          {deadlineLabel(phase.endDate, phase.status === 'CLOSED' ? 'CLOSED' : undefined)}
                        </span>
                      )}
                      {canEdit && (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openPhaseForm(phase)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handlePhaseDelete(phase.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {phase.description && <p className="text-sm text-gray-500 mt-1 ml-7">{phase.description}</p>}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-2 ml-7">
                    {/* Budget vs Spent section */}
                    {sProgress.planned > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Budget vs Spent</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2 text-xs">
                          <span className="text-gray-500">Budget: <span className="font-medium text-gray-900">{formatCurrencyUnit(sProgress.planned)}</span></span>
                          <span className="text-gray-500">Spent: <span className={`font-medium ${sProgress.pct >= 100 ? 'text-red-700' : sProgress.pct >= 80 ? 'text-amber-700' : 'text-gray-900'}`}>{formatCurrencyUnit(sProgress.spent)}</span></span>
                          <span className={`font-medium ${sProgress.pct >= 100 ? 'text-red-700' : sProgress.pct >= 80 ? 'text-amber-700' : 'text-gray-500'}`}>({sProgress.pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${sProgress.color}`} style={{ width: `${sProgress.pct}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Payments section */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payments ({phasePayments.length})</span>
                        {canManagePayments && (
                          <button onClick={() => openPaymentForm(phase.id)} className="text-xs font-medium text-primary-600 hover:text-primary-800">+ Add Payment</button>
                        )}
                      </div>
                      {progress.planned > 0 && (
                        <div className="flex items-center gap-3 mb-2 text-xs">
                          <span className="text-gray-500">Planned: <span className="font-medium text-gray-900">{formatCurrencyUnit(progress.planned)}</span></span>
                          <span className="text-gray-500">Paid: <span className={`font-medium ${progress.pct >= 100 ? 'text-green-700' : 'text-gray-900'}`}>{formatCurrencyUnit(progress.paid)}</span></span>
                          <span className={`font-medium ${progress.pct >= 100 ? 'text-green-700' : 'text-gray-500'}`}>({progress.pct}%)</span>
                        </div>
                      )}
                      {progress.paid > 0 && progress.planned === 0 && (
                        <div className="flex items-center gap-3 mb-2 text-xs">
                          <span className="text-gray-500">Paid: <span className="font-medium text-gray-900">{formatCurrencyUnit(progress.paid)}</span></span>
                        </div>
                      )}
                      {phasePayments.length === 0 ? (
                        <p className="text-sm text-gray-400 py-1">No payments recorded.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-gray-100">
                            <th className="text-left px-2 py-1 font-medium text-gray-500 text-xs">Date</th>
                            <th className="text-right px-2 py-1 font-medium text-gray-500 text-xs">Amount</th>
                            <th className="text-left px-2 py-1 font-medium text-gray-500 text-xs">Reference</th>
                            <th className="text-left px-2 py-1 font-medium text-gray-500 text-xs">Notes</th>
                            {canManagePayments && <th className="px-2 py-1"></th>}
                          </tr></thead>
                          <tbody className="divide-y divide-gray-50">
                            {phasePayments.map(p => (
                              <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-2 py-1.5 text-gray-600">{p.paymentDate ? formatDate(p.paymentDate) : '—'}</td>
                                <td className="px-2 py-1.5 text-right font-medium text-gray-900">{formatCurrencyUnit(Number(p.amount))}</td>
                                <td className="px-2 py-1.5 text-gray-600">{p.reference || '—'}</td>
                                <td className="px-2 py-1.5 text-gray-500 max-w-[200px] truncate">{p.notes || '—'}</td>
                                {canManagePayments && (
                                  <td className="px-2 py-1.5 text-right">
                                    <button onClick={() => openPaymentForm(phase.id, p)} className="text-primary-600 hover:text-primary-800 text-xs font-medium mr-2">Edit</button>
                                    <button onClick={() => handlePaymentDelete(phase.id, p.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Deliverables section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Deliverables ({phaseDeliverables.length})</span>
                        {canEdit && (
                          <button onClick={() => openDeliverableForm(phase.id)} className="text-xs font-medium text-primary-600 hover:text-primary-800">+ Add</button>
                        )}
                      </div>
                      {phaseDeliverables.length === 0 ? (
                        <p className="text-sm text-gray-400 py-2">No deliverables yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {phaseDeliverables.map(d => (
                            <div key={d.id} className="py-2 px-3 rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                  <button
                                    onClick={() => {
                                      const next = nextDeliverableState(d.state);
                                      if (next && canEdit) handleStateChange(d, next);
                                    }}
                                    disabled={!canEdit || !nextDeliverableState(d.state)}
                                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${deliverableStateBadge(d.state)} ${canEdit && nextDeliverableState(d.state) ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                    title={nextDeliverableState(d.state) ? `Change to ${deliverableStateLabel(nextDeliverableState(d.state)!)}` : undefined}
                                  >
                                    {deliverableStateLabel(d.state)}
                                  </button>
                                  <span className="text-sm text-gray-900 truncate">{d.name}</span>
                                  {d.dueDate && <span className={`text-xs ${deadlineBadge(d.dueDate, d.state === 'VALIDATED' || d.state === 'DELIVERED' ? 'CLOSED' : undefined) || 'text-gray-400'}`}>Due: {formatDate(d.dueDate)}</span>}
                                  {d.dueDate && deadlineLabel(d.dueDate, d.state === 'VALIDATED' || d.state === 'DELIVERED' ? 'CLOSED' : undefined) && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${deadlineBadge(d.dueDate, d.state === 'VALIDATED' || d.state === 'DELIVERED' ? 'CLOSED' : undefined)}`}>
                                      {deadlineLabel(d.dueDate, d.state === 'VALIDATED' || d.state === 'DELIVERED' ? 'CLOSED' : undefined)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {canEdit && (
                                    <button
                                      onClick={() => { setUploadingForDeliverableId(d.id); fileInputRef.current?.click(); }}
                                      disabled={uploading}
                                      className="text-gray-400 hover:text-primary-600 text-xs"
                                      title="Attach file"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                      </svg>
                                    </button>
                                  )}
                                  {canEdit && (
                                    <>
                                      <button onClick={() => openDeliverableForm(phase.id, d)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                                      <button onClick={() => handleDeliverableDelete(d.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {d.attachments.length > 0 && (
                                <div className="mt-1.5 space-y-1">
                                  {d.attachments.map(att => (
                                    <div key={att.id} className="flex items-center gap-2 text-xs text-gray-500 ml-[4.5rem]">
                                      <a
                                        href={getDeliverableAttachmentDownloadUrl(projectId, d.id, att.id)}
                                        className="hover:text-primary-600 hover:underline flex items-center gap-1"
                                        target="_blank" rel="noopener noreferrer"
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                        </svg>
                                        {att.fileName}
                                      </a>
                                      <span className="text-gray-300">({formatFileSize(att.fileSize)})</span>
                                      {canEdit && (
                                        <button onClick={() => handleAttachmentDelete(d.id, att.id)} className="text-red-400 hover:text-red-600 ml-1" title="Delete attachment">
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {uploading && uploadingForDeliverableId === d.id && (
                                <div className="mt-1 ml-[4.5rem] text-xs text-primary-600 flex items-center gap-1">
                                  <Spinner className="h-3 w-3" /> Uploading...
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Phase form modal */}
      {showPhaseForm && (
        <Modal title={editingPhase ? 'Edit Phase' : 'New Phase'} onClose={() => setShowPhaseForm(false)}>
          <form onSubmit={handlePhaseSubmit} className="space-y-4">
            {phaseError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{phaseError}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={phaseForm.name} onChange={e => setPhaseForm(f => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={phaseForm.description} onChange={e => setPhaseForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={phaseForm.startDate} onChange={e => setPhaseForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={phaseForm.endDate} onChange={e => setPhaseForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Planned Amount</label>
                <input type="text" value={phaseForm.plannedAmount} onChange={e => setPhaseForm(f => ({ ...f, plannedAmount: e.target.value }))} placeholder="e.g. 25000" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={phaseForm.status} onChange={e => setPhaseForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowPhaseForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={phaseSaving || !phaseForm.name.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {phaseSaving && <Spinner className="h-4 w-4" />}{editingPhase ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment form modal */}
      {showPaymentForm && (
        <Modal title={editingPayment ? 'Edit Payment' : 'Record Payment'} onClose={() => setShowPaymentForm(false)}>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            {paymentError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{paymentError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input type="text" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 5000" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm(f => ({ ...f, paymentDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <input type="text" value={paymentForm.reference} onChange={e => setPaymentForm(f => ({ ...f, reference: e.target.value }))} placeholder="Invoice #, PO #, etc." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowPaymentForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={paymentSaving || !paymentForm.amount} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {paymentSaving && <Spinner className="h-4 w-4" />}{editingPayment ? 'Update' : 'Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deliverable form modal */}
      {showDeliverableForm && (
        <Modal title={editingDeliverable ? 'Edit Deliverable' : 'New Deliverable'} onClose={() => setShowDeliverableForm(false)}>
          <form onSubmit={handleDeliverableSubmit} className="space-y-4">
            {deliverableError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{deliverableError}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={deliverableForm.name} onChange={e => setDeliverableForm(f => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={deliverableForm.description} onChange={e => setDeliverableForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {!editingDeliverable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                <select value={deliverableForm.phaseId} onChange={e => setDeliverableForm(f => ({ ...f, phaseId: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            {editingDeliverable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select value={deliverableForm.state} onChange={e => setDeliverableForm(f => ({ ...f, state: e.target.value as DeliverableDto['state'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="DRAFT">Draft</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="VALIDATED">Validated</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={deliverableForm.dueDate} onChange={e => setDeliverableForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowDeliverableForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={deliverableSaving || !deliverableForm.name.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {deliverableSaving && <Spinner className="h-4 w-4" />}{editingDeliverable ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleAttachmentUpload} />
    </div>
  );
}