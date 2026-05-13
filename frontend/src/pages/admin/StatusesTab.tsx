import { useState, useEffect, useCallback } from 'react';
import type { TaskStatusDto, TaskStatusCategory } from '@/types';
import {
  listTaskStatuses, createTaskStatus, updateTaskStatus, deleteTaskStatus,
} from '@/api/admin';
import Spinner from '@/components/common/Spinner';

function SpinnerWrapper() {
  return (
    <div className="flex items-center justify-center h-32">
      <Spinner className="h-6 w-6 text-primary-600" />
    </div>
  );
}

export default function TaskStatusesTab() {
  const [statuses, setStatuses] = useState<TaskStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<TaskStatusCategory>('TODO');
  const [newDefault, setNewDefault] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<TaskStatusCategory>('TODO');
  const [editDefault, setEditDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try { setStatuses(await listTaskStatuses()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createTaskStatus({ name: newName.trim(), category: newCategory, isDefault: newDefault });
      setNewName('');
      setNewDefault(false);
      fetchStatuses();
    } finally { setSaving(false); }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    await updateTaskStatus(id, { name: editName.trim(), category: editCategory, isDefault: editDefault });
    setEditingId(null);
    fetchStatuses();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task status?')) return;
    await deleteTaskStatus(id);
    fetchStatuses();
  };

  const categoryColor = (cat: string) => {
    if (cat === 'TODO') return 'bg-gray-100 text-gray-700';
    if (cat === 'IN_PROGRESS') return 'bg-blue-100 text-blue-700';
    if (cat === 'CLOSED') return 'bg-emerald-100 text-emerald-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New status name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as TaskStatusCategory)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <label className="flex items-center gap-2 pb-2">
            <input type="checkbox" checked={newDefault} onChange={(e) => setNewDefault(e.target.checked)} className="rounded border-gray-300" />
            <span className="text-sm text-gray-600">Default</span>
          </label>
          <button onClick={handleCreate} disabled={saving || !newName.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            Add
          </button>
        </div>
      </div>

      {loading ? <SpinnerWrapper /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Default</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statuses.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{s.id}</td>
                  <td className="px-4 py-3">
                    {editingId === s.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" onKeyDown={(e) => e.key === 'Enter' && handleUpdate(s.id)} autoFocus />
                    ) : s.name}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === s.id ? (
                      <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as TaskStatusCategory)} className="px-2 py-1 border border-gray-300 rounded text-sm">
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor(s.category)}`}>{s.category}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === s.id ? (
                      <input type="checkbox" checked={editDefault} onChange={(e) => setEditDefault(e.target.checked)} className="rounded border-gray-300" />
                    ) : (
                      s.isDefault ? 'Yes' : 'No'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId === s.id ? (
                        <>
                          <button onClick={() => handleUpdate(s.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(s.id); setEditName(s.name); setEditCategory(s.category); setEditDefault(s.isDefault); }} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {statuses.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No task statuses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}