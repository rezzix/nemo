import { useState, useEffect, useMemo } from 'react';
import { listSprints } from '@/api/sprints';
import { listProjectTasks } from '@/api/tasks';
import type { SprintDto, TaskDto } from '@/types';
import { deadlineBadge, deadlineLabel } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

interface SprintsTabProps {
  projectId: number;
  canEdit: boolean;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PLANNING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
};

export default function SprintsTab({ projectId, canEdit }: SprintsTabProps) {
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listSprints(projectId), listProjectTasks(projectId)])
      .then(([sprintData, taskData]) => {
        setSprints(sprintData);
        setTasks(taskData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const tasksBySprint = useMemo(() => {
    const map: Record<number | string, TaskDto[]> = {};
    for (const t of tasks) {
      const key = t.sprintId ?? 'backlog';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [tasks]);

  if (loading) {
    return <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>;
  }

  if (sprints.length === 0) {
    return <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No sprints yet.</div>;
  }

  return (
    <div className="space-y-4">
      {sprints.map((sprint) => {
        const sprintTasks = tasksBySprint[sprint.id] ?? [];
        const doneTasks = sprintTasks.filter((t) => t.statusCategory === 'DONE' || t.statusCategory === 'CLOSED');
        const progress = sprintTasks.length > 0 ? Math.round((doneTasks.length / sprintTasks.length) * 100) : 0;
        const isOverdue = sprint.status === 'ACTIVE' && sprint.endDate && new Date(sprint.endDate) < new Date();

        return (
          <div key={sprint.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-gray-900">{sprint.name}</h3>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[sprint.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {sprint.status}
                </span>
                {isOverdue && (
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${deadlineBadge(sprint.endDate!)}`}>
                    {deadlineLabel(sprint.endDate!)}
                  </span>
                )}
              </div>
              {sprint.goal && <p className="text-sm text-gray-500 max-w-md truncate">{sprint.goal}</p>}
            </div>

            <div className="px-5 py-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Start</span>
                <p className="font-medium text-gray-900">{sprint.startDate ? new Date(sprint.startDate + 'T00:00:00').toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <span className="text-gray-400">End</span>
                <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>{sprint.endDate ? new Date(sprint.endDate + 'T00:00:00').toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <span className="text-gray-400">Progress</span>
                <p className="font-medium text-gray-900">{doneTasks.length}/{sprintTasks.length} tasks ({progress}%)</p>
              </div>
            </div>

            {sprintTasks.length > 0 && (
              <div className="px-5 pb-4">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div className="bg-primary-600 rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="space-y-1">
                  {sprintTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm py-1">
                      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                        task.statusCategory === 'DONE' || task.statusCategory === 'CLOSED' ? 'bg-green-500' :
                        task.statusCategory === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <span className="text-xs font-mono text-gray-400">{task.taskKey}</span>
                      <span className="text-gray-700 truncate">{task.title}</span>
                      {task.assigneeName && <span className="ml-auto text-xs text-gray-400">{task.assigneeName}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Backlog (tasks without sprint) */}
      {(() => {
        const backlog = tasksBySprint['backlog'] ?? [];
        if (backlog.length === 0) return null;
        return (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Backlog</h3>
              <p className="text-xs text-gray-400">{backlog.length} tasks not assigned to a sprint</p>
            </div>
            <div className="px-5 pb-4 space-y-1">
              {backlog.map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm py-1">
                  <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                    task.statusCategory === 'DONE' || task.statusCategory === 'CLOSED' ? 'bg-green-500' :
                    task.statusCategory === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-xs font-mono text-gray-400">{task.taskKey}</span>
                  <span className="text-gray-700 truncate">{task.title}</span>
                  {task.assigneeName && <span className="ml-auto text-xs text-gray-400">{task.assigneeName}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}