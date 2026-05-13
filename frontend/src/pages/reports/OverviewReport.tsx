import { useState, useEffect, useCallback } from 'react';
import { listProjectTasks } from '@/api/tasks';
import { listTaskStatuses } from '@/api/admin';
import type { TaskDto, TaskStatusDto } from '@/types';
import { priorityColor, statusColor } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import BarChart from './BarChart';
import StatCard from './ReportStatCard';

export default function OverviewReport({ projectId }: { projectId: number | null }) {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [statuses, setStatuses] = useState<TaskStatusDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { listTaskStatuses().then(setStatuses); }, []);

  const fetch = useCallback(async () => {
    if (!projectId) { setTasks([]); return; }
    setLoading(true);
    try {
      const data = await listProjectTasks(projectId, { size: 200 });
      setTasks(data);
    } catch { setTasks([]); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const byStatus = statuses.map((s) => ({
    label: s.name,
    value: tasks.filter((i) => i.statusId === s.id).length,
    color: statusColor(s.name).includes('green') ? 'bg-green-500' : statusColor(s.name).includes('blue') ? 'bg-blue-500' : statusColor(s.name).includes('purple') ? 'bg-purple-500' : 'bg-gray-400',
  }));

  const byPriority = (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => ({
    label: p.charAt(0) + p.slice(1).toLowerCase(),
    value: tasks.filter((i) => i.priority === p).length,
    color: priorityColor(p).includes('red') ? 'bg-red-500' : priorityColor(p).includes('orange') ? 'bg-orange-500' : priorityColor(p).includes('yellow') ? 'bg-yellow-500' : 'bg-blue-500',
  }));

  const byType = Object.entries(
    tasks.reduce<Record<string, number>>((acc, i) => { acc[i.typeName] = (acc[i.typeName] || 0) + 1; return acc; }, {})
  ).map(([label, value]) => ({ label, value, color: 'bg-primary-500' }));

  const doneCount = tasks.filter((i) => { const s = i.statusName.toLowerCase(); return s.includes('done') || s.includes('complete'); }).length;
  const unassigned = tasks.filter((i) => !i.assigneeId).length;

  return (
    <div className="space-y-6">
      {!projectId ? (
        <div className="text-center text-gray-400 py-8">Select a project above to view overview</div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Tasks" value={tasks.length} color="border-gray-200 bg-white" />
            <StatCard label="Completed" value={doneCount} sub={tasks.length ? `${((doneCount / tasks.length) * 100).toFixed(0)}%` : ''} color="border-green-200 bg-green-50" />
            <StatCard label="Unassigned" value={unassigned} color="border-orange-200 bg-orange-50" />
            <StatCard label="Types" value={byType.length} color="border-blue-200 bg-blue-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Tasks by Status</h3>
              <BarChart items={byStatus} maxValue={0} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Tasks by Priority</h3>
              <BarChart items={byPriority} maxValue={0} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Tasks by Type</h3>
            <BarChart items={byType} maxValue={0} />
          </div>
        </>
      )}
    </div>
  );
}