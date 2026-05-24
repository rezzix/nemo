import { useState, useEffect, useCallback } from 'react';
import type { UserDto, AdminUpdateUserRequest, CompanyDto, ProjectDto } from '@/types';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Spinner from '@/components/common/Spinner';
import {
  listUsers, createUser, adminUpdateUser, deactivateUser,
} from '@/api/admin';
import { listCompanies } from '@/api/companies';
import { listProjects } from '@/api/projects';

export default function UsersTab() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers();
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Group users by company (tabs), with externals as a separate tab
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showActive, setShowActive] = useState(true);
  const [companies, setCompanies] = useState<CompanyDto[]>([]);

  useEffect(() => {
    listCompanies().then((res) => {
      const sorted = [...res.data].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setCompanies(sorted);
    });
  }, []);

  const rolePriority: Record<string, number> = { ADMIN: 0, EXECUTIVE: 1, MANAGER: 2, HR: 3, CONTRIBUTOR: 4, EXTERNAL: 5 };
  const sortByRole = (a: UserDto, b: UserDto) => (rolePriority[a.role] ?? 5) - (rolePriority[b.role] ?? 5);

  const externalUsers = users.filter((u) => u.role === 'EXTERNAL');
  const companyUsers = users.filter((u) => u.role !== 'EXTERNAL');

  // Build ordered company list from fetched companies, then add any company names not in the list
  const companyOrder = companies.map((c) => c.name);
  const userCompanyNames = Array.from(new Set(companyUsers.map((u) => u.companyName ?? 'Global')));
  // Companies from user data not in the fetched companies list (e.g. "Global")
  const extraCompanyNames = userCompanyNames.filter((n) => n !== 'Global' && !companyOrder.includes(n));

  const tabs: { key: string; label: string }[] = [
    // Global users first
    ...(userCompanyNames.includes('Global') ? [{ key: 'Global', label: 'Global' }] : []),
    // Companies in their order
    ...companyOrder.filter((name) => userCompanyNames.includes(name)).map((c) => ({ key: c, label: c })),
    // Any companies not in the fetched list
    ...extraCompanyNames.map((c) => ({ key: c, label: c })),
    // Externals last
    ...(externalUsers.length > 0 ? [{ key: 'Externals', label: 'Externals' }] : []),
  ];

  // Default to first tab
  const currentTab = activeTab ?? tabs[0]?.key ?? '';
  const filteredUsers = (() => {
    if (currentTab === 'Externals') return [...externalUsers].sort(sortByRole);
    return [...companyUsers.filter((u) => (u.companyName ?? 'Global') === currentTab)].sort(sortByRole);
  })();
  const visibleUsers = filteredUsers.filter((u) => showActive ? u.active : !u.active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <span className={showActive ? 'text-gray-900 font-medium' : 'text-gray-400'}>Active</span>
            <button
              onClick={() => setShowActive(!showActive)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showActive ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <span className={!showActive ? 'text-gray-900 font-medium' : 'text-gray-400'}>Inactive</span>
          </label>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          Create User
        </button>
      </div>

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

      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {visibleUsers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No {showActive ? 'active' : 'inactive'} users in this group.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Username</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Dept</th>
                  {currentTab === 'Externals' && <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>}
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleUsers.map((u) => {
                  const isExternalGroup = currentTab === 'Externals';
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{u.jobTitle || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{u.department || '—'}</td>
                      {isExternalGroup && (
                        <td className="px-4 py-3">
                          {u.assignedProjectName ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">{u.assignedProjectName}</span>
                          ) : (
                            <span className="text-gray-400">{'—'}</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                          u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                          u.role === 'EXECUTIVE' ? 'bg-amber-100 text-amber-700' :
                          u.role === 'HR' ? 'bg-pink-100 text-pink-700' :
                          u.role === 'EXTERNAL' ? 'bg-teal-100 text-teal-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setEditingUser(u)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          {u.active ? (
                            <button
                              onClick={async () => {
                                setDeactivatingId(u.id);
                                try { await deactivateUser(u.id); fetchUsers(); } finally { setDeactivatingId(null); }
                              }}
                              disabled={deactivatingId === u.id}
                              className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                            >
                              {deactivatingId === u.id && <Spinner className="h-3 w-3" />}
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                setDeactivatingId(u.id);
                                try { await adminUpdateUser(u.id, { active: true }); fetchUsers(); } finally { setDeactivatingId(null); }
                              }}
                              disabled={deactivatingId === u.id}
                              className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                            >
                              {deactivatingId === u.id && <Spinner className="h-3 w-3" />}
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => { setShowCreate(false); fetchUsers(); }} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => { setEditingUser(null); fetchUsers(); }} />}
    </div>
  );
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('CONTRIBUTOR');
  const [companyId, setCompanyId] = useState<string>('');
  const [assignedProjectId, setAssignedProjectId] = useState<string>('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCompanies().then((res) => setCompanies(res.data.filter((c) => c.active)));
    listProjects({ size: 200 }).then(setProjects);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createUser({
        username, email, password, firstName, lastName, role,
        companyId: companyId ? Number(companyId) : null,
        assignedProjectId: assignedProjectId ? Number(assignedProjectId) : null,
        jobTitle: jobTitle || undefined,
        department: department || undefined,
        phone: phone || undefined,
        hireDate: hireDate || undefined,
      });
      onClose();
    } catch {
      setError('Failed to create user. Check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Username" value={username} onChange={setUsername} required />
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
        </div>
        <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First name" value={firstName} onChange={setFirstName} required />
          <Field label="Last name" value={lastName} onChange={setLastName} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="CONTRIBUTOR">Contributor</option>
            <option value="MANAGER">Manager</option>
            <option value="EXECUTIVE">Executive</option>
            <option value="ADMIN">Admin</option>
            <option value="HR">HR</option>
            <option value="EXTERNAL">External</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Job Title" value={jobTitle} onChange={setJobTitle} />
          <Field label="Department" value={department} onChange={setDepartment} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field label="Hire Date" type="date" value={hireDate} onChange={setHireDate} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Global</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.key})</option>)}
          </select>
        </div>
        {role === 'EXTERNAL' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Project</label>
            <select value={assignedProjectId} onChange={(e) => setAssignedProjectId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required>
              <option value="">Select a project...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.key})</option>)}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Create
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ user, onClose }: { user: UserDto; onClose: () => void }) {
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.active);
  const [companyId, setCompanyId] = useState<string>(user.companyId ? String(user.companyId) : '');
  const [assignedProjectId, setAssignedProjectId] = useState<string>(user.assignedProjectId ? String(user.assignedProjectId) : '');
  const [jobTitle, setJobTitle] = useState(user.jobTitle || '');
  const [department, setDepartment] = useState(user.department || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [hireDate, setHireDate] = useState(user.hireDate || '');
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCompanies().then((res) => setCompanies(res.data));
    listProjects({ size: 200 }).then(setProjects);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const req: AdminUpdateUserRequest = {
        email, firstName, lastName, role, active,
        companyId: companyId ? Number(companyId) : null,
        assignedProjectId: assignedProjectId ? Number(assignedProjectId) : null,
        jobTitle: jobTitle || undefined,
        department: department || undefined,
        phone: phone || undefined,
        hireDate: hireDate || undefined,
      };
      await adminUpdateUser(user.id, req);
      onClose();
    } catch {
      setError('Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First name" value={firstName} onChange={setFirstName} />
          <Field label="Last name" value={lastName} onChange={setLastName} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as UserDto['role'])} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="CONTRIBUTOR">Contributor</option>
            <option value="MANAGER">Manager</option>
            <option value="EXECUTIVE">Executive</option>
            <option value="ADMIN">Admin</option>
            <option value="EXTERNAL">External</option>
            <option value="HR">HR</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Job Title" value={jobTitle} onChange={setJobTitle} />
          <Field label="Department" value={department} onChange={setDepartment} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field label="Hire Date" type="date" value={hireDate} onChange={setHireDate} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Global</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.key})</option>)}
          </select>
        </div>
        {role === 'EXTERNAL' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Project</label>
            <select value={assignedProjectId} onChange={(e) => setAssignedProjectId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required>
              <option value="">Select a project...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.key})</option>)}
            </select>
          </div>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700">Active</span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Save
          </button>
        </div>
      </form>
    </Modal>
  );
}