import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { BankAccountDto, CompanyDto } from '@/types';
import { listBankAccounts, createBankAccount, updateBankAccount, deactivateBankAccount } from '@/api/bankAccounts';
import { listCompanies } from '@/api/companies';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

const CURRENCIES = ['MAD', 'EUR', 'USD', 'GBP', 'SAR', 'AED'];

export default function BankAccountsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'FINANCE';
  const isGlobalUser = !user?.companyId;

  const [accounts, setAccounts] = useState<BankAccountDto[]>([]);
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountDto | null>(null);
  const [companyId, setCompanyId] = useState<string>(user?.companyId ? String(user.companyId) : '');
  const [name, setName] = useState('');
  const [iban, setIban] = useState('');
  const [currency, setCurrency] = useState('MAD');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await listBankAccounts({ search: search || undefined, page, size: 20 });
      setAccounts(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, [page]);
  useEffect(() => {
    if (isGlobalUser) {
      listCompanies().then(res => setCompanies(res.data.filter(c => c.active))).catch(() => {});
    }
  }, [isGlobalUser]);

  const handleSearch = () => { setPage(0); fetchAccounts(); };

  const openCreate = () => {
    setEditingAccount(null);
    setCompanyId(user?.companyId ? String(user.companyId) : '');
    setName(''); setIban(''); setCurrency('MAD'); setOpeningBalance('0');
    setShowModal(true);
  };

  const openEdit = (a: BankAccountDto) => {
    setEditingAccount(a);
    setName(a.name); setIban(a.iban); setCurrency(a.currency);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !iban.trim()) return;
    setSaving(true); setError(null);
    try {
      if (editingAccount) {
        const updated = await updateBankAccount(editingAccount.id, {
          name: name.trim(),
          iban: iban.trim(),
          currency,
        });
        setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await createBankAccount({
          companyId: companyId ? Number(companyId) : null,
          name: name.trim(),
          iban: iban.trim(),
          currency,
          openingBalance: Number(openingBalance) || 0,
        });
        setAccounts(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch { setError('Failed to save bank account.'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (a: BankAccountDto) => {
    if (!confirm(`Deactivate "${a.name}"?`)) return;
    await deactivateBankAccount(a.id);
    setAccounts(prev => prev.filter(x => x.id !== a.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Bank Accounts</h2>
        {canEdit && (
          <button onClick={openCreate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">New Account</button>
        )}
      </div>

      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search bank accounts..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <button onClick={handleSearch} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">Search</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No bank accounts found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">IBAN</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Currency</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Balance</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900"><Link to={`/finance/bank-accounts/${a.id}`} className="hover:text-primary-600">{a.name}</Link></td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{a.iban}</td>
                  <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{a.currency}</span></td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(a.currentBalance)}</td>
                  <td className="px-4 py-3">{a.companyName ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{a.companyName}</span> : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(a)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                        <button onClick={() => handleDeactivate(a)} className="text-red-600 hover:text-red-800 text-sm font-medium">Deactivate</button>
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
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded border text-sm disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="px-3 py-1 rounded border text-sm disabled:opacity-50">Next</button>
        </div>
      )}

      {showModal && (
        <Modal title={editingAccount ? 'Edit Bank Account' : 'New Bank Account'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
            {isGlobalUser && !editingAccount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Global</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.key})</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IBAN *</label>
              <input value={iban} onChange={e => setIban(e.target.value)} placeholder="e.g. MA12345678901234567890123456" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {!editingAccount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
                <input type="number" step="0.01" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            )}
            {editingAccount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
                <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50">{formatCurrency(editingAccount.currentBalance)} {editingAccount.currency}</div>
                <p className="text-xs text-gray-400 mt-1">Balance is read-only and updated via statement imports.</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={saving || !name.trim() || !iban.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Spinner className="h-4 w-4" />}{editingAccount ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}