import { useState, useEffect, useCallback } from 'react';
import { listSprints, getSprintVelocity } from '@/api/sprints';
import type { SprintDto, SprintVelocityDto } from '@/types';
import { formatDate, deadlineBadge, deadlineLabel } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

export default function VelocityReport({ projectId }: { projectId: number | null }) {
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [velocity, setVelocity] = useState<SprintVelocityDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setSprints([]); setVelocity([]); return; }
    setLoading(true);
    try {
      const [sprintData, velocityData] = await Promise.all([
        listSprints(projectId),
        getSprintVelocity(projectId),
      ]);
      setSprints(sprintData);
      setVelocity(velocityData);
    } catch { setSprints([]); setVelocity([]); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const velocityMap = new Map(velocity.map(v => [v.sprintId, v]));
  const sprintStats = sprints.map(sprint => {
    const v = velocityMap.get(sprint.id);
    const total = v?.totalTasks ?? 0;
    const completed = v?.completedTasks ?? 0;
    const totalSP = v?.totalStoryPoints ?? 0;
    const completedSP = v?.completedStoryPoints ?? 0;
    return { sprint, total, completed, remaining: total - completed, totalSP, completedSP, remainingSP: totalSP - completedSP };
  });

  const maxTasks = Math.max(...sprintStats.map(s => s.total), 1);

  return (
    <div className="space-y-6">
      {!projectId ? (
        <div className="text-center text-gray-400 py-8">Select a project above to view sprint velocity</div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          {sprintStats.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No sprints found for this project</div>
          ) : (
            <div className="space-y-3">
              {sprintStats.map(({ sprint, total, completed, remaining, totalSP, completedSP, remainingSP }) => (
                <div key={sprint.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{sprint.name}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                        sprint.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        sprint.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-700'
                      }`}>{sprint.status}</span>
                      {deadlineLabel(sprint.endDate, sprint.status === 'CLOSED' ? 'CLOSED' : undefined) && (
                        <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-medium ${deadlineBadge(sprint.endDate, sprint.status === 'CLOSED' ? 'CLOSED' : undefined)}`}>
                          {deadlineLabel(sprint.endDate, sprint.status === 'CLOSED' ? 'CLOSED' : undefined)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {completed}/{total} tasks · {completedSP}/{totalSP} SP
                    </div>
                  </div>
                  <div className="flex gap-1 h-6">
                    <div className="bg-green-500 rounded-l-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${total ? (completed / maxTasks) * 100 : 0}%`, minWidth: completed > 0 ? '20px' : '0' }}>
                      {completed > 0 ? completed : ''}
                    </div>
                    <div className="bg-orange-400 rounded-r-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${total ? (remaining / maxTasks) * 100 : 0}%`, minWidth: remaining > 0 ? '20px' : '0' }}>
                      {remaining > 0 ? remaining : ''}
                    </div>
                  </div>
                  {sprint.startDate && sprint.endDate && (
                    <div className={`text-xs mt-1 ${deadlineBadge(sprint.endDate, sprint.status === 'CLOSED' ? 'CLOSED' : undefined) || 'text-gray-400'}`}>
                      {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}