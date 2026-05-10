import { useState, useEffect, useCallback } from 'react';
import type { AssetDto, AssetType, AssetStatus, LocationDto } from '@/types';
import { listAssets, createAsset, updateAsset, assignAsset, unassignAsset, deleteAsset, listLocations } from '@/api/assets';
import { listCompanies } from '@/api/companies';
import { listAllUsers } from '@/api/users';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';
import { formatDate } from '@/utils/format';

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'COMPUTER', label: 'Computer' },
  { value: 'SERVER', label: 'Server' },
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'MICROWAVE', label: 'Microwave' },
  { value: 'OTHER', label: 'Other' },
];

const ASSET_STATUSES: { value: AssetStatus; label: string }[] = [
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RETIRED', label: 'Retired' },
];

const statusColor = (status: AssetStatus) => {
  switch (status) {
    case 'IN_STOCK': return 'bg-gray-100 text-gray-700';
    case 'IN_USE': return 'bg-blue-100 text-blue-700';
    case 'ASSIGNED': return 'bg-green-100 text-green-700';
    case 'MAINTENANCE': return 'bg-amber-100 text-amber-700';
    case 'RETIRED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const typeLabel = (type: AssetType) => ASSET_TYPES.find(t => t.value === type)?.label ?? type;

export default function AssetsTab({ isAdmin }: { isAdmin: boolean }) {
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetDto | null>(null);
  const [assigningAsset, setAssigningAsset] = useState<AssetDto | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      setAssets(await listAssets({
        type: filterType || undefined,
        status: filterStatus || undefined,
      }));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filterType, filterStatus]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const handleCreate = async (data: Record<string, unknown>) => {
    await createAsset(data as Parameters<typeof createAsset>[0]);
    setShowCreate(false);
    fetchAssets();
  };

  const handleUpdate = async (id: number, data: Record<string, unknown>) => {
    await updateAsset(id, data as Parameters<typeof updateAsset>[1]);
    setEditingAsset(null);
    fetchAssets();
  };

  const handleAssign = async (assetId: number, userId: number) => {
    await assignAsset(assetId, { userId });
    setAssigningAsset(null);
    fetchAssets();
  };

  const handleUnassign = async (id: number) => {
    await unassignAsset(id);
    fetchAssets();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this asset?')) return;
    await deleteAsset(id);
    fetchAssets();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All Types</option>
          {ASSET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All Statuses</option>
          {ASSET_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="ml-auto bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Add Asset
          </button>
        )}
      </div>

      {assets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No assets found. {isAdmin && 'Click "Add Asset" to create one.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Identifier</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Assigned To</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{asset.identifier || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{typeLabel(asset.type)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(asset.status)}`}>
                      {ASSET_STATUSES.find(s => s.value === asset.status)?.label ?? asset.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{asset.locationName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{asset.userName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{asset.companyName || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {asset.userId ? (
                        <button onClick={() => handleUnassign(asset.id)} className="text-xs text-amber-600 hover:text-amber-800 font-medium">Unassign</button>
                      ) : (
                        <button onClick={() => setAssigningAsset(asset)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">Assign</button>
                      )}
                      {isAdmin && (
                        <>
                          <button onClick={() => setEditingAsset(asset)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">Edit</button>
                          <button onClick={() => handleDelete(asset.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Deactivate</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <AssetFormModal title="Add Asset" onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      )}

      {editingAsset && (
        <AssetFormModal
          title="Edit Asset"
          initial={editingAsset}
          onSubmit={(data) => handleUpdate(editingAsset.id, data)}
          onClose={() => setEditingAsset(null)}
        />
      )}

      {assigningAsset && (
        <AssignModal
          asset={assigningAsset}
          onAssign={(userId) => handleAssign(assigningAsset.id, userId)}
          onClose={() => setAssigningAsset(null)}
        />
      )}
    </div>
  );
}

function AssetFormModal({ title, initial, onSubmit, onClose }: {
  title: string;
  initial?: AssetDto;
  onSubmit: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [type, setType] = useState<AssetType>(initial?.type ?? 'COMPUTER');
  const [identifier, setIdentifier] = useState(initial?.identifier ?? '');
  const [status, setStatus] = useState<AssetStatus>(initial?.status ?? 'IN_STOCK');
  const [locationId, setLocationId] = useState<number | null>(initial?.locationId ?? null);
  const [companyId, setCompanyId] = useState<number | null>(initial?.companyId ?? null);
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? '');
  const [purchaseCost, setPurchaseCost] = useState(initial?.purchaseCost?.toString() ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    listLocations().then(setLocations).catch(() => {});
    listCompanies().then(setCompanies).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        type,
        identifier: identifier.trim() || null,
        status,
        locationId: locationId ?? null,
        companyId: companyId ?? null,
        purchaseDate: purchaseDate || null,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
        notes: notes.trim() || null,
      });
    } catch {
      setError('Failed to save asset.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Description" value={description} onChange={setDescription} textarea />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as AssetType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            {ASSET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <Field label="Identifier / Serial Number" value={identifier} onChange={setIdentifier} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as AssetStatus)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            {ASSET_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select value={locationId ?? ''} onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">None</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.parentName ? `${l.parentName} / ` : ''}{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <select value={companyId ?? ''} onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Global</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Field label="Purchase Date" value={purchaseDate} onChange={setPurchaseDate} type="date" />
        <Field label="Purchase Cost" value={purchaseCost} onChange={setPurchaseCost} type="number" />
        <Field label="Notes" value={notes} onChange={setNotes} textarea />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || !name.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignModal({ asset, onAssign, onClose }: {
  asset: AssetDto;
  onAssign: (userId: number) => void;
  onClose: () => void;
}) {
  const [userId, setUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAllUsers().then((data) => setUsers(data.map((u: { id: number; firstName: string; lastName: string }) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName })))).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await onAssign(userId);
    } catch {
      setError('Failed to assign asset.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Assign "${asset.name}"`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign to user</label>
          <select value={userId ?? ''} onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Select a user...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || !userId} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Assign
          </button>
        </div>
      </form>
    </Modal>
  );
}