import { useState, useEffect } from 'react';
import { getFinancePayments, getFinanceExpenses } from '@/api/finance';
import { approveExpense, rejectExpense } from '@/api/expenses';
import type { YearPaymentsResponse, YearExpensesResponse, ExpenseDto } from '@/api/finance';
import { formatCurrency, formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

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

const STATUS_TABS = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const;

export default function FinancePage() {
  const [payments, setPayments] = useState<YearPaymentsResponse | null>(null);
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [paymentView, setPaymentView] = useState<'pending' | 'received' | 'overdue'>('pending');
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [expenses, setExpenses] = useState<YearExpensesResponse | null>(null);
  const [expenseYear, setExpenseYear] = useState(new Date().getFullYear());
  const [expenseStatus, setExpenseStatus] = useState<string>('ALL');
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  const [rejectId, setRejectId] = useState<{ projectId: number; expenseId: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    setLoadingPayments(true);
    getFinancePayments(paymentYear)
      .then(setPayments)
      .catch(() => setPayments(null))
      .finally(() => setLoadingPayments(false));
  }, [paymentYear]);

  useEffect(() => {
    setLoadingExpenses(true);
    getFinanceExpenses(expenseYear, expenseStatus === 'ALL' ? undefined : expenseStatus)
      .then(setExpenses)
      .catch(() => setExpenses(null))
      .finally(() => setLoadingExpenses(false));
  }, [expenseYear, expenseStatus]);

  const handleApprove = async (projectId: number, expenseId: number) => {
    await approveExpense(projectId, expenseId);
    const res = await getFinanceExpenses(expenseYear, expenseStatus === 'ALL' ? undefined : expenseStatus);
    setExpenses(res);
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    await rejectExpense(rejectId.projectId, rejectId.expenseId, rejectReason);
    setRejectId(null);
    setRejectReason('');
    const res = await getFinanceExpenses(expenseYear, expenseStatus === 'ALL' ? undefined : expenseStatus);
    setExpenses(res);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <a href="/api/finance/export?format=csv"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </a>
      </div>

      {/* Payments Panel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
            <div className="flex items-center gap-1 text-sm">
              <button onClick={() => setPaymentYear(paymentYear - 1)}
                className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 font-medium">&larr;</button>
              <span className="px-3 py-1 bg-gray-100 rounded font-medium text-gray-800">{paymentYear}</span>
              <button onClick={() => setPaymentYear(paymentYear + 1)}
                className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 font-medium">&rarr;</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPaymentView('pending')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${paymentView === 'pending' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Pending ({payments?.pending.length ?? 0})
            </button>
            <button onClick={() => setPaymentView('received')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${paymentView === 'received' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Received ({payments?.received.length ?? 0})
            </button>
            <button onClick={() => setPaymentView('overdue')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${paymentView === 'overdue' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
              Overdue ({payments?.overdue.length ?? 0})
            </button>
          </div>
        </div>
        {loadingPayments ? (
          <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
        ) : payments && paymentView === 'pending' && payments.pending.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">{['Project','Title','Amount','Due Date','Due in'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</thead>
              <tbody className="divide-y divide-gray-100">
                {payments.pending.map(p => {
                  const delay = p.dueDate ? Math.ceil((new Date(p.dueDate).getTime() - Date.now()) / 86400000) : null;
                  const color = delay !== null ? (delay <= 0 ? 'text-red-600 font-bold' : delay <= 3 ? 'text-orange-600' : 'text-gray-800') : '';
                  return <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.projectName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.title}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.dueDate ? formatDate(p.dueDate) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-right">{delay !== null ? <span className={`font-medium ${color}`}>{delay < 0 ? `${Math.abs(delay)}d late` : delay === 0 ? 'Due' : `${delay}d`}</span> : '—'}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        ) : payments && paymentView === 'overdue' && payments.overdue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-50">{['Project','Title','Amount','Due Date','Days Overdue'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">{h}</th>)}</thead>
              <tbody className="divide-y divide-gray-100">
                {payments.overdue.map(p => <tr key={p.id} className="hover:bg-red-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.projectName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.title}</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-700 text-right">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.dueDate ? formatDate(p.dueDate) : '—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">{p.delayDays}d</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        ) : payments && paymentView === 'received' && payments.received.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">{['Project','Title','Amount','Received','Delay'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</thead>
              <tbody className="divide-y divide-gray-100">
                {payments.received.map(p => <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.projectName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.title}</td>
                  <td className="px-4 py-3 text-sm font-medium text-right">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.receivedDate ? formatDate(p.receivedDate) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-right">{p.delayDays !== null ? <span className={`font-medium ${p.delayDays > 0 ? 'text-red-600' : 'text-green-600'}`}>{p.delayDays > 0 ? `${p.delayDays}d late` : 'On time'}</span> : '—'}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No payments found for {paymentYear}</div>
        )}
      </div>

      {/* Expenses Panel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
            <div className="flex items-center gap-1 text-sm">
              <button onClick={() => setExpenseYear(expenseYear - 1)}
                className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 font-medium">&larr;</button>
              <span className="px-3 py-1 bg-gray-100 rounded font-medium text-gray-800">{expenseYear}</span>
              <button onClick={() => setExpenseYear(expenseYear + 1)}
                className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 font-medium">&rarr;</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {STATUS_TABS.map(s => (
              <button key={s} onClick={() => setExpenseStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${expenseStatus === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s === 'ALL' ? 'All' : approvalLabel[s] || s}
              </button>
            ))}
          </div>
        </div>
        {loadingExpenses ? (
          <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
        ) : expenses && expenses.expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.expenses.map((e: ExpenseDto) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.projectName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{e.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right">{formatCurrency(Number(e.amount))}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{e.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{e.expenseDate ? formatDate(e.expenseDate) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${approvalBadge[e.approvalStatus || ''] || 'bg-gray-100 text-gray-600'}`}>
                        {approvalLabel[e.approvalStatus || ''] || e.approvalStatus || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{e.createdByName || '—'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {e.approvalStatus === 'PENDING_REVIEW' && (
                        <>
                          <button onClick={() => handleApprove(e.projectId, e.id)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>
                          <button onClick={() => { setRejectId({ projectId: e.projectId, expenseId: e.id }); setRejectReason(''); }}
                            className="text-red-600 hover:text-red-800 text-xs font-medium">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No expenses found for {expenseYear}</div>
        )}
      </div>

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
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Reject</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}