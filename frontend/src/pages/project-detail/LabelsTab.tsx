import { useState, useEffect, useCallback } from 'react';
import type { LabelDto } from '@/types';
import { getLabels, createLabel, updateLabel, deleteLabel } from '@/api/projects';
import Spinner from '@/components/common/Spinner';

export default function LabelsTab({ projectId, canEdit }: { projectId: number; canEdit: boolean }) {
  const [labels, setLabels] = useState<LabelDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try { setLabels(await getLabels(projectId)); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createLabel(projectId, { name: newName.trim(), color: newColor });
    setNewName('');
    setNewColor('#6366f1');
    fetchLabels();
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    await updateLabel(projectId, id, { name: editName.trim(), color: editColor });
    setEditingId(null);
    fetchLabels();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this label?')) return;
    await deleteLabel(projectId, id);
    fetchLabels();
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Label name..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer" />
            </div>
            <button onClick={handleCreate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Add</button>
          </div>
        </div>
      )}

      {loading ? <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Color</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                {canEdit && <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labels.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {editingId === l.id ? (
                      <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
                    ) : (
                      <span className="inline-block w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: l.color }} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === l.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" onKeyDown={(e) => e.key === 'Enter' && handleUpdate(l.id)} autoFocus />
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: l.color + '20', color: l.color }}>{l.name}</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      {editingId === l.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdate(l.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingId(l.id); setEditName(l.name); setEditColor(l.color); }} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {labels.length === 0 && (
                <tr><td colSpan={canEdit ? 3 : 2} className="px-4 py-8 text-center text-gray-500">No labels.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}