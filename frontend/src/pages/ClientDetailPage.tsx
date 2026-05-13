import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { ClientDto, ClientContactDto, CompanyDto } from '@/types';
import { getClient, updateClient, deleteClient, getClientContacts, addClientContact, updateClientContact, deleteClientContact } from '@/api/clients';
import { listCompanies } from '@/api/companies';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'EXECUTIVE';

  const [client, setClient] = useState<ClientDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContactDto | null>(null);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [clientCompanyId, setClientCompanyId] = useState('');
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getClient(Number(id)).then(setClient).finally(() => setLoading(false));
    listCompanies().then((res) => setCompanies(res.data.filter((c) => c.active))).catch(() => {});
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!client) return <div className="text-center text-gray-500 py-8">Client not found.</div>;

  const isGlobalUser = !user?.companyId;
  const availableCompanies = isGlobalUser ? companies : companies.filter((c) => c.id === user?.companyId);

  const openEdit = () => {
    setName(client.name); setIndustry(client.industry || ''); setWebsite(client.website || ''); setNotes(client.notes || '');
    setClientCompanyId(client.companyId ? String(client.companyId) : '');
    setShowEditModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const updated = await updateClient(client.id, {
        name: name.trim(), industry: industry || undefined, website: website || undefined, notes: notes || undefined,
        companyId: clientCompanyId ? Number(clientCompanyId) : null,
        clearCompany: !clientCompanyId,
      });
      setClient(updated);
      setShowEditModal(false);
    } catch { setError('Failed to save.'); }
    finally { setSaving(false); }
  };

  const openAddContact = () => {
    setEditingContact(null);
    setContactName(''); setContactEmail(''); setContactPhone(''); setContactRole('');
    setShowContactModal(true);
  };

  const openEditContact = (c: ClientContactDto) => {
    setEditingContact(c);
    setContactName(c.name); setContactEmail(c.email || ''); setContactPhone(c.phone || ''); setContactRole(c.role || '');
    setShowContactModal(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;
    setSaving(true); setError(null);
    try {
      if (editingContact) {
        const updated = await updateClientContact(client.id, editingContact.id, {
          name: contactName.trim(), email: contactEmail || undefined, phone: contactPhone || undefined, role: contactRole || undefined,
        });
        setClient(prev => prev ? { ...prev, contacts: prev.contacts.map(c => c.id === updated.id ? updated : c) } : prev);
      } else {
        const created = await addClientContact(client.id, {
          name: contactName.trim(), email: contactEmail || undefined, phone: contactPhone || undefined, role: contactRole || undefined,
        });
        setClient(prev => prev ? { ...prev, contacts: [...prev.contacts, created] } : prev);
      }
      setShowContactModal(false);
    } catch { setError('Failed to save contact.'); }
    finally { setSaving(false); }
  };

  const handleDeleteContact = async (c: ClientContactDto) => {
    if (!confirm(`Delete contact "${c.name}"?`)) return;
    await deleteClientContact(client.id, c.id);
    setClient(prev => prev ? { ...prev, contacts: prev.contacts.filter(x => x.id !== c.id) } : prev);
  };

  const handleDeleteClient = async () => {
    if (!confirm(`Delete client "${client.name}"? This cannot be undone.`)) return;
    await deleteClient(client.id);
    window.history.back();
  };

  return (
    <div className="space-y-6">
      <Link to="/clients" className="text-sm text-primary-600 hover:text-primary-800">&larr; Back to Clients</Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
            {client.industry && <p className="text-gray-500 text-sm mt-1">{client.industry}</p>}
            {client.website && <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm">{client.website}</a>}
            <p className="text-xs text-gray-400 mt-1">{client.companyName ? `Company: ${client.companyName}` : 'Global client'}</p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button onClick={openEdit} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Edit</button>
              {user?.role === 'ADMIN' && (
                <button onClick={handleDeleteClient} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
              )}
            </div>
          )}
        </div>
        {client.notes && <p className="text-gray-600 text-sm mt-3 whitespace-pre-wrap">{client.notes}</p>}
        <div className="text-xs text-gray-400 mt-3">Created {formatDate(client.createdAt)}</div>
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Contacts ({client.contacts.length})</h3>
          {canEdit && (
            <button onClick={openAddContact} className="text-sm text-primary-600 hover:text-primary-800 font-medium">+ Add Contact</button>
          )}
        </div>
        {client.contacts.length === 0 ? (
          <p className="text-gray-500 text-sm p-5">No contacts yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-2 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">Role</th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">Phone</th>
              {canEdit && <th className="px-4 py-2"></th>}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {client.contacts.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-2 text-gray-600">{c.role || '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{c.email ? <a href={`mailto:${c.email}`} className="text-primary-600 hover:underline">{c.email}</a> : '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{c.phone || '—'}</td>
                  {canEdit && (
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => openEditContact(c)} className="text-primary-600 hover:text-primary-800 text-xs font-medium mr-2">Edit</button>
                      <button onClick={() => handleDeleteContact(c)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showEditModal && (
        <Modal title="Edit Client" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select value={clientCompanyId} onChange={(e) => setClientCompanyId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Global</option>
                {availableCompanies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.key})</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Industry</label><input value={industry} onChange={e => setIndustry(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Website</label><input value={website} onChange={e => setWebsite(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">{saving && <Spinner className="h-4 w-4" />}Save</button>
            </div>
          </form>
        </Modal>
      )}

      {showContactModal && (
        <Modal title={editingContact ? 'Edit Contact' : 'Add Contact'} onClose={() => setShowContactModal(false)}>
          <form onSubmit={handleSaveContact} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={contactName} onChange={e => setContactName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><input value={contactRole} onChange={e => setContactRole(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowContactModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={saving || !contactName.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">{saving && <Spinner className="h-4 w-4" />}{editingContact ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}