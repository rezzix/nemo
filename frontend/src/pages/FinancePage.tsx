import { useState, useEffect, useCallback } from 'react';
import { getFinanceDashboard } from '@/api/finance';
import { approveExpense, rejectExpense } from '@/api/expenses';
import type { DashboardResponse, ProjectFinance, OverduePayment } from '@/api/finance';
import { apiGet } from '@/api/client';
import type { ProjectExpenseDto } from '@/types';
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

export default function FinancePage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [pendingExpenses, setPendingExpenses] = useState<ProjectExpenseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<keyof ProjectFinance>('projectName');
  const [sortAsc, setSortAsc] = useState(true);
  const [rejectId, setRejectId] = useState<{ projectId: number; expenseId: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, expenses] = await Promise.all([
        getFinanceDashboard(),
        apiGet<ProjectExpenseDto[]>('/finance/expenses?approvalStatus=PENDING_REVIEW').catch(() => []),
      ]);
      setDashboard(dash);
      setPendingExpenses(expenses);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleSort = (key: keyof ProjectFinance) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleApprove = async (projectId: number, expenseId: number) => {
    await approveExpense(projectId, expenseId);
    fetchDashboard();
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    await rejectExpense(rejectId.projectId, rejectId.expenseId, rejectReason);
    setRejectId(null);
    setRejectReason('');
    fetchDashboard();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!dashboard) return <div className="p-6 text-gray-500">Unable to load dashboard data.</div>;

  const { summary, byProject, overduePayments } = dashboard;
  const projectNameById = new Map(byProject.map(p => [p.projectId, p.projectName]));
  const sorted = [...byProject].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortAsc ? cmp : -cmp;
  });

  const sortIcon = (key: keyof ProjectFinance) => sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : '';

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Budget', value: formatCurrency(summary.totalBudget), color: 'bg-blue-50 text-blue-700' },
          { label: 'Total Expenses', value: formatCurrency(summary.totalExpenses), color: 'bg-red-50 text-red-700' },
          { label: 'Payments Received', value: formatCurrency(summary.totalPaymentsReceived), color: 'bg-green-50 text-green-700' },
          { label: 'Payments Pending', value: formatCurrency(summary.totalPaymentsPending), color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Collection Rate', value: `${summary.collectionRate}%`, color: 'bg-purple-50 text-purple-700' },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-xl border border-gray-200 p-4 ${kpi.color}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-75">{kpi.label}</p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Project Financial Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Project Financials</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {([
                  ['projectName', 'Project'],
                  ['budget', 'Budget'],
                  ['expenses', 'Expenses'],
                  ['laborCost', 'Labor'],
                  ['paymentsReceived', 'Received'],
                  ['collectionProgress', 'Collection %'],
                  ['cpi', 'CPI'],
                  ['spi', 'SPI'],
                  ['pendingExpenses', 'Pending'],
                ] as [keyof ProjectFinance, string][]).map(([key, label]) => (
                  <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort(key)}>
                    {label}{sortIcon(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((p) => (
                <tr key={p.projectId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.projectName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(p.budget)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(p.expenses)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(p.laborCost)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(p.paymentsReceived)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.collectionProgress}%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.cpi !== null ? p.cpi : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.spi !== null ? p.spi : '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {p.pendingExpenses > 0
                      ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{p.pendingExpenses}</span>
                      : <span className="text-gray-400">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue Payments Panel */}
      {overduePayments.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-red-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-800">Overdue Payments ({overduePayments.length})</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-red-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Title</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Due Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-red-600 uppercase">Days Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {overduePayments.map((p: OverduePayment) => (
                <tr key={p.paymentId} className="hover:bg-red-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.projectName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.title}</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-700 text-right">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.dueDate ? formatDate(p.dueDate) : '—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">{p.daysOverdue}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Expense Approvals */}
      {pendingExpenses.length > 0 && (
        <div className="bg-white rounded-xl border border-yellow-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-yellow-200 bg-yellow-50">
            <h2 className="text-lg font-semibold text-yellow-800">Pending Expense Approvals ({pendingExpenses.length})</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-yellow-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-yellow-700 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-yellow-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-yellow-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{projectNameById.get(exp.projectId) ?? `Project ${exp.projectId}`}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{exp.category}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(Number(exp.amount))}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{exp.description || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(exp.expenseDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${approvalBadge[exp.approvalStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {approvalLabel[exp.approvalStatus] || exp.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleApprove(exp.projectId, exp.id)}
                      className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>
                    <button onClick={() => { setRejectId({ projectId: exp.projectId, expenseId: exp.id }); setRejectReason(''); }}
                      className="text-red-600 hover:text-red-800 text-xs font-medium">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Reject</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}