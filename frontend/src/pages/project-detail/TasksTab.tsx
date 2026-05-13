import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TaskDto, TaskStatusDto } from '@/types';
import { listProjectTasks } from '@/api/tasks';
import { listTaskStatuses } from '@/api/admin';
import { priorityColor, statusColor, formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import CreateTaskModal from './CreateTaskModal';

export default function TasksTab({ projectId, projectKey, canEdit, isExternal }: { projectId: number; projectKey: string; canEdit: boolean; isExternal?: boolean })  {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [statuses, setStatuses] = useState<TaskStatusDto[]>([]);
  const navigate = useNavigate();

  useEffect(() => { listTaskStatuses().then(setStatuses); }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (search) params.search = search;
      if (filterStatus) params.statusId = Number(filterStatus);
      if (filterPriority) params.priority = filterPriority;
      const data = await listProjectTasks(projectId, params);
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, [projectId, search, filterStatus, filterPriority]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap gap-y-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-48"
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        {(canEdit || isExternal) && (
          <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 shrink-0">
            {isExternal ? 'Create External Ticket' : 'Create Task'}
          </button>
        )}
      </div>

      {loading ? <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Key</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Priority</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Assignee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Phase</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/projects/${projectId}/tasks/${task.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary-600">{task.taskKey}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {task.title}
                    {task.external && <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-teal-100 text-teal-700">External</span>}
                  </td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(task.priority)}`}>{task.priority}</span></td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(task.statusName)}`}>{task.statusName}</span></td>
                  <td className="px-4 py-3 text-gray-500">{task.assigneeName ?? 'Unassigned'}</td>
                  <td className="px-4 py-3 text-gray-500">{task.typeName}</td>
                  <td className="px-4 py-3">{task.phaseName ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{task.phaseName}</span> : <span className="text-gray-400">--</span>}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(task.updatedAt)}</td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No tasks found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateTaskModal projectId={projectId} projectKey={projectKey} onClose={() => { setShowCreate(false); fetchTasks(); }} isExternal={isExternal} />}
    </div>
  );
}