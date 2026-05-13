import { useState, useEffect, useCallback } from 'react';
import type { RaidItemDto } from '@/types';
import { listRaidItems, createRaidItem, updateRaidItem, deleteRaidItem } from '@/api/pmo';
import { riskColor, riskLabel, raidTypeColor, raidStatusBadge } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

export default function RaidTab({ projectId, canEdit }: { projectId: number; canEdit: boolean }) {
  const [items, setItems] = useState<RaidItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ type: 'RISK' as RaidItemDto['type'], title: '', description: '', probability: '', impact: '', mitigationPlan: '', status: 'OPEN' as RaidItemDto['status'], dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = filter !== 'ALL' ? filter : undefined;
      const data = await listRaidItems(projectId, typeParam);
      setItems(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [projectId, filter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true); setError(null);
    try {
      if (editId) {
        await updateRaidItem(projectId, editId, {
          type: form.type, title: form.title, description: form.description || undefined,
          status: form.status, probability: form.probability ? Number(form.probability) : undefined,
          impact: form.impact ? Number(form.impact) : undefined, mitigationPlan: form.mitigationPlan || undefined,
          dueDate: form.dueDate || undefined,
        });
      } else {
        await createRaidItem(projectId, {
          projectId, type: form.type, title: form.title, description: form.description || undefined,
          probability: form.probability ? Number(form.probability) : undefined,
          impact: form.impact ? Number(form.impact) : undefined,
          mitigationPlan: form.mitigationPlan || undefined, dueDate: form.dueDate || undefined,
        });
      }
      setShowForm(false); setEditId(null);
      setForm({ type: 'RISK', title: '', description: '', probability: '', impact: '', mitigationPlan: '', status: 'OPEN', dueDate: '' });
      fetchItems();
    } catch { setError('Failed to save RAID item.'); } finally { setSaving(false); }
  };

  const startEdit = (item: RaidItemDto) => {
    setEditId(item.id);
    setForm({
      type: item.type, title: item.title, description: item.description || '',
      probability: item.probability?.toString() || '', impact: item.impact?.toString() || '',
      mitigationPlan: item.mitigationPlan || '', status: item.status, dueDate: item.dueDate || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this RAID item?')) return;
    await deleteRaidItem(projectId, id);
    fetchItems();
  };

  const filtered = filter === 'ALL' ? items : items.filter(i => i.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-y-2">
        <div className="flex gap-2">
          {['ALL', 'RISK', 'ASSUMPTION', 'TASK', 'DEPENDENCY'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}</button>
          ))}
        </div>
        {canEdit && (
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ type: 'RISK', title: '', description: '', probability: '', impact: '', mitigationPlan: '', status: 'OPEN', dueDate: '' }); }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">+ Add Item</button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as RaidItemDto['type'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="RISK">Risk</option><option value="ASSUMPTION">Assumption</option><option value="TASK">Task</option><option value="DEPENDENCY">Dependency</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          {form.type === 'RISK' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Probability (1-5)</label>
                <input type="number" min="1" max="5" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Impact (1-5)</label>
                <input type="number" min="1" max="5" value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Mitigation Plan</label>
                <input type="text" value={form.mitigationPlan} onChange={e => setForm(f => ({ ...f, mitigationPlan: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          )}
          {editId && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as RaidItemDto['status'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="OPEN">Open</option><option value="MITIGATING">Mitigating</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option>
              </select>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" disabled={saving || !form.title} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No RAID items found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${raidTypeColor(item.type)}`}>{item.type}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${raidStatusBadge(item.status)}`}>{item.status}</span>
                    {item.type === 'RISK' && item.riskScore > 0 && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${riskColor(item.riskScore)}`}>{riskLabel(item.riskScore)} ({item.riskScore})</span>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                  {item.mitigationPlan && <p className="text-sm text-blue-600 mt-1"><span className="font-medium">Mitigation:</span> {item.mitigationPlan}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {item.ownerName && <span>Owner: {item.ownerName}</span>}
                    {item.dueDate && <span>Due: {item.dueDate}</span>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(item)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}