import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getBankDashboard, getFinanceDashboard } from '@/api/finance';
import type { BankDashboardResponse, DashboardSummary } from '@/api/finance';
import { formatCurrency, formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

const statusBadge: Record<string, string> = {
  NEW: 'bg-yellow-100 text-yellow-800',
  RECONCILED: 'bg-green-100 text-green-800',
  IGNORED: 'bg-gray-100 text-gray-600',
};

export default function FinanceBankDashboardPage() {
  const [data, setData] = useState<BankDashboardResponse | null>(null);
  const [projectSummary, setProjectSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bankDash, projDash] = await Promise.all([
        getBankDashboard(),
        getFinanceDashboard().catch(() => null),
      ]);
      setData(bankDash);
      setProjectSummary(projDash?.summary ?? null);
    } catch (err) {
      setError('Failed to load bank dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 max-w-md mx-auto">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-500">No dashboard data available.</div>;
  }

  const { kpis, bankAccounts, recentTransactions } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/finance" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Finance
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Bank Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Cash position, bank balances, and recent transactions</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Cash</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(kpis.totalCash)}</p>
          {projectSummary && (
            <p className="text-xs text-gray-400 mt-1">
              Budget: {formatCurrency(projectSummary.totalBudget)} &middot; Pending: {formatCurrency(projectSummary.totalPaymentsPending)}
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Unreconciled</p>
          <p className={`text-2xl font-bold mt-1 ${kpis.unreconciledCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {kpis.unreconciledCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">transactions awaiting reconciliation</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pending Payments</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(kpis.pendingPaymentsTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">from unreconciled project payments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Last Import</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.lastImportDate ? formatDate(kpis.lastImportDate) : '—'}</p>
          <p className="text-xs text-gray-400 mt-1">most recent bank statement import</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex items-center gap-3">
        <Link
          to="/finance/reconciliation"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          Go to Reconciliation
        </Link>
        <Link
          to="/finance/bank-accounts"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 6v12a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V6M3 6l9-3 9 3" />
          </svg>
          Bank Accounts
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Accounts Widget */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Bank Accounts</h2>
            <p className="text-xs text-gray-500 mt-0.5">{bankAccounts.length} active account{bankAccounts.length !== 1 ? 's' : ''}</p>
          </div>
          {bankAccounts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 6v12a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V6M3 6l9-3 9 3" />
              </svg>
              <p className="mt-2 text-sm">No bank accounts configured.</p>
              <Link to="/finance/bank-accounts" className="mt-2 inline-block text-sm text-primary-600 hover:text-primary-800">Add bank accounts</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Account</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Currency</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">Balance</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Last Import</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bankAccounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link to={`/finance/bank-accounts/${acc.id}`} className="font-medium text-primary-600 hover:text-primary-800">
                          {acc.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {acc.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(acc.balance)}</td>
                      <td className="px-4 py-3 text-gray-500">{acc.lastImportDate ? formatDate(acc.lastImportDate) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Transactions Widget */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <p className="text-xs text-gray-500 mt-0.5">Last 10 across all accounts</p>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              <p className="mt-2 text-sm">No transactions yet.</p>
              <Link to="/finance/bank-accounts" className="mt-2 inline-block text-sm text-primary-600 hover:text-primary-800">Import a statement</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Date</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Account</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Description</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">Amount</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{tx.date ? formatDate(tx.date) : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{tx.bankAccountName}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{tx.description}</span>
                        {tx.matchedTo && (
                          <span className="block text-xs text-gray-500 mt-0.5">{tx.matchedTo}</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}