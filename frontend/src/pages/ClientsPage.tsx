import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ClientDto, CompanyDto } from '@/types';
import { listClients, createClient, updateClient, deleteClient } from '@/api/clients';
import { listCompanies } from '@/api/companies';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

export default function ClientsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'EXECUTIVE';

  const [clients, setClients] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientDto | null>(null);
  const [companies, setCompanies] = useState<CompanyDto[]>([]);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [clientCompanyId, setClientCompanyId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await listClients({ search: search || undefined, page, size: 20 });
      setClients(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, [page]);

  useEffect(() => {
    listCompanies().then((res) => setCompanies(res.data.filter((c) => c.active))).catch(() => {});
  }, []);

  const handleSearch = () => { setPage(0); fetchClients(); };

  const isGlobalUser = !user?.companyId;
  const availableCompanies = isGlobalUser ? companies : companies.filter((c) => c.id === user?.companyId);

  const openCreate = () => {
    setEditingClient(null);
    setName(''); setIndustry(''); setWebsite(''); setNotes('');
    setClientCompanyId(user?.companyId ? String(user.companyId) : '');
    setShowModal(true);
  };

  const openEdit = (c: ClientDto) => {
    setEditingClient(c);
    setName(c.name); setIndustry(c.industry || ''); setWebsite(c.website || ''); setNotes(c.notes || '');
    setClientCompanyId(c.companyId ? String(c.companyId) : '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError(null);
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, {
          name: name.trim(), industry: industry || undefined, website: website || undefined, notes: notes || undefined,
          companyId: clientCompanyId ? Number(clientCompanyId) : null,
          clearCompany: !clientCompanyId,
        });
        setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await createClient({ name: name.trim(), industry: industry || undefined, website: website || undefined, notes: notes || undefined, companyId: clientCompanyId ? Number(clientCompanyId) : null });
        setClients(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch { setError('Failed to save client.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c: ClientDto) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    await deleteClient(c.id);
    setClients(prev => prev.filter(x => x.id !== c.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
        {canEdit && (
          <button onClick={openCreate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">New Client</button>
        )}
      </div>

      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search clients..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <button onClick={handleSearch} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">Search</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No clients found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Industry</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Website</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Contacts</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900"><Link to={`/clients/${c.id}`} className="hover:text-primary-600">{c.name}</Link></td>
                  <td className="px-4 py-3">{c.companyName ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{c.companyName}</span> : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Global</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{c.industry || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.website ? <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{c.website}</a> : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.contacts.length}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(c)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                        {user?.role === 'ADMIN' && (
                          <button onClick={() => handleDelete(c)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                        )}
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
        <Modal title={editingClient ? 'Edit Client' : 'New Client'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select value={clientCompanyId} onChange={(e) => setClientCompanyId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Global</option>
                {availableCompanies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.key})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input value={industry} onChange={e => setIndustry(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input value={website} onChange={e => setWebsite(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={saving || !name.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Spinner className="h-4 w-4" />}{editingClient ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}