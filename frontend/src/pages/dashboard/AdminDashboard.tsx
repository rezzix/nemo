import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { listProjects } from '@/api/projects';
import { listAllUsers } from '@/api/users';
import { listCompanies } from '@/api/companies';
import { getOrganization } from '@/api/organization';
import { listIssueTypes, listIssueStatuses } from '@/api/admin';
import BarChart from '@/pages/reports/BarChart';
import { stageBadge, stageLabel } from '@/utils/format';
import type { ProjectDto, UserDto, CompanyDto, OrganizationConfig, IssueTypeDto, IssueStatusDto } from '@/types';
import client from '@/api/client';
import Spinner from '@/components/common/Spinner';

interface AuditEntry {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  performedBy: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [org, setOrg] = useState<OrganizationConfig | null>(null);
  const [issueTypes, setIssueTypes] = useState<IssueTypeDto[]>([]);
  const [issueStatuses, setIssueStatuses] = useState<IssueStatusDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listAllUsers({ size: 200 }).then(setUsers),
      listCompanies().then((res) => setCompanies(res.data)),
      listProjects().then(setProjects),
      getOrganization().then(setOrg).catch(() => {}),
      listIssueTypes().then(setIssueTypes),
      listIssueStatuses().then(setIssueStatuses),
      client.get('/audit-logs?size=10').then((res: { data: { data?: AuditEntry[]; content?: AuditEntry[] } }) => {
        const d = res.data;
        const entries = d?.data ?? d?.content ?? [];
        setAuditLogs(Array.isArray(entries) ? entries : []);
      }).catch(() => {}),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  const activeUsers = users.filter((u) => u.active).length;
  const userByCompany = [...companies]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((c) => ({
      label: c.name,
      value: users.filter((u) => u.companyId === c.id).length,
      color: 'bg-primary-500',
    }));
  const globalUsers = users.filter((u) => u.companyId === null).length;
  if (globalUsers > 0) {
    userByCompany.unshift({ label: 'Global', value: globalUsers, color: 'bg-purple-500' });
  }

  const stats = [
    { label: 'Total Users', value: users.length, color: 'bg-primary-50 text-primary-700' },
    { label: 'Active Users', value: activeUsers, color: 'bg-green-50 text-green-700' },
    { label: 'Companies', value: companies.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'Projects', value: projects.length, color: 'bg-amber-50 text-amber-700' },
  ];

  const actionLabels: Record<string, string> = {
    CREATE: 'Created',
    UPDATE: 'Updated',
    DELETE: 'Deleted',
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {user ? `Welcome back, ${user.firstName}` : 'Welcome'}
        </h2>
        <p className="text-gray-500 mt-1">System administration overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Users by Company */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Company</h3>
        <BarChart items={userByCompany} maxValue={Math.max(...userByCompany.map((i) => i.value), 1)} />
      </div>

      {/* Recent Audit Log */}
      {auditLogs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Entity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.entityType} #{log.entityId}
                    </td>
                    <td className="px-4 py-3 text-gray-500">User #{log.performedBy}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(log.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {org && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Organization</h4>
            <p className="text-lg font-semibold text-gray-900">{org.name}</p>
            {org.address && <p className="text-sm text-gray-500">{org.address}</p>}
            {org.website && <p className="text-sm text-primary-600">{org.website}</p>}
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Issue Types</h4>
          <div className="flex flex-wrap gap-1.5">
            {issueTypes.map((t) => (
              <span key={t.id} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">{t.name}</span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Issue Statuses</h4>
          <div className="flex flex-wrap gap-1.5">
            {issueStatuses.map((s) => (
              <span key={s.id} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">{s.name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* All Projects */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Projects</h3>
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Key</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Stage</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Manager</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    <Link to={`/projects/${project.id}`} className="hover:text-primary-600">{project.key}</Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link to={`/projects/${project.id}`} className="hover:text-primary-600">{project.name}</Link>
                  </td>
                  <td className="px-4 py-3">
                    {project.stage && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge(project.stage)}`}>
                        {stageLabel(project.stage)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{project.managerName}</td>
                  <td className="px-4 py-3 text-gray-500">{project.companyName || 'Global'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}