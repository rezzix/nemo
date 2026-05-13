import { useState, useEffect, useCallback } from 'react';
import type { TaskTypeDto, TaskStatusDto, TaskStatusCategory } from '@/types';
import Spinner from '@/components/common/Spinner';
import {
  listTaskTypes, createTaskType, updateTaskType, deleteTaskType,
  listTaskStatuses, createTaskStatus, updateTaskStatus, deleteTaskStatus,
} from '@/api/admin';
import UsersTab from './UsersTab';
import CompaniesTab from './CompaniesTab';
import TaskStatusesTab from './StatusesTab';
import ActivityTab from './ActivityTab';

type Tab = 'companies' | 'users' | 'activity' | 'settings';

function SpinnerWrapper() {
  return (
    <div className="flex items-center justify-center h-32">
      <Spinner className="h-6 w-6 text-primary-600" />
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('companies');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'companies', label: 'Companies' },
    { key: 'users', label: 'Users' },
    { key: 'activity', label: 'Activity' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Administration</h2>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'companies' && <CompaniesTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'activity' && <ActivityTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
}

// ─── Tasks Tab (merged Types + Statuses) ─────────────────────────────────────

function SettingsTab() {
  return (
    <div className="space-y-8">
      <TaskTypesSection />
      <TaskStatusesSection />
    </div>
  );
}

function TaskTypesSection() {
  const [types, setTypes] = useState<TaskTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try { setTypes(await listTaskTypes()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createTaskType({ name: newName.trim() });
      setNewName('');
      fetchTypes();
    } finally { setSaving(false); }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;
    await updateTaskType(id, { name: editingName.trim() });
    setEditingId(null);
    fetchTypes();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task type?')) return;
    await deleteTaskType(id);
    fetchTypes();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Task Types</h3>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New task type name..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
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
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {types.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{t.id}</td>
                  <td className="px-4 py-3">
                    {editingId === t.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate(t.id)}
                        autoFocus
                      />
                    ) : t.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId === t.id ? (
                        <>
                          <button onClick={() => handleUpdate(t.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(t.id); setEditingName(t.name); }} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {types.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No task types found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TaskStatusesSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Task Statuses</h3>
      <TaskStatusesTab />
    </div>
  );
}