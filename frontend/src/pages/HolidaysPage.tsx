import { useState, useEffect, useCallback } from 'react';
import { listHolidays, createHoliday, updateHoliday, deleteHoliday } from '@/api/holidays';
import { listCompanies } from '@/api/companies';
import type { HolidayDto, CompanyDto, CreateHolidayRequest } from '@/types';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';

export default function HolidaysPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState<HolidayDto[]>([]);
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editName, setEditName] = useState('');
  const [editCompanyId, setEditCompanyId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try { setHolidays(await listHolidays({ year })); } catch {} finally { setLoading(false); }
  }, [year]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);
  useEffect(() => { listCompanies().then((res) => setCompanies(res.data)).catch(() => {}); }, []);

  const handleCreate = async (request: CreateHolidayRequest) => {
    setSaving(true);
    setError(null);
    try {
      await createHoliday(request);
      setShowCreate(false);
      fetchHolidays();
    } catch { setError('Failed to create holiday.'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateHoliday(editingId, { date: editDate, name: editName.trim(), companyId: editCompanyId });
      setEditingId(null);
      fetchHolidays();
    } catch { setError('Failed to update holiday.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this holiday?')) return;
    await deleteHoliday(id);
    fetchHolidays();
  };

  const startEdit = (h: HolidayDto) => {
    setEditingId(h.id);
    setEditDate(h.date);
    setEditName(h.name);
    setEditCompanyId(h.companyId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Public Holidays</h2>
        <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          Add Holiday
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

      <div className="flex items-center gap-3">
        <button onClick={() => setYear(year - 1)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-semibold text-gray-900">{year}</span>
        <button onClick={() => setYear(year + 1)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
        {year !== new Date().getFullYear() && (
          <button onClick={() => setYear(new Date().getFullYear())} className="text-xs text-primary-600 hover:text-primary-800 font-medium ml-1">Current year</button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : holidays.length === 0 ? (
        <p className="text-sm text-gray-500">No holidays defined for {year}.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Scope</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {holidays.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  {editingId === h.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full" />
                      </td>
                      <td className="px-4 py-3">
                        <select value={editCompanyId ?? ''} onChange={(e) => setEditCompanyId(e.target.value ? Number(e.target.value) : null)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                          <option value="">Global</option>
                          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={handleUpdate} disabled={saving} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-700">{new Date(h.date + 'T00:00:00').toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.companyId ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {h.companyName || 'Global'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(h)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(h.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateHolidayModal
          companies={companies}
          onSave={handleCreate}
          onClose={() => { setShowCreate(false); setError(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}

function CreateHolidayModal({ companies, onSave, onClose, saving }: {
  companies: CompanyDto[];
  onSave: (request: CreateHolidayRequest) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name.trim()) return;
    onSave({ date, name: name.trim(), companyId: companyId || undefined });
  };

  return (
    <Modal title="Add Holiday" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Holiday name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
          <select value={companyId ?? ''} onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Global (all companies)</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || !date || !name.trim()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Create
          </button>
        </div>
      </form>
    </Modal>
  );
}