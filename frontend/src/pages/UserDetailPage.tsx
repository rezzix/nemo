import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { UserDto, ProjectDto, MemberDto, IssueDto, TimeLogDto, LeaveRequestDto, AssetDto, AssetType, AssetStatus } from '@/types';
import { getUser } from '@/api/users';
import { listProjects, getMembers } from '@/api/projects';
import { listProjectIssues } from '@/api/issues';
import { listTimeLogs } from '@/api/timeLogs';
import { listLeaveRequests } from '@/api/leave';
import { listAssets } from '@/api/assets';
import { useAuth } from '@/hooks/useAuth';
import { scoreLabel, scoreColor, roleBadgeColor, formatDate } from '@/utils/format';
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
const issueStatusColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('progress') || n.includes('active')) return 'bg-blue-100 text-blue-700';
  if (n.includes('done') || n.includes('closed') || n.includes('resolved')) return 'bg-green-100 text-green-700';
  if (n.includes('review')) return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-700';
};

interface ProjectData {
  project: ProjectDto;
  issues: IssueDto[];
  score: number | null;
  totalHours: number;
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

  const canSeeScores = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' || currentUser.role === 'EXECUTIVE' || currentUser.role === 'HR');

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

            const issues = await listProjectIssues(p.id, { assigneeId: userId });
            const logs = await listTimeLogs({ userId, size: 200 });
            const projectHours = logs
              .filter((l: TimeLogDto) => issues.some((i: IssueDto) => i.id === l.issueId))
              .reduce((sum: number, l: TimeLogDto) => sum + l.hours, 0);

            if (issues.length > 0 || member.score != null) {
              pData.push({
                project: p,
                issues,
                score: member.score,
                totalHours: projectHours,
              });
            }
          } catch { /* skip project */ }
        }
        setProjectData(pData);

        const [leaveReqs, userAssets] = await Promise.all([
          listLeaveRequests({ userId }),
          listAssets({ userId }),
        ]);
        setLeaves(leaveReqs);
        setAssets(userAssets);
      } catch { /* ignore */ }
      finally { setDataLoading(false); }
    };
    fetchAll();
  }, [user]);

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

      {/* Projects card — issues grouped by project with evaluation and time */}
      {!dataLoading && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
          {projectData.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No project assignments found.</div>
          ) : (
            projectData.map(({ project, issues, score, totalHours }) => (
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
                      <span>{issues.length} issue{issues.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </Link>

                {/* Issues under this project */}
                {issues.length > 0 && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {issues.map((issue) => (
                      <Link
                        key={issue.id}
                        to={`/projects/${issue.projectId}/issues/${issue.id}`}
                        className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs text-gray-400">{issue.issueKey}</span>
                          <span className="text-sm text-gray-900 truncate">{issue.title}</span>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${issueStatusColor(issue.statusName)}`}>
                          {issue.statusName}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))
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