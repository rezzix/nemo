import { useState, useEffect, useCallback } from 'react';
import type { ProjectExpenseDto } from '@/types';
import { listProjectExpenses, createProjectExpense, updateProjectExpense, deleteProjectExpense, approveExpense, rejectExpense } from '@/api/expenses';
import { formatCurrency, formatDate } from '@/utils/format';
import { useAuthStore } from '@/stores/authStore';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';

const CATEGORIES = ['EQUIPMENT', 'EXPERTISE', 'TRAVEL', 'SOFTWARE', 'INFRASTRUCTURE', 'OTHER'] as const;

const categoryLabel: Record<string, string> = {
  EQUIPMENT: 'Equipment',
  EXPERTISE: 'Expertise',
  TRAVEL: 'Travel',
  SOFTWARE: 'Software',
  INFRASTRUCTURE: 'Infrastructure',
  OTHER: 'Other',
};

const categoryColor: Record<string, string> = {
  EQUIPMENT: 'bg-blue-100 text-blue-700',
  EXPERTISE: 'bg-purple-100 text-purple-700',
  TRAVEL: 'bg-amber-100 text-amber-700',
  SOFTWARE: 'bg-green-100 text-green-700',
  INFRASTRUCTURE: 'bg-gray-100 text-gray-700',
  OTHER: 'bg-pink-100 text-pink-700',
};

const approvalBadge: Record<string, string> = {
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const approvalLabel: Record<string, string> = {
  PENDING_REVIEW: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export default function ExpensesTab({ projectId, canEdit }: { projectId: number; canEdit: boolean }) {
  const [expenses, setExpenses] = useState<ProjectExpenseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formCategory, setFormCategory] = useState<string>('SOFTWARE');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const user = useAuthStore((s) => s.user);
  const isFinance = user?.role === 'FINANCE';

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      setExpenses(await listProjectExpenses(projectId));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || !formDate) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateProjectExpense(projectId, editingId, {
          category: formCategory,
          amount: formAmount,
          description: formDescription || undefined,
          expenseDate: formDate,
        });
      } else {
        await createProjectExpense(projectId, {
          category: formCategory,
          amount: formAmount,
          description: formDescription || undefined,
          expenseDate: formDate,
        });
      }
      setShowForm(false);
      setEditingId(null);
      fetchExpenses();
    } catch {
      setError('Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (exp: ProjectExpenseDto) => {
    setEditingId(exp.id);
    setFormCategory(exp.category);
    setFormAmount(exp.amount);
    setFormDescription(exp.description ?? '');
    setFormDate(exp.expenseDate);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    await deleteProjectExpense(projectId, id);
    fetchExpenses();
  };

  const handleApprove = async (expenseId: number) => {
    await approveExpense(projectId, expenseId);
    fetchExpenses();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await rejectExpense(projectId, rejectId!, rejectReason);
    setRejectId(null);
    setRejectReason('');
    fetchExpenses();
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (loading) return <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
          <p className="text-sm text-gray-500">Total: {formatCurrency(totalExpenses)}</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditingId(null); setFormCategory('SOFTWARE'); setFormAmount(''); setFormDescription(''); setFormDate(new Date().toISOString().slice(0, 10)); setShowForm(true); }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Add Expense
          </button>
        )}
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created by</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {(canEdit || isFinance) && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor[exp.category] || categoryColor.OTHER}`}>
                      {categoryLabel[exp.category] || exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{exp.description || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(Number(exp.amount))}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(exp.expenseDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{exp.createdByName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${approvalBadge[exp.approvalStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {approvalLabel[exp.approvalStatus] || exp.approvalStatus}
                    </span>
                  </td>
                  {(canEdit || isFinance) && (
                    <td className="px-4 py-3 text-right space-x-2">
                      {canEdit && (
                        <>
                          <button onClick={() => startEdit(exp)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(exp.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </>
                      )}
                      {isFinance && exp.approvalStatus === 'PENDING_REVIEW' && (
                        <>
                          <button onClick={() => handleApprove(exp.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>
                          <button onClick={() => { setRejectId(exp.id); setRejectReason(''); }} className="text-red-600 hover:text-red-800 text-xs font-medium">Reject</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit Expense' : 'Add Expense'} onClose={() => { setShowForm(false); setEditingId(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel[c]}</option>)}
              </select>
            </div>
            <Field label="Amount" value={formAmount} onChange={setFormAmount} type="number" required />
            <Field label="Description" value={formDescription} onChange={setFormDescription} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={saving || !formAmount}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Spinner className="h-4 w-4" />}{editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {rejectId && (
        <Modal title="Reject Expense" onClose={() => { setRejectId(null); setRejectReason(''); }}>
          <form onSubmit={(e) => { e.preventDefault(); handleReject(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                Reject
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}