import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { listProjects } from '@/api/projects';
import { getEvmMetrics } from '@/api/pmo';
import { listSprints } from '@/api/sprints';
import { getTimeByUser } from '@/api/timeLogs';
import { formatCurrency, stageBadge, stageLabel, riskColor, riskLabel } from '@/utils/format';
import { currentWeekRange, filterMyProjects, aggregateRaidItems } from './dashboardUtils';
import type { ProjectDto, EvmMetrics, RaidItemDto, SprintDto } from '@/types';
import Spinner from '@/components/common/Spinner';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [myProjects, setMyProjects] = useState<ProjectDto[]>([]);
  const [evmData, setEvmData] = useState<Record<number, EvmMetrics>>({});
  const [topRisks, setTopRisks] = useState<RaidItemDto[]>([]);
  const [activeSprints, setActiveSprints] = useState<(SprintDto & { projectId: number; projectName: string })[]>([]);
  const [teamTime, setTeamTime] = useState<{ userId: number; totalHours: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    listProjects().then(async (projects) => {
      const managed = filterMyProjects(projects, user.id);
      setMyProjects(managed);

      const ids = managed.map((p) => p.id);

      const [evmResults, risks, sprintResults, timeData] = await Promise.all([
        Promise.all(ids.map((id) => getEvmMetrics(id).catch(() => null))).then((results) => {
          const map: Record<number, EvmMetrics> = {};
          results.forEach((e, i) => { if (e) map[ids[i]] = e; });
          return map;
        }),
        aggregateRaidItems(ids, 'RISK').then((items) =>
          items.filter((r) => r.status === 'OPEN' || r.status === 'MITIGATING').slice(0, 10)
        ),
        Promise.all(
          ids.map((id) => listSprints(id).catch(() => [] as SprintDto[])),
        ).then((results) => {
          const sprints: (SprintDto & { projectId: number; projectName: string })[] = [];
          results.forEach((sList, i) => {
            sList.filter((s) => s.status === 'ACTIVE').forEach((s) => {
              sprints.push({ ...s, projectId: ids[i], projectName: managed[i].name });
            });
          });
          return sprints;
        }),
        (async () => {
          const { start, end } = currentWeekRange();
          try {
            return await getTimeByUser(start, end);
          } catch {
            return [];
          }
        })(),
      ]);

      setEvmData(evmResults);
      setTopRisks(risks);
      setActiveSprints(sprintResults);
      setTeamTime(timeData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  const totalIssues = Object.values(evmData).reduce((s, e) => s + e.totalIssues, 0);
  const openRisks = topRisks.length;

  const stats = [
    { label: 'My Projects', value: myProjects.length, color: 'bg-primary-50 text-primary-700' },
    { label: 'Total Issues', value: totalIssues, color: 'bg-blue-50 text-blue-700' },
    { label: 'Open Risks', value: openRisks, color: 'bg-red-50 text-red-700' },
    { label: 'Active Sprints', value: activeSprints.length, color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {user ? `Welcome back, ${user.firstName}` : 'Welcome'}
        </h2>
        <p className="text-gray-500 mt-1">Here's how your projects are doing.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* My Projects Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Projects</h3>
        {myProjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            You don't manage any projects yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProjects.map((project) => {
              const evm = evmData[project.id];
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {project.key}
                      </span>
                      <h4 className="font-semibold text-gray-900 truncate">{project.name}</h4>
                    </div>
                    {project.stage && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge(project.stage)}`}>
                        {stageLabel(project.stage)}
                      </span>
                    )}
                  </div>
                  {evm && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Completion</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 rounded-full h-2"
                            style={{ width: `${Math.round(evm.completionPct * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{(evm.completionPct * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span>
                          CPI: <span className={evm.cpi >= 1 ? 'text-green-600' : evm.cpi >= 0.9 ? 'text-yellow-600' : 'text-red-600'}>{evm.cpi.toFixed(2)}</span>
                        </span>
                        <span>
                          SPI: <span className={evm.spi >= 1 ? 'text-green-600' : evm.spi >= 0.9 ? 'text-yellow-600' : 'text-red-600'}>{evm.spi.toFixed(2)}</span>
                        </span>
                      </div>
                    </div>
                  )}
                  {project.budget && (
                    <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                      <span>Budget: {formatCurrency(Number(project.budget))}</span>
                      <span>Spent: {formatCurrency(Number(project.budgetSpent || 0) + (evm?.actualCost || 0))}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Risks */}
      {topRisks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Risks</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">P × I</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topRisks.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{r.projectName}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${riskColor(r.riskScore)}`}>
                        {r.riskScore} — {riskLabel(r.riskScore)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.probability} × {r.impact}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'MITIGATING' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.ownerName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Sprints */}
      {activeSprints.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sprints</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSprints.map((sprint) => (
              <div key={sprint.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h4 className="font-semibold text-gray-900">{sprint.name}</h4>
                </div>
                <p className="text-xs text-gray-500 mb-2">{sprint.projectName}</p>
                {sprint.goal && <p className="text-sm text-gray-600 line-clamp-2 mb-2">{sprint.goal}</p>}
                <p className="text-xs text-gray-400">
                  {sprint.startDate} → {sprint.endDate}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Timesheet This Week */}
      {teamTime.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Time This Week</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamTime.map((t) => (
                  <tr key={t.userId} className={t.totalHours === 0 ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 text-gray-900">User #{t.userId}</td>
                    <td className="px-4 py-3">
                      <span className={t.totalHours === 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                        {t.totalHours.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}