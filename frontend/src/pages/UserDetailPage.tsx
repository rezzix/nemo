import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { UserDto, ProjectDto, MemberDto, TaskDto, TimeLogDto, LeaveRequestDto, AssetDto, AssetType, AssetStatus, UserRateDto } from '@/types';
import { getUser } from '@/api/users';
import { listProjects, getMembers } from '@/api/projects';
import { listProjectTasks } from '@/api/tasks';
import { listTimeLogs } from '@/api/timeLogs';
import { listLeaveRequests } from '@/api/leave';
import { listAssets } from '@/api/assets';
import { getUserRates, createUserRate, updateUserRate, deleteUserRate } from '@/api/userRates';
import { useAuth } from '@/hooks/useAuth';
import { scoreLabel, scoreColor, roleBadgeColor, formatDate, formatCurrency } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  COMPUTER: 'Computer', SERVER: 'Server', MOBILE: 'Mobile', VEHICLE: 'Vehicle', MICROWAVE: 'Microwave', OTHER: 'Other',
};
const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  IN_STOCK: 'In Stock', IN_USE: 'In Use', ASSIGNED: 'Assigned', MAINTENANCE: 'Maintenance', RETIRED: 'Retired',
};
const assetStatusColor = (s: AssetStatus) => {
  switch (s) {
    case 'IN_STOCK': return 'bg-gray-100 text-gray-700';
    case 'IN_USE': return 'bg-blue-100 text-blue-700';
    case 'ASSIGNED': return 'bg-green-100 text-green-700';
    case 'MAINTENANCE': return 'bg-amber-100 text-amber-700';
    case 'RETIRED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};
const leaveStatusColor = (s: string) => {
  switch (s) {
    case 'APPROVED': return 'bg-green-100 text-green-700';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    case 'CANCELLED': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};
const taskStatusColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('progress') || n.includes('active')) return 'bg-blue-100 text-blue-700';
  if (n.includes('done') || n.includes('closed') || n.includes('resolved')) return 'bg-green-100 text-green-700';
  if (n.includes('review')) return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-700';
};

interface ProjectData {
  project: ProjectDto;
  tasks: TaskDto[];
  score: number | null;
  totalHours: number;
  taskHours: Record<number, number>;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequestDto[]>([]);
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [rates, setRates] = useState<UserRateDto[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [showAddRate, setShowAddRate] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [newRateDate, setNewRateDate] = useState(new Date().toISOString().slice(0, 10));
  const [savingRate, setSavingRate] = useState(false);
  const [editRateId, setEditRateId] = useState<number | null>(null);
  const [editRateValue, setEditRateValue] = useState('');

  const canSeeScores = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' || currentUser.role === 'EXECUTIVE' || currentUser.role === 'HR');
  const canManageRates = currentUser && (currentUser.role === 'HR' || currentUser.role === 'EXECUTIVE');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getUser(Number(id)).then(setUser).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    const userId = user.id;

    const fetchAll = async () => {
      try {
        const projects = await listProjects();
        const pData: ProjectData[] = [];
        for (const p of projects) {
          try {
            const members = await getMembers(p.id);
            const member = members.find((m: MemberDto) => m.userId === userId);
            if (!member) continue;

            const tasks = await listProjectTasks(p.id, { assigneeId: userId });
            const logs = await listTimeLogs({ userId, size: 200 });
            const taskHoursMap: Record<number, number> = {};
            const projectLogs = logs.filter((l: TimeLogDto) => tasks.some((i: TaskDto) => i.id === l.taskId));
            const projectHours = projectLogs.reduce((sum: number, l: TimeLogDto) => sum + l.hours, 0);
            for (const l of projectLogs) {
              taskHoursMap[l.taskId] = (taskHoursMap[l.taskId] || 0) + l.hours;
            }

            if (tasks.length > 0 || member.score != null) {
              pData.push({
                project: p,
                tasks,
                score: member.score,
                totalHours: projectHours,
                taskHours: taskHoursMap,
              });
            }
          } catch { /* skip project */ }
        }
        setProjectData(pData);

        const [leaveReqs, userAssets, userRates] = await Promise.all([
          listLeaveRequests({ userId }),
          listAssets({ userId }),
          canManageRates ? getUserRates(userId) : Promise.resolve([]),
        ]);
        setLeaves(leaveReqs);
        setAssets(userAssets);
        setRates(userRates);
      } catch { /* ignore */ }
      finally { setDataLoading(false); }
    };
    fetchAll();
  }, [user]);

  const refreshRates = useCallback(async () => {
    if (!user || !canManageRates) return;
    try {
      setRates(await getUserRates(user.id));
    } catch { /* ignore */ }
  }, [user, canManageRates]);

  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newRate) return;
    setSavingRate(true);
    try {
      await createUserRate({ userId: user.id, hourlyRate: Number(newRate), effectiveFrom: newRateDate });
      setNewRate('');
      setShowAddRate(false);
      refreshRates();
    } catch { /* ignore */ } finally { setSavingRate(false); }
  };

  const handleUpdateRate = async (id: number) => {
    if (!editRateValue) return;
    setSavingRate(true);
    try {
      await updateUserRate(id, { hourlyRate: Number(editRateValue) });
      setEditRateId(null);
      refreshRates();
    } catch { /* ignore */ } finally { setSavingRate(false); }
  };

  const handleDeleteRate = async (id: number) => {
    if (!confirm('Delete this rate?')) return;
    try { await deleteUserRate(id); } catch { /* ignore */ }
    refreshRates();
  };

  const today = new Date().toISOString().slice(0, 10);
  const getCurrentRate = () => {
    const past = rates.filter((r) => r.effectiveFrom <= today);
    return past.length > 0 ? past[0] : null;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  }

  if (!user) {
    return <div className="text-center text-gray-500 py-8">User not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Link to="/people" className="text-sm text-primary-600 hover:text-primary-800">&larr; Back to People</Link>

      {/* User header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
            <p className="text-gray-500 text-sm font-mono">@{user.username}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleBadgeColor(user.role)}`}>{user.role}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          {user.companyName && <div><p className="text-xs text-gray-500">Company</p><p className="text-sm font-medium text-gray-900">{user.companyName}</p></div>}
          {user.jobTitle && <div><p className="text-xs text-gray-500">Job Title</p><p className="text-sm font-medium text-gray-900">{user.jobTitle}</p></div>}
          {user.department && <div><p className="text-xs text-gray-500">Department</p><p className="text-sm font-medium text-gray-900">{user.department}</p></div>}
          {user.email && <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium text-gray-900">{user.email}</p></div>}
          {user.phone && <div><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium text-gray-900">{user.phone}</p></div>}
          {user.hireDate && <div><p className="text-xs text-gray-500">Hire Date</p><p className="text-sm font-medium text-gray-900">{formatDate(user.hireDate)}</p></div>}
        </div>
      </div>

      {dataLoading && <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>}

      {/* Projects card — tasks grouped by project with evaluation and time */}
      {!dataLoading && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
          {projectData.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No project assignments found.</div>
          ) : (
            projectData.map(({ project, tasks, score, totalHours, taskHours }) => (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200">
                {/* Project header */}
                <Link to={`/projects/${project.id}`} className="block px-5 py-4 hover:bg-gray-50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{project.key}</span>
                      <h4 className="font-semibold text-gray-900">{project.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {canSeeScores && score != null && (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${scoreColor(score)}`}>{score} - {scoreLabel(score)}</span>
                      )}
                      <span>{totalHours.toFixed(1)}h logged</span>
                      <span>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </Link>

                {/* Tasks under this project */}
                {tasks.length > 0 && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {tasks.map((task) => (
                      <Link
                        key={task.id}
                        to={`/projects/${task.projectId}/tasks/${task.id}`}
                        className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs text-gray-400">{task.taskKey}</span>
                          <span className="text-sm text-gray-900 truncate">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {taskHours[task.id] != null && (
                            <span className="text-xs text-gray-500">{taskHours[task.id].toFixed(1)}h</span>
                          )}
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${taskStatusColor(task.statusName)}`}>
                            {task.statusName}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Leaves, Assets, and Hourly Rates */}
      {!dataLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaves */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaves</h3>
            {leaves.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No leave requests.</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Dates</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{leave.type}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(leave.startDate)} → {formatDate(leave.endDate)}</td>
                        <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${leaveStatusColor(leave.status)}`}>{leave.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Assets */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets</h3>
            {assets.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No assets assigned.</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Asset</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                        <td className="px-4 py-3 text-gray-600">{ASSET_TYPE_LABELS[asset.type] || asset.type}</td>
                        <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${assetStatusColor(asset.status)}`}>{ASSET_STATUS_LABELS[asset.status] || asset.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Hourly Rates — HR and Executive only */}
          {canManageRates && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Hourly Rates</h3>
                <button onClick={() => { setShowAddRate(true); setEditRateId(null); }} className="text-primary-600 hover:text-primary-800 text-sm font-medium">+ Add Rate</button>
              </div>
              {showAddRate && (
                <form onSubmit={handleCreateRate} className="bg-white rounded-xl border border-gray-200 p-4 mb-3 space-y-3">
                  <div className="flex items-end gap-3 flex-wrap">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Hourly Rate ($)</label>
                      <input type="number" step="0.01" min="0" value={newRate} onChange={(e) => setNewRate(e.target.value)} required placeholder="e.g. 75.00" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Effective From</label>
                      <input type="date" value={newRateDate} onChange={(e) => setNewRateDate(e.target.value)} required className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <button type="submit" disabled={savingRate || !newRate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">{savingRate ? 'Saving...' : 'Add'}</button>
                    <button type="button" onClick={() => setShowAddRate(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                  </div>
                </form>
              )}
              {rates.length === 0 && !showAddRate ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No rates configured.</div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Rate</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Effective From</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {rates.map((rate) => (
                        <tr key={rate.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {editRateId === rate.id ? (
                              <input type="number" step="0.01" value={editRateValue} onChange={(e) => setEditRateValue(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-28" autoFocus />
                            ) : (
                              <span className="font-medium">{formatCurrency(rate.hourlyRate)}/hr</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(rate.effectiveFrom)}</td>
                          <td className="px-4 py-3">
                            {rate.effectiveFrom <= today && (
                              rates[0]?.id === rate.id
                                ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Current</span>
                                : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Historical</span>
                            )}
                            {rate.effectiveFrom > today && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Upcoming</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editRateId === rate.id ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleUpdateRate(rate.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                                <button onClick={() => setEditRateId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setEditRateId(rate.id); setEditRateValue(rate.hourlyRate.toString()); setShowAddRate(false); }} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                                <button onClick={() => handleDeleteRate(rate.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {getCurrentRate() && (
                <p className="mt-2 text-sm text-gray-500">Current rate: <span className="font-medium text-gray-900">{formatCurrency(getCurrentRate()!.hourlyRate)}/hr</span></p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}