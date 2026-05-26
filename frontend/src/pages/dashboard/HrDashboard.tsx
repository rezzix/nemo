import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listAllUsers } from '@/api/users';
import { listProjects, getMembers } from '@/api/projects';
import { listHolidays } from '@/api/holidays';
import { scoreLabel, scoreColor } from '@/utils/format';
import BarChart from '@/pages/reports/BarChart';
import type { UserDto, ProjectDto, HolidayDto } from '@/types';
import Spinner from '@/components/common/Spinner';

export default function HrDashboard() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [holidays, setHolidays] = useState<HolidayDto[]>([]);
  const [evaluations, setEvaluations] = useState<{ projectKey: string; projectName: string; username: string; fullName: string; score: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      listAllUsers({ size: 200 }).then(setUsers).catch(() => {}),
      listProjects().then(setProjects).catch(() => {}),
      listHolidays({ year: new Date().getFullYear() }).then(setHolidays).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (projects.length === 0) return;
    Promise.all(
      projects.map(async (p) => {
        try {
          const members = await getMembers(p.id);
          return members
            .filter((m) => m.score !== null && m.score !== undefined)
            .map((m) => ({ projectKey: p.key, projectName: p.name, username: m.username, fullName: m.fullName, score: m.score }));
        } catch { return []; }
      })
    ).then((results) => {
      setEvaluations(results.flat());
    });
  }, [projects]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  }

  const activeUsers = users.filter((u) => u.active);
  const upcomingHolidays = holidays
    .filter((h) => h.date >= new Date().toISOString().slice(0, 10))
    .slice(0, 5);

  // Users by company for chart
  const companyUserCounts: Record<string, number> = {};
  users.forEach((u) => {
    const name = u.companyName || 'Global';
    companyUserCounts[name] = (companyUserCounts[name] || 0) + 1;
  });

  const chartColors = ['bg-blue-500 text-white', 'bg-green-500 text-white', 'bg-purple-500 text-white', 'bg-amber-500 text-white', 'bg-pink-500 text-white', 'bg-teal-500 text-white'];
  const chartItems = Object.entries(companyUserCounts).map(([label, value], i) => ({
    label,
    value,
    color: chartColors[i % chartColors.length],
  }));

  const filteredUsers = selectedCompany
    ? users.filter((u) => (u.companyName || 'Global') === selectedCompany)
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">HR Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Users" value={String(users.length)} />
        <KpiCard label="Active Users" value={String(activeUsers.length)} />
        <KpiCard label="Companies" value={String(Object.keys(companyUserCounts).length)} />
        <KpiCard label="Upcoming Holidays" value={String(upcomingHolidays.length)} />
      </div>

      {/* Users by Company */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Users by Company</h3>
          {selectedCompany && (
            <button onClick={() => setSelectedCompany(null)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Clear selection</button>
          )}
        </div>
        <BarChart items={chartItems.map((item) => ({
          ...item,
          color: selectedCompany === item.label ? item.color : selectedCompany ? 'bg-gray-300 text-gray-700' : item.color,
        }))} maxValue={0} />
        <div className="flex flex-wrap gap-2 mt-3">
          {chartItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setSelectedCompany(selectedCompany === item.label ? null : item.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCompany === item.label
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label} ({item.value})
            </button>
          ))}
        </div>
        {selectedCompany ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Username</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Full Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                    <td className="px-4 py-3">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadgeColor(u.role)}`}>{u.role}</span>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No users in this company.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-400">Click a company above to view its users.</p>
        )}
      </div>

      {/* Evaluation Scores by Project */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Scores by Project</h3>
        {evaluations.length === 0 ? (
          <p className="text-sm text-gray-500">No evaluation scores recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {evaluations.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-primary-600">{e.projectKey}</span>
                      <span className="ml-2 text-gray-700">{e.projectName}</span>
                    </td>
                    <td className="px-4 py-3">{e.fullName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${e.score !== null ? scoreColor(e.score) : 'bg-gray-100 text-gray-600'}`}>
                        {e.score !== null ? `${e.score} — ${scoreLabel(e.score)}` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming Holidays */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Holidays</h3>
          <Link to="/holidays" className="text-sm text-primary-600 hover:text-primary-800 font-medium">Manage holidays</Link>
        </div>
        {upcomingHolidays.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming holidays.</p>
        ) : (
          <div className="space-y-2">
            {upcomingHolidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-900">{h.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{h.companyName || 'Global'}</span>
                </div>
                <span className="text-sm text-gray-600">{new Date(h.date + 'T00:00:00').toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function roleBadgeColor(role: string): string {
  switch (role) {
    case 'ADMIN': return 'bg-red-100 text-red-700';
    case 'MANAGER': return 'bg-blue-100 text-blue-700';
    case 'EXECUTIVE': return 'bg-purple-100 text-purple-700';
    case 'HR': return 'bg-pink-100 text-pink-700';
    case 'CONTRIBUTOR': return 'bg-green-100 text-green-700';
    case 'EXTERNAL': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}