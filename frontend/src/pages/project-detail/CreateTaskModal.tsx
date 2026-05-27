import { useState, useEffect } from 'react';
import type { MemberDto, LabelDto, TaskTypeDto, PhaseDto } from '@/types';
import { getLabels, getMembers } from '@/api/projects';
import { createTask } from '@/api/tasks';
import { listOpenPhases } from '@/api/phases';
import { listTaskTypes } from '@/api/admin';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Spinner from '@/components/common/Spinner';

export default function CreateTaskModal({ projectId, projectKey, onClose, isExternal }: { projectId: number; projectKey: string; onClose: () => void; isExternal?: boolean }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [typeId, setTypeId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [phaseId, setPhaseId] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [storyPoints, setStoryPoints] = useState('');
  const [types, setTypes] = useState<TaskTypeDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [labels, setLabels] = useState<LabelDto[]>([]);
  const [openPhases, setOpenPhases] = useState<PhaseDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTaskTypes().then(setTypes);
    getLabels(projectId).then(setLabels);
    getMembers(projectId).then(setMembers);
    listOpenPhases(projectId).then(setOpenPhases).catch(() => {});
  }, [projectId]);

  useEffect(() => {
    if (types.length > 0 && !typeId) setTypeId(String(types[0].id));
  }, [types, typeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createTask(projectId, {
        title,
        description: description || undefined,
        priority,
        typeId: Number(typeId),
        assigneeId: assigneeId ? Number(assigneeId) : undefined,
        phaseId: phaseId ? Number(phaseId) : undefined,
        labelIds: selectedLabels.length > 0 ? selectedLabels : undefined,
        dueDate: dueDate || undefined,
        storyPoints: storyPoints ? Number(storyPoints) : undefined,
        ...(isExternal ? { external: true } : {}),
      });
      onClose();
    } catch {
      setError('Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  const toggleLabel = (labelId: number) => {
    setSelectedLabels((prev) => prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]);
  };

  return (
    <Modal title={`${projectKey}: ${isExternal ? 'Create External Ticket' : 'Create Task'}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Title" value={title} onChange={setTitle} required />
        <Field label="Description" value={description} onChange={setDescription} textarea />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.userId} value={m.userId}>{m.fullName} ({m.username})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
            <select value={phaseId} onChange={(e) => setPhaseId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">No phase</option>
              {openPhases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        {labels.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
            <div className="flex flex-wrap gap-2">
              {labels.map((l) => (
                <label key={l.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={selectedLabels.includes(l.id)} onChange={() => toggleLabel(l.id)} className="rounded border-gray-300" />
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: l.color + '20', color: l.color }}>{l.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Story Points</label>
          <input type="number" min="0" placeholder="—" value={storyPoints} onChange={(e) => setStoryPoints(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Create
          </button>
        </div>
      </form>
    </Modal>
  );
}