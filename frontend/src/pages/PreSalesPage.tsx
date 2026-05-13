import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { PreSaleDto, PreSaleStage, ClientDto } from '@/types';
import { listPreSales, createPreSale } from '@/api/presales';
import { listClients } from '@/api/clients';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, preSaleStageLabel, preSaleStageBadge, formatCurrency } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

const STAGES: PreSaleStage[] = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export default function PreSalesPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'EXECUTIVE';

  const [presales, setPresales] = useState<PreSaleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPreSales = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, size: 20 };
      if (search) params.search = search;
      if (stageFilter) params.stage = stageFilter;
      const res = await listPreSales(params);
      setPresales(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPreSales(); }, [page]);

  const handleSearch = () => { setPage(0); fetchPreSales(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Pre-Sales</h2>
        {canEdit && (
          <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">New Pre-Sale</button>
        )}
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search pre-sales..." className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <select value={stageFilter} onChange={e => { setStageFilter(e.target.value); setPage(0); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{preSaleStageLabel(s)}</option>)}
        </select>
        <button onClick={handleSearch} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">Search</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>
      ) : presales.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No pre-sales found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Key</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Stage</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Est. Value</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Probability</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Close Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Manager</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {presales.map(ps => (
                <tr key={ps.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{ps.key}</td>
                  <td className="px-4 py-3"><Link to={`/presales/${ps.id}`} className="font-medium text-gray-900 hover:text-primary-600">{ps.name}</Link></td>
                  <td className="px-4 py-3 text-gray-600">{ps.clientName || '—'}</td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${preSaleStageBadge(ps.stage)}`}>{preSaleStageLabel(ps.stage)}</span></td>
                  <td className="px-4 py-3 text-gray-600">{ps.estimatedValue ? formatCurrency(Number(ps.estimatedValue)) : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{ps.probability != null ? `${ps.probability}%` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{ps.expectedCloseDate ? formatDate(ps.expectedCloseDate) : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{ps.managerName}</td>
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

      {showCreate && <CreatePreSaleModal onClose={() => setShowCreate(false)} onCreated={(ps) => { setPresales(prev => [ps, ...prev]); setShowCreate(false); }} />}
    </div>
  );
}

function CreatePreSaleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (ps: PreSaleDto) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<string>('LEAD');
  const [clientId, setClientId] = useState<number | ''>('');
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [probability, setProbability] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listClients({ size: 200 }).then(res => setClients(res.data)).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;
    setSaving(true); setError(null);
    try {
      const ps = await createPreSale({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description || undefined,
        stage,
        clientId: clientId || undefined,
        estimatedValue: estimatedValue || undefined,
        probability: probability ? Number(probability) : undefined,
        expectedCloseDate: expectedCloseDate || undefined,
        managerId: user!.id,
      });
      onCreated(ps);
    } catch { setError('Failed to create pre-sale.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="New Pre-Sale" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key *</label>
            <input value={key} onChange={e => setKey(e.target.value)} maxLength={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select value={clientId} onChange={e => setClientId(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">No client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select value={stage} onChange={e => setStage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {STAGES.map(s => <option key={s} value={s}>{preSaleStageLabel(s)}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value</label>
            <input type="text" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} placeholder="e.g. 50000" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
            <input type="number" min="0" max="100" value={probability} onChange={e => setProbability(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
          <input type="date" value={expectedCloseDate} onChange={e => setExpectedCloseDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || !name.trim() || !key.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Create
          </button>
        </div>
      </form>
    </Modal>
  );
}