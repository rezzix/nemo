import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TaskDto, TaskStatusDto } from '@/types';
import { listProjectTasks, updateTask } from '@/api/tasks';
import { listTaskStatuses } from '@/api/admin';
import { priorityColor, statusColor, formatDate, deadlineBadge, deadlineLabel } from '@/utils/format';
import { useAuthStore } from '@/stores/authStore';
import Spinner from '@/components/common/Spinner';

export default function BoardTab({ projectId, projectKey, isExternal }: { projectId: number; projectKey: string; isExternal?: boolean }) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [statuses, setStatuses] = useState<TaskStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTargetStatusId, setDropTargetStatusId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskData, statusData] = await Promise.all([
        listProjectTasks(projectId, { size: 200 }),
        listTaskStatuses(),
      ]);
      setTasks(taskData);
      setStatuses(statusData.sort((a, b) => a.position - b.position));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tasksByStatus = statuses.map((status) => ({
    status,
    tasks: tasks.filter((i) => i.statusId === status.id),
  }));

  const handleDragStart = (taskId: number) => {
    setDraggingId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetStatusId(null);
  };

  const handleDragOver = (e: React.DragEvent, statusId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetStatusId(statusId);
  };

  const handleDragLeave = () => {
    setDropTargetStatusId(null);
  };

  const handleDrop = async (statusId: number) => {
    if (draggingId === null) return;
    const task = tasks.find((i) => i.id === draggingId);
    if (!task || task.statusId === statusId) {
      setDraggingId(null);
      setDropTargetStatusId(null);
      return;
    }

    // Optimistically update UI
    setTasks((prev) =>
      prev.map((i) => (i.id === task.id ? { ...i, statusId, statusName: statuses.find((s) => s.id === statusId)!.name } : i)),
    );
    setDraggingId(null);
    setDropTargetStatusId(null);
    setUpdating(true);

    try {
      await updateTask(projectId, task.id, { statusId });
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((i) => (i.id === task.id ? { ...i, statusId: task.statusId, statusName: task.statusName } : i)),
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;

  return (
    <div className="relative">
      {updating && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <Spinner className="h-3 w-3" /> Updating...
          </span>
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 280px)' }}>
        {tasksByStatus.map(({ status, tasks: columnTasks }) => (
          <div
            key={status.id}
            ref={(el) => { columnRefs.current[status.id] = el; }}
            className={`flex-shrink-0 w-72 flex flex-col bg-gray-50 rounded-xl border-2 transition-colors ${
              dropTargetStatusId === status.id ? 'border-primary-400 bg-primary-50' : 'border-transparent'
            }`}
            onDragOver={(e) => handleDragOver(e, status.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(status.id)}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(status.name)}`}>{status.name}</span>
                <span className="text-xs text-gray-400">{columnTasks.length}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable={!isExternal || (task.external && (task.reporterId === currentUser?.id || task.assigneeId === currentUser?.id))}
                  onDragStart={() => handleDragStart(task.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => navigate(`/projects/${projectId}/tasks/${task.id}`)}
                  className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all ${
                    draggingId === task.id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-primary-600">{task.taskKey}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityColor(task.priority)}`}>{task.priority}</span>
                    {task.storyPoints != null && <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">{task.storyPoints} SP</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-900 leading-snug mb-1.5">{task.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{task.typeName}</span>
                    {task.phaseName && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{task.phaseName}</span>}
                    {task.assigneeName && <span>{task.assigneeName}</span>}
                    {task.dueDate && <span className={deadlineBadge(task.dueDate, task.statusCategory) || 'text-gray-400'}>{formatDate(task.dueDate)}</span>}
                    {task.dueDate && deadlineLabel(task.dueDate, task.statusCategory) && <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${deadlineBadge(task.dueDate, task.statusCategory)}`}>{deadlineLabel(task.dueDate, task.statusCategory)}</span>}
                  </div>
                </div>
              ))}
              {columnTasks.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-400">
                  {draggingId !== null ? 'Drop task here' : 'No tasks'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}