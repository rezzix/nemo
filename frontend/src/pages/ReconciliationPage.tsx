import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { UnreconciledTransactionDto, UnmatchedPaymentDto } from '@/types';
import { getReconciliationView, suggestMatches, reconcile, unreconcile, getUnreconciledCount } from '@/api/reconciliation';
import { formatCurrency, formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

const statusBadge: Record<string, string> = {
  NEW: 'bg-yellow-100 text-yellow-800',
  RECONCILED: 'bg-green-100 text-green-800',
  IGNORED: 'bg-gray-100 text-gray-600',
};

const paymentStatusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export default function ReconciliationPage() {
  const [activeTab, setActiveTab] = useState<'unreconciled' | 'reconciled'>('unreconciled');
  const [transactions, setTransactions] = useState<UnreconciledTransactionDto[]>([]);
  const [reconciledTransactions, setReconciledTransactions] = useState<UnreconciledTransactionDto[]>([]);
  const [unmatchedPayments, setUnmatchedPayments] = useState<UnmatchedPaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTx, setSelectedTx] = useState<UnreconciledTransactionDto | null>(null);
  const [suggestions, setSuggestions] = useState<UnmatchedPaymentDto[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [externalNote, setExternalNote] = useState('');
  const [unreconciledCount, setUnreconciledCount] = useState<number>(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [view, reconciled] = await Promise.all([
        getReconciliationView(),
        getReconciledTransactions(),
      ]);
      setTransactions(view.transactions);
      setUnmatchedPayments(view.unmatchedPayments);
      setUnreconciledCount(view.unreconciledCount);
      setReconciledTransactions(reconciled);
    } catch (err) {
      setError('Failed to load reconciliation data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectTx = async (tx: UnreconciledTransactionDto) => {
    setSelectedTx(tx);
    setSuggestions([]);
    if (tx.status === 'NEW') {
      setLoadingSuggestions(true);
      try {
        const matches = await suggestMatches(tx.id);
        setSuggestions(matches);
      } catch (err) {
        console.error('Failed to load suggestions', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }
  };

  const handleReconcileWithPayment = async (paymentId: number) => {
    if (!selectedTx) return;
    try {
      setActionLoading(true);
      const updated = await reconcile(selectedTx.id, { paymentId });
      setTransactions(prev => prev.filter(t => t.id !== updated.id));
      setUnmatchedPayments(prev => prev.filter(p => p.id !== paymentId));
      setSelectedTx(null);
      setSuggestions([]);
      const countData = await getUnreconciledCount();
      setUnreconciledCount(countData.count);
    } catch (err) {
      console.error('Failed to reconcile', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReconcileAsExternal = async () => {
    if (!selectedTx || !externalNote.trim()) return;
    try {
      setActionLoading(true);
      const updated = await reconcile(selectedTx.id, { externalNote: externalNote.trim() });
      setTransactions(prev => prev.filter(t => t.id !== updated.id));
      setSelectedTx(null);
      setSuggestions([]);
      setShowExternalModal(false);
      setExternalNote('');
      const countData = await getUnreconciledCount();
      setUnreconciledCount(countData.count);
    } catch (err) {
      console.error('Failed to reconcile as external', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleIgnore = async (tx: UnreconciledTransactionDto) => {
    try {
      setActionLoading(true);
      await reconcile(tx.id, { externalNote: 'Ignored' });
      setTransactions(prev => prev.filter(t => t.id !== tx.id));
      if (selectedTx?.id === tx.id) {
        setSelectedTx(null);
        setSuggestions([]);
      }
      const countData = await getUnreconciledCount();
      setUnreconciledCount(countData.count);
    } catch (err) {
      console.error('Failed to ignore transaction', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnreconcile = async (tx: UnreconciledTransactionDto) => {
    if (!confirm(`Unreconcile "${tx.description}"? This will mark the payment as unmatched again.`)) return;
    try {
      setActionLoading(true);
      await unreconcile(tx.id);
      setReconciledTransactions(prev => prev.filter(t => t.id !== tx.id));
      setSelectedTx(null);
      const countData = await getUnreconciledCount();
      setUnreconciledCount(countData.count);
    } catch (err) {
      console.error('Failed to unreconcile', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/finance/bank-accounts" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Bank Accounts
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reconciliation</h1>
            <p className="text-sm text-gray-500 mt-1">
              Match bank transactions to project payments or mark as external
            </p>
          </div>
          {unreconciledCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {unreconciledCount} unreconciled
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('unreconciled'); setSelectedTx(null); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'unreconciled'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Unreconciled
          {unreconciledCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {unreconciledCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('reconciled'); setSelectedTx(null); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'reconciled'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Reconciled
          {reconciledTransactions.length > 0 && (
            <span className="ml-2 text-xs text-gray-400">({reconciledTransactions.length})</span>
          )}
        </button>
      </div>

      {activeTab === 'unreconciled' ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Unreconciled Transactions</h2>
            <p className="text-xs text-gray-500 mt-0.5">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''} awaiting reconciliation</p>
          </div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No unreconciled transactions. All caught up!</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {transactions.map(tx => (
                <button
                  key={tx.id}
                  onClick={() => handleSelectTx(tx)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedTx?.id === tx.id ? 'bg-primary-50 border-l-2 border-primary-600' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">{tx.description}</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{formatDate(tx.date)}</span>
                        {tx.bankAccountName && <span>{tx.bankAccountName}</span>}
                        {tx.reference && <span className="font-mono">{tx.reference}</span>}
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <div className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </div>
                      <div className="text-xs text-gray-500">{tx.currency}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right panel: details + suggestions */}
        <div className="space-y-4">
          {selectedTx ? (
            <>
              {/* Selected transaction detail */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Transaction Detail</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-xs text-gray-500">Description</span>
                    <p className="text-sm font-medium text-gray-900">{selectedTx.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-gray-500">Amount</span>
                      <p className={`text-sm font-semibold ${selectedTx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedTx.amount >= 0 ? '+' : ''}{formatCurrency(selectedTx.amount)} {selectedTx.currency}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Date</span>
                      <p className="text-sm text-gray-900">{formatDate(selectedTx.date)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Account</span>
                      <p className="text-sm text-gray-900">{selectedTx.bankAccountName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Reference</span>
                      <p className="text-sm text-gray-900 font-mono">{selectedTx.reference || '—'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => setShowExternalModal(true)}
                      disabled={actionLoading}
                      className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                    >
                      Mark as External
                    </button>
                    <button
                      onClick={() => handleIgnore(selectedTx)}
                      disabled={actionLoading}
                      className="w-full bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      Ignore Transaction
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggested matches */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Suggested Matches</h3>
                </div>
                {loadingSuggestions ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No matching payments found. Try marking as external.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {suggestions.map(payment => (
                      <div key={payment.id} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{payment.title}</p>
                            <p className="text-xs text-gray-500">{payment.projectName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{formatDate(payment.dueDate || payment.receivedDate || '')}</span>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${paymentStatusBadge[payment.status] || 'bg-gray-100 text-gray-600'}`}>
                                {payment.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-gray-500">{payment.currency}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleReconcileWithPayment(payment.id)}
                          disabled={actionLoading}
                          className="mt-2 w-full bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                        >
                          Link Payment
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All unmatched payments (manual selection) */}
              {unmatchedPayments.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">All Unmatched Payments</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{unmatchedPayments.length} payment{unmatchedPayments.length !== 1 ? 's' : ''} not yet reconciled</p>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {unmatchedPayments
                      .filter(p => !suggestions.some(s => s.id === p.id))
                      .map(payment => (
                        <div key={payment.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{payment.title}</p>
                              <p className="text-xs text-gray-500">{payment.projectName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{formatDate(payment.dueDate || payment.receivedDate || '')}</span>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${paymentStatusBadge[payment.status] || 'bg-gray-100 text-gray-600'}`}>
                                  {payment.status}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                              <p className="text-xs text-gray-500">{payment.currency}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleReconcileWithPayment(payment.id)}
                            disabled={actionLoading}
                            className="mt-2 w-full bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                          >
                            Link Payment
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">Select a transaction to see suggested matches and reconciliation options</p>
            </div>
          )}
        </div>
      </div>
      ) : (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Reconciled Transactions</h2>
          <p className="text-xs text-gray-500 mt-0.5">{reconciledTransactions.length} transaction{reconciledTransactions.length !== 1 ? 's' : ''}</p>
        </div>
        {reconciledTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No reconciled transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Matched To</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Account</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {reconciledTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{tx.description}</td>
                    <td className={`px-4 py-3 text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {tx.projectPaymentTitle ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          {tx.projectPaymentTitle}
                        </span>
                      ) : tx.externalNote ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                          External
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{tx.bankAccountName || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleUnreconcile(tx)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        Unreconcile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* External note modal */}
      {showExternalModal && selectedTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExternalModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark as External</h3>
            <p className="text-sm text-gray-500 mb-4">
              Transaction: <span className="font-medium text-gray-700">{selectedTx.description}</span> — {formatCurrency(selectedTx.amount)} {selectedTx.currency}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={externalNote}
                onChange={e => setExternalNote(e.target.value)}
                placeholder="e.g. Office rent, utility bill, tax payment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowExternalModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button
                onClick={handleReconcileAsExternal}
                disabled={!externalNote.trim() || actionLoading}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}