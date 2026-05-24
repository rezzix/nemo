import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { UserDto, ProjectDto, MemberDto, TaskDto, TimeLogDto, LeaveRequestDto, AssetDto, AssetType, AssetStatus, AllocationSummaryDto } from '@/types';
import { getUser, updateUserCapacity, getUserAllocationSummary } from '@/api/users';
import { listProjects, getMembers } from '@/api/projects';
import { listProjectTasks } from '@/api/tasks';
import { listTimeLogs } from '@/api/timeLogs';
import { listLeaveRequests } from '@/api/leave';
import { listAssets } from '@/api/assets';
import { useAuth } from '@/hooks/useAuth';
import { scoreLabel, scoreColor, roleBadgeColor, formatDate } from '@/utils/format';
import { computeAvailability, allocationColor, allocationBgColor, availableColor } from '@/utils/availability';
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
  allocation: number;
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
  const [dataLoading, setDataLoading] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [capacityValue, setCapacityValue] = useState('');
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [allocationSummary, setAllocationSummary] = useState<AllocationSummaryDto | null>(null);

  const canSeeScores = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' || currentUser.role === 'EXECUTIVE' || currentUser.role === 'HR');
  const canManageCapacity = currentUser && (currentUser.role === 'HR' || currentUser.role === 'EXECUTIVE');

  const availability = useMemo(() => {
    if (!allocationSummary || !user) return null;
    const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED');
    return computeAvailability(user.weeklyCapacity, allocationSummary.totalAllocation, approvedLeaves);
  }, [allocationSummary, user, leaves]);

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
                allocation: member.allocation,
                totalHours: projectHours,
                taskHours: taskHoursMap,
              });
            }
          } catch { /* skip project */ }
        }
        setProjectData(pData);

        const [leaveReqs, userAssets, allocSummary] = await Promise.all([
          listLeaveRequests({ userId }),
          listAssets({ userId }),
          getUserAllocationSummary(userId).catch(() => null),
        ]);
        setLeaves(leaveReqs);
        setAssets(userAssets);
        setAllocationSummary(allocSummary);
      } catch { /* ignore */ }
      finally { setDataLoading(false); }
    };
    fetchAll();
  }, [user]);

  const handleSaveCapacity = async () => {
    if (!user) return;
    const val = Number(capacityValue);
    if (val < 1 || val > 168) return;
    setSavingCapacity(true);
    try {
      const updated = await updateUserCapacity(user.id, val);
      setUser(updated);
      setEditingCapacity(false);
    } catch { /* ignore */ } finally { setSavingCapacity(false); }
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
          <div>
            <p className="text-xs text-gray-500">Weekly Capacity</p>
            {editingCapacity ? (
              <div className="flex items-center gap-1 mt-0.5">
                <input type="number" min={1} max={168} value={capacityValue} onChange={(e) => setCapacityValue(e.target.value)} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" autoFocus />
                <span className="text-xs text-gray-500">h/wk</span>
                <button onClick={handleSaveCapacity} disabled={savingCapacity} className="text-green-600 hover:text-green-800 text-xs font-medium">{savingCapacity ? '...' : 'Save'}</button>
                <button onClick={() => setEditingCapacity(false)} className="text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
              </div>
            ) : (
              <p className="text-sm font-medium text-gray-900">
                {user.weeklyCapacity}h/wk
                {canManageCapacity && (
                  <button onClick={() => { setEditingCapacity(true); setCapacityValue(String(user.weeklyCapacity)); }} className="ml-1 text-primary-600 hover:text-primary-800 text-xs">Edit</button>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {dataLoading && <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>}

      {/* Availability card */}
      {!dataLoading && availability && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>

          {/* Summary line */}
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm text-gray-600">{availability.weeklyCapacity}h/wk capacity</span>
            <span className="text-sm text-gray-400">·</span>
            <span className={`text-sm font-medium ${allocationColor(availability.totalAllocation)}`}>
              {availability.totalAllocation}% allocated ({availability.totalAllocatedHours.toFixed(0)}h/wk)
            </span>
          </div>

          {/* Workload bar */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden relative">
                {availability.totalAllocation <= 100 ? (
                  <div className={`h-full rounded-full ${allocationBgColor(availability.totalAllocation)}`} style={{ width: `${availability.totalAllocation}%` }} />
                ) : (
                  <>
                    <div className="absolute inset-y-0 left-0 bg-red-500 rounded-l-full" style={{ width: '100%' }} />
                    <div className="absolute inset-y-0 bg-red-400" style={{ left: '100%', width: `${availability.totalAllocation - 100}%`, maxWidth: '50%' }} />
                  </>
                )}
              </div>
              <span className={`text-sm font-semibold ${availableColor(availability.totalAvailableHours)}`}>
                {availability.totalAvailableHours < 0
                  ? `${availability.totalAvailableHours.toFixed(0)}h/wk over-allocated`
                  : availability.totalAvailableHours === 0
                    ? 'Fully allocated'
                    : `${availability.totalAvailableHours.toFixed(0)}h/wk available`}
              </span>
            </div>
          </div>

          {/* Upcoming leaves */}
          {availability.upcomingLeaves.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Upcoming Leave</p>
              <div className="space-y-1.5">
                {availability.upcomingLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">{formatDate(leave.startDate)}{leave.startDate !== leave.endDate ? ` – ${formatDate(leave.endDate)}` : ''}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${leave.type === 'VACATION' ? 'bg-blue-100 text-blue-700' : leave.type === 'SICK' ? 'bg-red-100 text-red-700' : leave.type === 'PERSONAL' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{leave.type}</span>
                    <span className="text-xs text-gray-400">{leave.workingDays}d</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly outlook */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Weekly Outlook</p>
            <div className="space-y-1">
              {availability.weeklyBreakdown.map((week) => {
                const isThisWeek = week.weekStart.getTime() <= new Date().getTime() && new Date().getTime() < week.weekStart.getTime() + 7 * 86400000;
                return (
                  <div key={week.weekLabel} className={`flex items-center gap-3 text-sm px-2 py-1 rounded ${isThisWeek ? 'bg-primary-50' : ''}`}>
                    <span className={`w-20 text-gray-500 ${isThisWeek ? 'font-semibold' : ''}`}>{week.weekLabel}{isThisWeek ? ' *' : ''}</span>
                    {week.fullyOnLeave ? (
                      <span className="text-blue-600 font-medium flex-1">On leave</span>
                    ) : (
                      <>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${week.availableHours > 0 ? 'bg-green-400' : week.availableHours === 0 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(Math.max(availability.weeklyCapacity > 0 ? (1 - week.availableHours / availability.weeklyCapacity) * 100 : 0, 0), 100)}%` }}
                          />
                        </div>
                        <span className={`w-32 text-right font-medium ${availableColor(week.availableHours)}`}>
                          {week.availableHours < 0
                            ? `${week.availableHours.toFixed(0)}h/wk over`
                            : `${week.availableHours.toFixed(0)}h/wk`}
                        </span>
                      </>
                    )}
                    {week.leaveDays > 0 && !week.fullyOnLeave && (
                      <span className="text-xs text-blue-500">{week.leaveDays}d leave</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Projects card — tasks grouped by project with evaluation and time */}
      {!dataLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
            {projectData.length > 0 && user && (
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${allocationColor(projectData.reduce((s, p) => s + p.allocation, 0))} ${projectData.reduce((s, p) => s + p.allocation, 0) > 100 ? 'bg-red-100' : projectData.reduce((s, p) => s + p.allocation, 0) > 80 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                  {projectData.reduce((s, p) => s + p.allocation, 0)}% across {projectData.length} project{projectData.length !== 1 ? 's' : ''}
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{(projectData.reduce((s, p) => s + p.allocation, 0) * user.weeklyCapacity / 100).toFixed(0)}h/wk committed · {user.weeklyCapacity}h/wk capacity</span>
              </div>
            )}
          </div>
          {projectData.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No project assignments found.</div>
          ) : (
            projectData.map(({ project, tasks, score, allocation, totalHours, taskHours }) => {
              const allocatedHw = user ? (allocation * user.weeklyCapacity / 100) : 0;
              return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200">
                {/* Project header */}
                <Link to={`/projects/${project.id}`} className="block px-5 py-4 hover:bg-gray-50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{project.key}</span>
                      <h4 className="font-semibold text-gray-900">{project.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${allocation >= 80 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{allocation}%</span>
                      <span className="text-xs text-gray-400">{allocatedHw.toFixed(0)}h/wk</span>
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
              );
            })
          )}
        </div>
      )}

      {/* Leaves and Assets side by side */}
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
        </div>
      )}
    </div>
  );
}