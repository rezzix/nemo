import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { TaskDto, TaskStatusDto, TaskTypeDto, MemberDto, LabelDto, CommentDto, UpdateTaskRequest, TimeLogDto, PhaseDto } from '@/types';
import { getTask, updateTask } from '@/api/tasks';
import { getMembers, getLabels } from '@/api/projects';
import { getComments, addComment } from '@/api/tasks';
import { listTimeLogs, createTimeLog, deleteTimeLog } from '@/api/timeLogs';
import { listOpenPhases } from '@/api/phases';
import { listTaskStatuses, listTaskTypes } from '@/api/admin';
import { priorityColor, statusColor, formatDate, deadlineBadge, deadlineLabel } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/common/Spinner';

export default function TaskDetailPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [typeId, setTypeId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [phaseId, setPhaseId] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState('');

  // Dropdown options
  const [statuses, setStatuses] = useState<TaskStatusDto[]>([]);
  const [types, setTypes] = useState<TaskTypeDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [labels, setLabels] = useState<LabelDto[]>([]);
  const [openPhases, setOpenPhases] = useState<PhaseDto[]>([]);

  // Save state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const isExternal = user?.role === 'EXTERNAL';
  const canEditTask = !isExternal || (task?.external && (task.reporterId === user?.id || task.assigneeId === user?.id));

  const fetchTask = useCallback(async () => {
    if (!projectId || !taskId) return;
    setLoading(true);
    try {
      const data = await getTask(Number(projectId), Number(taskId));
      setTask(data);
      setTitle(data.title);
      setDescription(data.description ?? '');
      setPriority(data.priority);
      setTypeId(String(data.typeId));
      setStatusId(String(data.statusId));
      setAssigneeId(data.assigneeId != null ? String(data.assigneeId) : '');
      setPhaseId(data.phaseId != null ? String(data.phaseId) : '');
      setSelectedLabels(data.labelIds);
      setDueDate(data.dueDate ?? '');
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId]);

  useEffect(() => {
    fetchTask();
    if (projectId) {
      listTaskStatuses().then(setStatuses);
      listTaskTypes().then(setTypes);
      getMembers(Number(projectId)).then(setMembers);
      getLabels(Number(projectId)).then(setLabels);
      listOpenPhases(Number(projectId)).then(setOpenPhases).catch(() => {});
    }
  }, [projectId, fetchTask]);

  const handleSave = async () => {
    if (!projectId || !taskId) return;
    setSaving(true);
    setError(null);
    try {
      const req: UpdateTaskRequest = {
        title,
        description,
        priority,
        typeId: Number(typeId),
        statusId: Number(statusId),
        assigneeId: assigneeId ? Number(assigneeId) : null,
        phaseId: phaseId ? Number(phaseId) : null,
        labelIds: selectedLabels,
        dueDate: dueDate || null,
      };
      const updated = await updateTask(Number(projectId), Number(taskId), req);
      setTask(updated);
      setEditing(false);
    } catch {
      setError('Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!task) return <div className="text-center text-gray-500 py-8">Task not found.</div>;

  const toggleLabel = (labelId: number) => {
    setSelectedLabels((prev) => prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap gap-y-2">
        <button onClick={() => navigate(`/projects/${projectId}`)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-mono text-sm text-gray-500">{task.taskKey}</span>
        {!editing ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            {task.external && <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">External</span>}
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(task.statusName)}`}>{task.statusName}</span>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(task.priority)}`}>{task.priority}</span>
          </>
        ) : (
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 text-2xl font-bold text-gray-900 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
        )}
        <div className="ml-auto">
          {!editing ? (
            canEditTask && <button onClick={() => setEditing(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Edit</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Spinner className="h-4 w-4" />}Save
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            {!editing ? (
              <div className="text-gray-700 whitespace-pre-wrap">{task.description || 'No description provided.'}</div>
            ) : (
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            )}
          </div>

          {/* Comments */}
          <CommentsSection projectId={Number(projectId)} taskId={Number(taskId)} />

          {/* Time Logs - hidden for external users */}
          {!isExternal && <TimeLogsSection projectId={Number(projectId)} taskId={Number(taskId)} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            {!editing ? (
              <>
                <DetailRow label="Status" value={<span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(task.statusName)}`}>{task.statusName}</span>} />
                <DetailRow label="Priority" value={<span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(task.priority)}`}>{task.priority}</span>} />
                <DetailRow label="Type" value={task.typeName} />
                <DetailRow label="Phase" value={task.phaseName ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{task.phaseName}</span> : 'None'} />
                <DetailRow label="Assignee" value={task.assigneeName ?? 'Unassigned'} />
                <DetailRow label="Reporter" value={task.reporterName ?? 'Unknown'} />
                <DetailRow label="Labels" value={
                  task.labelNames.length > 0
                    ? task.labelNames.map((n, i) => (
                      <span key={i} className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium mr-1">{n}</span>
                    ))
                    : 'None'
                } />
                <DetailRow label="Due Date" value={
                  task.dueDate
                    ? <>{formatDate(task.dueDate)}{deadlineLabel(task.dueDate) && <span className={`inline-block ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${deadlineBadge(task.dueDate)}`}>{deadlineLabel(task.dueDate)}</span>}</>
                    : 'None'
                } />
                <DetailRow label="Sprint" value={task.sprintId ? `Sprint ${task.sprintId}` : 'Backlog'} />
                <DetailRow label="Created" value={formatDate(task.createdAt)} />
                <DetailRow label="Updated" value={formatDate(task.updatedAt)} />
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={statusId} onChange={(e) => setStatusId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                {!isExternal && (
                <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-sm text-gray-500 w-24 shrink-0">{label}</span>
      <div className="text-sm text-gray-900 flex-1">{value}</div>
    </div>
  );
}

// ─── Time Logs Section ──────────────────────────────────────────────────────────

function TimeLogsSection({ projectId, taskId }: { projectId: number; taskId: number }) {
  const [logs, setLogs] = useState<TimeLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try { setLogs(await listTimeLogs({ taskId })); } finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalHours = logs.reduce((sum, l) => sum + l.hours, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createTimeLog({ taskId, hours: parseFloat(hours), logDate, description: description || undefined });
      setHours('');
      setDescription('');
      setShowForm(false);
      fetchLogs();
    } catch {
      setError('Failed to log time.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this time log?')) return;
    await deleteTimeLog(id);
    fetchLogs();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-gray-500">Time Logged</h3>
          <span className="text-sm font-semibold text-gray-900">{totalHours.toFixed(1)}h</span>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">
          {showForm ? 'Cancel' : 'Log Time'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hours</label>
              <input type="number" step="0.25" min="0.25" value={hours} onChange={(e) => setHours(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. 2.5" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="What did you work on?" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving || !hours} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Spinner className="h-4 w-4" />}Log Time
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-16"><Spinner className="h-5 w-5 text-primary-600" /></div>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{l.hours}h</span>
                  <span className="text-xs text-gray-400">{formatDate(l.logDate)}</span>
                  <span className="text-xs text-gray-500">{l.userName}</span>
                </div>
                {l.description && <p className="text-sm text-gray-600 mt-0.5">{l.description}</p>}
              </div>
              <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:text-red-800 text-xs font-medium ml-2">Delete</button>
            </div>
          ))}
          {logs.length === 0 && <p className="text-sm text-gray-400">No time logged yet.</p>}
        </div>
      )}
    </div>
  );
}

// ─── Comments Section ──────────────────────────────────────────────────────────

function CommentsSection({ projectId, taskId }: { projectId: number; taskId: number }) {
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try { setComments(await getComments(projectId, taskId)); } finally { setLoading(false); }
  }, [projectId, taskId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await addComment(projectId, taskId, { content: newComment.trim() });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Comments</h3>

      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex justify-end mt-2">
          <button type="submit" disabled={submitting || !newComment.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {submitting && <Spinner className="h-4 w-4" />}Comment
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-16"><Spinner className="h-5 w-5 text-primary-600" /></div>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="border-l-2 border-primary-200 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">{c.authorName}</span>
                <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-gray-400">No comments yet.</p>}
        </div>
      )}
    </div>
  );
}