import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listAllUsers } from '@/api/users';
import { listCompanies } from '@/api/companies';
import { getMembers } from '@/api/projects';
import { listProjects } from '@/api/projects';
import type { UserDto, CompanyDto, ProjectDto } from '@/types';
import { getInitials, roleBadgeColor } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

export default function PeoplePage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [memberMap, setMemberMap] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('active');
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      listAllUsers({ size: 500 }).catch(() => []),
      listCompanies().then((res) => res.data).catch(() => ({ data: [] })),
      listProjects().catch(() => []),
    ]).then(async ([userList, companyRes, projectList]) => {
      setUsers(userList);
      const companyData = Array.isArray(companyRes) ? companyRes : (companyRes as { data: CompanyDto[] }).data;
      setCompanies(companyData || []);
      setProjects(projectList);

      const mMap: Record<number, string[]> = {};
      for (const p of projectList) {
        try {
          const members = await getMembers(p.id);
          for (const m of members) {
            if (!mMap[m.userId]) mMap[m.userId] = [];
            if (!mMap[m.userId].includes(p.name)) mMap[m.userId].push(p.name);
          }
        } catch { /* ignore */ }
      }
      setMemberMap(mMap);
      setLoading(false);
    });
  }, []);

  const externalUsers = useMemo(() => users.filter((u) => u.role === 'EXTERNAL'), [users]);
  const companyUsers = useMemo(() => users.filter((u) => u.role !== 'EXTERNAL'), [users]);

  // Build ordered tabs: Global → companies (by order field) → All → Externals
  const tabs = useMemo(() => {
    const sorted = [...companies].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    const companyOrder = sorted.map((c) => c.name);
    const userCompanyNames = Array.from(new Set(companyUsers.map((u) => u.companyName ?? 'Global')));
    const extraCompanyNames = userCompanyNames.filter((n) => n !== 'Global' && !companyOrder.includes(n));

    const result: { key: string; label: string }[] = [];
    if (userCompanyNames.includes('Global')) result.push({ key: 'Global', label: 'Global' });
    for (const name of companyOrder) {
      if (userCompanyNames.includes(name)) result.push({ key: name, label: name });
    }
    for (const name of extraCompanyNames) result.push({ key: name, label: name });
    result.push({ key: 'All', label: 'All' });
    if (externalUsers.length > 0) result.push({ key: 'Externals', label: 'Externals' });
    return result;
  }, [companies, companyUsers, externalUsers]);

  const currentTab = activeTab ?? tabs[0]?.key ?? 'Global';

  const filteredUsers = useMemo(() => {
    let list: UserDto[];
    if (currentTab === 'Externals') {
      list = [...externalUsers];
    } else if (currentTab === 'All') {
      list = [...companyUsers];
    } else {
      list = companyUsers.filter((u) => (u.companyName ?? 'Global') === currentTab);
    }

    if (filterActive === 'active') list = list.filter((u) => u.active);
    else if (filterActive === 'inactive') list = list.filter((u) => !u.active);
    if (filterRole) list = list.filter((u) => u.role === filterRole);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.jobTitle || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [currentTab, externalUsers, companyUsers, search, filterRole, filterActive]);

  const roles = currentTab === 'Externals'
    ? ['EXTERNAL']
    : ['ADMIN', 'MANAGER', 'EXECUTIVE', 'HR', 'CONTRIBUTOR'];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">People</h2>

      {/* Tabs: Global → Companies → All → Externals */}
      {tabs.length > 1 && (
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 overflow-x-auto whitespace-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  currentTab === tab.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, title, department..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All roles</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="">All</option>
        </select>
        <span className="text-sm text-gray-500">{filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}</span>
      </div>

      {/* People Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Link key={user.id} to={`/people/${user.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 transition-colors block">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {getInitials(user.firstName, user.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</h3>
                <p className="text-xs text-gray-500 truncate">{user.username}</p>
                {user.jobTitle && <p className="text-sm text-gray-700 mt-0.5">{user.jobTitle}</p>}
                {user.department && <p className="text-xs text-gray-500">{user.department}</p>}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadgeColor(user.role)}`}>{user.role}</span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.903m-17.25 0c.095 0 .19.015.283.043l5.31 1.582a.75.75 0 00.425 0l5.31-1.582A.75.75 0 0012.75 6.75" /></svg>
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.815.484-1.217.256a11.843 11.843 0 01-5.424-5.424c-.228-.402-.12-.935.256-1.217l1.293-.97c.363-.271.527-.733.417-1.173L6.543 7.602a1.125 1.125 0 00-1.091-.852H4.125A2.25 2.25 0 001.875 9v2.25z" /></svg>
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                <span>{user.companyName || 'Global'}</span>
              </div>
              {user.hireDate && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  <span>Hired {new Date(user.hireDate + 'T00:00:00').toLocaleDateString()}</span>
                </div>
              )}
            </div>
            {memberMap[user.id] && memberMap[user.id].length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {memberMap[user.id].map((pName) => (
                    <span key={pName} className="px-2 py-0.5 rounded text-xs bg-primary-50 text-primary-700">{pName}</span>
                  ))}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">No people found matching your filters.</div>
      )}
    </div>
  );
}