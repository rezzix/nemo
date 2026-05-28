import { useState, useEffect, useCallback } from 'react';
import { listSprints, getSprintVelocity } from '@/api/sprints';
import { listProjectTasks, updateTask } from '@/api/tasks';
import type { SprintDto, SprintVelocityDto, TaskDto } from '@/types';
import { deadlineBadge, deadlineLabel, formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

interface PlanningTabProps {
  projectId: number;
  canEdit: boolean;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PLANNING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
};

const priorityDot: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-gray-400',
};

const statusCategoryDot: Record<string, string> = {
  DONE: 'bg-green-500',
  CLOSED: 'bg-green-500',
  IN_PROGRESS: 'bg-blue-500',
  TODO: 'bg-gray-300',
};

export default function PlanningTab({ projectId, canEdit }: PlanningTabProps) {
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [velocity, setVelocity] = useState<SprintVelocityDto[]>([]);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [dropTargetSprint, setDropTargetSprint] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sprintData, velocityData, taskData] = await Promise.all([
        listSprints(projectId),
        getSprintVelocity(projectId),
        listProjectTasks(projectId, { size: 500 }),
      ]);
      setSprints(sprintData);
      setVelocity(velocityData);
      setTasks(taskData);
    } catch {
      setSprints([]);
      setVelocity([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const velocityMap = new Map(velocity.map(v => [v.sprintId, v]));
  const activeSprints = sprints.filter(s => s.status === 'ACTIVE' || s.status === 'PLANNING');
  const completedSprints = sprints.filter(s => s.status === 'COMPLETED');

  // Compute average velocity from completed sprints for target SP
  const completedVelocities = completedSprints
    .map(s => velocityMap.get(s.id))
    .filter((v): v is SprintVelocityDto => v != null && v.totalStoryPoints > 0);
  const avgVelocity = completedVelocities.length > 0
    ? Math.round(completedVelocities.reduce((sum, v) => sum + v.completedStoryPoints, 0) / completedVelocities.length)
    : 0;

  const tasksBySprint = new Map<number | null, TaskDto[]>();
  for (const t of tasks) {
    const key = t.sprintId;
    if (!tasksBySprint.has(key)) tasksBySprint.set(key, []);
    tasksBySprint.get(key)!.push(t);
  }

  const handleDragStart = (taskId: number) => {
    if (!canEdit) return;
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDropTargetSprint(null);
  };

  const handleDragOver = (e: React.DragEvent, sprintKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetSprint(sprintKey);
  };

  const handleDragLeave = () => {
    setDropTargetSprint(null);
  };

  const handleDrop = async (targetSprintId: number | null) => {
    if (draggingTaskId === null) return;
    const task = tasks.find(t => t.id === draggingTaskId);
    if (!task) { handleDragEnd(); return; }
    if (task.sprintId === targetSprintId) { handleDragEnd(); return; }

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, sprintId: targetSprintId } : t));
    setDraggingTaskId(null);
    setDropTargetSprint(null);
    setUpdating(true);

    try {
      await updateTask(projectId, task.id, { sprintId: targetSprintId });
    } catch {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, sprintId: task.sprintId } : t));
    } finally {
      setUpdating(false);
    }
  };

  const getSprintTarget = (sprint: SprintDto): number => {
    // Use completed-sprint average if available, otherwise default to 0
    return avgVelocity || 0;
  };

  const getSprintBalance = (v: SprintVelocityDto, target: number): 'over' | 'under' | 'on' => {
    if (target <= 0) return 'on';
    const sp = v.totalStoryPoints;
    if (sp > target * 1.2) return 'over';
    if (sp < target * 0.8) return 'under';
    return 'on';
  };

  const balanceBarColor = (balance: 'over' | 'under' | 'on') => {
    if (balance === 'over') return 'bg-red-500';
    if (balance === 'under') return 'bg-amber-500';
    return 'bg-green-500';
  };

  const balanceLabel = (balance: 'over' | 'under' | 'on') => {
    if (balance === 'over') return 'Overloaded';
    if (balance === 'under') return 'Underloaded';
    return 'On target';
  };

  const balanceBg = (balance: 'over' | 'under' | 'on') => {
    if (balance === 'over') return 'border-red-200 bg-red-50';
    if (balance === 'under') return 'border-amber-200 bg-amber-50';
    return 'border-green-200 bg-green-50';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>;
  }

  if (sprints.length === 0) {
    return <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No sprints yet. Create sprints first.</div>;
  }

  const backlogTasks = tasksBySprint.get(null) ?? [];

  return (
    <div className="space-y-4">
      {updating && (
        <div className="fixed top-4 right-4 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium z-50 flex items-center gap-2">
          <Spinner className="h-3.5 w-3.5" /> Updating...
        </div>
      )}

      {/* Active/Planning sprints */}
      {activeSprints.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Active & Planning Sprints</h3>
            {avgVelocity > 0 && (
              <span className="text-xs text-gray-400">Target: {avgVelocity} SP/sprint (avg from completed)</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeSprints.map(sprint => {
              const v = velocityMap.get(sprint.id);
              const totalTasks = v?.totalTasks ?? 0;
              const completedTasks = v?.completedTasks ?? 0;
              const totalSP = v?.totalStoryPoints ?? 0;
              const completedSP = v?.completedStoryPoints ?? 0;
              const target = getSprintTarget(sprint);
              const balance = getSprintBalance(v ?? { totalStoryPoints: 0 } as SprintVelocityDto, target);
              const sprintKey = `sprint-${sprint.id}`;
              const isOverdue = sprint.status === 'ACTIVE' && sprint.endDate && new Date(sprint.endDate) < new Date();

              return (
                <div
                  key={sprint.id}
                  className={`rounded-xl border-2 transition-colors ${dropTargetSprint === sprintKey ? 'border-primary-400 bg-primary-50' : balanceBg(balance)}`}
                  onDragOver={canEdit ? (e) => handleDragOver(e, sprintKey) : undefined}
                  onDragLeave={canEdit ? handleDragLeave : undefined}
                  onDrop={canEdit ? () => handleDrop(sprint.id) : undefined}
                >
                  {/* Sprint header */}
                  <div className="px-4 py-3 border-b border-gray-200/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{sprint.name}</h4>
                        <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusColors[sprint.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {sprint.status}
                        </span>
                        {isOverdue && (
                          <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${deadlineBadge(sprint.endDate!, 'CLOSED')}`}>
                            {deadlineLabel(sprint.endDate!, 'CLOSED')}
                          </span>
                        )}
                      </div>
                      {target > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          balance === 'over' ? 'bg-red-100 text-red-700' :
                          balance === 'under' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>{balanceLabel(balance)}</span>
                      )}
                    </div>
                    {sprint.startDate && sprint.endDate && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}</p>
                    )}
                  </div>

                  {/* Sprint stats */}
                  <div className="px-4 py-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>{completedTasks}/{totalTasks} tasks</span>
                    <span className="font-medium text-gray-700">{completedSP}/{totalSP} SP</span>
                    {target > 0 && (
                      <span className="text-gray-400">target: {target} SP</span>
                    )}
                  </div>

                  {/* SP progress bar */}
                  {totalSP > 0 && (
                    <div className="px-4 pb-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`rounded-full h-2 transition-all ${balanceBarColor(balance)}`}
                          style={{ width: `${target > 0 ? Math.min((totalSP / target) * 100, 100) : (completedSP / totalSP) * 100}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Task list */}
                  <div className="px-4 pb-3 max-h-48 overflow-y-auto space-y-1">
                    {(tasksBySprint.get(sprint.id) ?? []).map(task => (
                      <TaskCard key={task.id} task={task} draggable={canEdit} onDragStart={handleDragStart} onDragEnd={handleDragEnd} isDragging={draggingTaskId === task.id} />
                    ))}
                    {(tasksBySprint.get(sprint.id) ?? []).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">Drag tasks here</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed sprints (collapsed) */}
      {completedSprints.length > 0 && (
        <details className="group">
          <summary className="text-sm font-semibold text-gray-700 uppercase tracking-wide cursor-pointer flex items-center gap-2 mb-2">
            Completed Sprints ({completedSprints.length})
            <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {completedSprints.map(sprint => {
              const v = velocityMap.get(sprint.id);
              const totalSP = v?.totalStoryPoints ?? 0;
              const completedSP = v?.completedStoryPoints ?? 0;

              return (
                <div key={sprint.id} className="rounded-xl border border-gray-200 bg-gray-50">
                  <div className="px-4 py-3 border-b border-gray-200/60">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-700 text-sm">{sprint.name}</h4>
                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">COMPLETED</span>
                    </div>
                    {sprint.startDate && sprint.endDate && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}</p>
                    )}
                  </div>
                  <div className="px-4 py-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>{v?.completedTasks ?? 0}/{v?.totalTasks ?? 0} tasks</span>
                    <span className="font-medium text-gray-700">{completedSP}/{totalSP} SP</span>
                  </div>
                  {totalSP > 0 && (
                    <div className="px-4 pb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 rounded-full h-2" style={{ width: `${(completedSP / totalSP) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Backlog */}
      <div
        className={`rounded-xl border-2 transition-colors ${dropTargetSprint === 'backlog' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-white'}`}
        onDragOver={canEdit ? (e) => handleDragOver(e, 'backlog') : undefined}
        onDragLeave={canEdit ? handleDragLeave : undefined}
        onDrop={canEdit ? () => handleDrop(null) : undefined}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Backlog</h3>
            <p className="text-xs text-gray-400">{backlogTasks.length} unscheduled tasks · {backlogTasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0)} SP</p>
          </div>
        </div>
        <div className="px-5 py-3 max-h-64 overflow-y-auto">
          {backlogTasks.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No unscheduled tasks</p>
          ) : (
            <div className="space-y-1">
              {backlogTasks.map(task => (
                <TaskCard key={task.id} task={task} draggable={canEdit} onDragStart={handleDragStart} onDragEnd={handleDragEnd} isDragging={draggingTaskId === task.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, draggable, onDragStart, onDragEnd, isDragging }: {
  task: TaskDto;
  draggable: boolean;
  onDragStart: (taskId: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={() => onDragStart(task.id)}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg transition-colors ${
        isDragging ? 'opacity-40' : draggable ? 'cursor-grab hover:bg-gray-50' : ''
      }`}
    >
      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${statusCategoryDot[task.statusCategory] ?? 'bg-gray-300'}`} />
      <span className="text-xs font-mono text-gray-400">{task.taskKey}</span>
      <span className="text-gray-700 truncate flex-1">{task.title}</span>
      {task.storyPoints != null && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 shrink-0">{task.storyPoints} SP</span>
      )}
      <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot[task.priority] ?? 'bg-gray-300'}`} />
      {task.assigneeName && <span className="text-[10px] text-gray-400 shrink-0 max-w-[80px] truncate">{task.assigneeName}</span>}
    </div>
  );
}