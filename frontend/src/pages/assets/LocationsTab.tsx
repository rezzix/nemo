import { useState, useEffect, useCallback } from 'react';
import type { LocationDto } from '@/types';
import { getLocationTree, createLocation, updateLocation, deleteLocation, listLocations } from '@/api/assets';
import { listCompanies } from '@/api/companies';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';

export default function LocationsTab({ isAdmin }: { isAdmin: boolean }) {
  const [tree, setTree] = useState<LocationDto[]>([]);
  const [flatLocations, setFlatLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDto | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      setTree(await getLocationTree());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchFlatLocations = useCallback(async () => {
    try {
      setFlatLocations(await listLocations());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchTree(); fetchFlatLocations(); }, [fetchTree, fetchFlatLocations]);

  const handleCreate = async (data: { name: string; description: string; parentId: number | null; companyId: number | null; order: number | null }) => {
    await createLocation(data);
    setShowCreate(false);
    fetchTree();
    fetchFlatLocations();
  };

  const handleUpdate = async (id: number, data: { name?: string; description?: string; parentId?: number | null; order?: number; active?: boolean }) => {
    await updateLocation(id, data);
    setEditingLocation(null);
    fetchTree();
    fetchFlatLocations();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this location?')) return;
    await deleteLocation(id);
    fetchTree();
    fetchFlatLocations();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Add Location
          </button>
        </div>
      )}

      {tree.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No locations found. {isAdmin && 'Click "Add Location" to create one.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {tree.map((loc) => (
            <LocationTreeItem
              key={loc.id}
              location={loc}
              depth={0}
              isAdmin={isAdmin}
              onEdit={setEditingLocation}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <LocationFormModal
          title="Add Location"
          flatLocations={flatLocations}
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingLocation && (
        <LocationFormModal
          title="Edit Location"
          flatLocations={flatLocations}
          initial={editingLocation}
          onSubmit={(data) => handleUpdate(editingLocation.id, data)}
          onClose={() => setEditingLocation(null)}
        />
      )}
    </div>
  );
}

function LocationTreeItem({ location, depth, isAdmin, onEdit, onDelete }: {
  location: LocationDto;
  depth: number;
  isAdmin: boolean;
  onEdit: (loc: LocationDto) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = location.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="shrink-0">
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-900">{location.name}</span>
          {location.description && <span className="ml-2 text-sm text-gray-500 truncate">{location.description}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {location.assetCount > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{location.assetCount} asset{location.assetCount !== 1 ? 's' : ''}</span>
          )}
          {!location.active && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactive</span>
          )}
          {location.companyName && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{location.companyName}</span>
          )}
          {isAdmin && (
            <>
              <button onClick={() => onEdit(location)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">Edit</button>
              <button onClick={() => onDelete(location.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Deactivate</button>
            </>
          )}
        </div>
      </div>
      {hasChildren && expanded && location.children.map((child) => (
        <LocationTreeItem
          key={child.id}
          location={child}
          depth={depth + 1}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function LocationFormModal({ title, flatLocations, initial, onSubmit, onClose }: {
  title: string;
  flatLocations: LocationDto[];
  initial?: LocationDto;
  onSubmit: (data: { name: string; description: string; parentId: number | null; companyId: number | null; order: number | null; active?: boolean }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [parentId, setParentId] = useState<number | null>(initial?.parentId ?? null);
  const [companyId, setCompanyId] = useState<number | null>(initial?.companyId ?? null);
  const [order, setOrder] = useState<string>(initial?.order?.toString() ?? '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const data: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        parentId: parentId ?? null,
        companyId: companyId ?? null,
        order: order ? parseInt(order) : null,
      };
      if (initial) {
        (data as Record<string, unknown>).active = active;
      }
      await onSubmit(data as Parameters<typeof onSubmit>[0]);
    } catch {
      setError('Failed to save location.');
    } finally {
      setSaving(false);
    }
  };

  // Flatten the tree for the parent dropdown, excluding self and descendants to prevent circular refs
  const availableParents = initial
    ? flatLocations.filter((l) => l.id !== initial.id)
    : flatLocations;

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Description" value={description} onChange={setDescription} textarea />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Location</label>
          <select value={parentId ?? ''} onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">None (root level)</option>
            {availableParents.map((l) => (
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
        <Field label="Order" value={order} onChange={setOrder} type="number" />
        {initial && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        )}
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