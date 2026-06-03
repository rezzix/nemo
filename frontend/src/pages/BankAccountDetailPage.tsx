import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { BankAccountDto, BankTransactionDto } from '@/types';
import { getBankAccount } from '@/api/bankAccounts';
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from '@/api/bankTransactions';
import { importStatement } from '@/api/bankStatements';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

const CURRENCIES = ['MAD', 'EUR', 'USD', 'GBP', 'SAR', 'AED'];

const statusBadge: Record<string, string> = {
  NEW: 'bg-yellow-100 text-yellow-800',
  RECONCILED: 'bg-green-100 text-green-800',
  IGNORED: 'bg-gray-100 text-gray-600',
};

const statusLabel: Record<string, string> = {
  NEW: 'New',
  RECONCILED: 'Reconciled',
  IGNORED: 'Ignored',
};

export default function BankAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canEdit = user?.role === 'FINANCE';

  const [account, setAccount] = useState<BankAccountDto | null>(null);
  const [transactions, setTransactions] = useState<BankTransactionDto[]>([]);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [loadingTx, setLoadingTx] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<BankTransactionDto | null>(null);
  const [txDate, setTxDate] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCurrency, setTxCurrency] = useState('MAD');
  const [txReference, setTxReference] = useState('');
  const [txStatus, setTxStatus] = useState('NEW');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount: number; matched: boolean; warning: string | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accountId = Number(id);

  useEffect(() => {
    setLoadingAccount(true);
    getBankAccount(accountId)
      .then(setAccount)
      .catch(() => setAccount(null))
      .finally(() => setLoadingAccount(false));
  }, [accountId]);

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const res = await listTransactions(accountId, { page, size: 20 });
      setTransactions(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch { /* ignore */ }
    finally { setLoadingTx(false); }
  };

  useEffect(() => { fetchTransactions(); }, [accountId, page]);

  const openCreate = () => {
    setEditingTx(null);
    setTxDate(new Date().toISOString().slice(0, 10));
    setTxDescription(''); setTxAmount(''); setTxCurrency(account?.currency || 'MAD'); setTxReference('');
    setShowModal(true);
  };

  const openEdit = (tx: BankTransactionDto) => {
    setEditingTx(tx);
    setTxDescription(tx.description);
    setTxReference(tx.reference || '');
    setTxStatus(tx.status);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      if (editingTx) {
        const updated = await updateTransaction(accountId, editingTx.id, {
          description: txDescription.trim() || undefined,
          reference: txReference || undefined,
          status: txStatus || undefined,
        });
        setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        if (!txDate || !txDescription.trim() || !txAmount) return;
        const created = await createTransaction(accountId, {
          date: txDate,
          description: txDescription.trim(),
          amount: Number(txAmount),
          currency: txCurrency,
          reference: txReference || undefined,
        });
        setTransactions(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch { setError('Failed to save transaction.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (tx: BankTransactionDto) => {
    if (!confirm(`Delete transaction "${tx.description}"?`)) return;
    await deleteTransaction(accountId, tx.id);
    setTransactions(prev => prev.filter(t => t.id !== tx.id));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importStatement(accountId, file);
      setImportResult(result);
      fetchTransactions();
    } catch { setError('Failed to import statement. Please check the file and try again.'); }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  if (loadingAccount) {
    return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  }

  if (!account) {
    return <div className="p-6 text-center text-gray-500">Bank account not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/finance/bank-accounts" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Bank Accounts
      </Link>

      {/* Account header card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{account.name}</h1>
              <p className="text-sm text-gray-500 font-mono mt-1">{account.iban}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{account.currency}</span>
              {account.companyName && (
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{account.companyName}</span>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(account.currentBalance)}</span>
            <span className="text-sm text-gray-500">{account.currency}</span>
          </div>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className={`rounded-xl border p-4 ${importResult.matched ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${importResult.matched ? 'text-green-800' : 'text-yellow-800'}`}>
                {importResult.importedCount} transaction{importResult.importedCount !== 1 ? 's' : ''} imported successfully
              </p>
              {importResult.warning && (
                <p className="text-sm mt-1 text-yellow-700">{importResult.warning}</p>
              )}
            </div>
            <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Transactions section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
          {canEdit && (
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleImport} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5">
                {importing ? <><Spinner className="h-4 w-4" />Importing...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Import PDF</>}
              </button>
              <button onClick={openCreate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Add Transaction</button>
            </div>
          )}
        </div>

        {loadingTx ? (
          <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Currency</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Reference</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{tx.description}</div>
                      {(tx.projectPaymentTitle || tx.externalNote) && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {tx.projectPaymentTitle && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              {tx.projectPaymentTitle}
                            </span>
                          )}
                          {tx.externalNote && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                              External: {tx.externalNote}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{tx.currency}</span></td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{tx.reference || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[tx.status] || ''}`}>
                        {statusLabel[tx.status] || tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit(tx)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                          <button onClick={() => handleDelete(tx)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded border text-sm disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="px-3 py-1 rounded border text-sm disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editingTx ? 'Edit Transaction' : 'Add Transaction'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
            {!editingTx && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <input value={txDescription} onChange={e => setTxDescription(e.target.value)} placeholder="e.g. Client payment, Office rent" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount * <span className="text-gray-400 font-normal">(negative for debit)</span></label>
                  <input type="number" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="e.g. 50000 or -15000" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={txCurrency} onChange={e => setTxCurrency(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <input value={txReference} onChange={e => setTxReference(e.target.value)} placeholder="e.g. TRF-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono" />
                </div>
              </>
            )}
            {editingTx && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input value={txDescription} onChange={e => setTxDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <input value={txReference} onChange={e => setTxReference(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={txStatus} onChange={e => setTxStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="NEW">New</option>
                    <option value="RECONCILED">Reconciled</option>
                    <option value="IGNORED">Ignored</option>
                  </select>
                </div>
              </>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Spinner className="h-4 w-4" />}{editingTx ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}