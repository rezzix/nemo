import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProjectDto, ProgramDto, UserDto, CompanyDto, ClientDto } from '@/types';
import { listProjects, createProject, toggleProjectFavorite } from '@/api/projects';
import { listPrograms } from '@/api/admin';
import { listCompanies } from '@/api/companies';
import { listClients } from '@/api/clients';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';
import { listAllUsers } from '@/api/users';
import { extractValidationErrors } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, stageBadge } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const toggleFavorite = async (project: ProjectDto) => {
    const newFav = !project.favorite;
    setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, favorite: newFav } : p));
    try {
      const updated = await toggleProjectFavorite(project.id);
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, favorite: updated.favorite } : p));
    } catch {
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, favorite: project.favorite } : p));
    }
  };

  const favorites = projects.filter((p) => p.favorite);
  const others = projects.filter((p) => !p.favorite);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Create Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          {favorites.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Favorites</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-primary-200 p-5 hover:shadow-md transition-shadow cursor-pointer relative group"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(p); }}
                      className="absolute top-3 right-3 text-yellow-500 hover:text-yellow-600"
                      title="Remove from favorites"
                    >
                      <StarIcon filled />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{p.key}</span>
                      {p.stage && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge(p.stage)}`}>{p.stage}</span>}
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 mb-1">{p.name}</h4>
                    {p.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{p.programName ?? '—'}</span>
                      <span>{p.companyName ?? 'Global'}</span>
                      <span>{p.managerName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-8 px-4 py-3"></th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500">Key</th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500">Program</th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500">Company</th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500">Manager</th>
                  <th className="text-left px-2 py-3 font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {others.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(p); }}
                        className="text-gray-300 hover:text-yellow-500"
                        title="Add to favorites"
                      >
                        <StarIcon />
                      </button>
                    </td>
                    <td className="px-2 py-3 font-mono text-xs text-primary-600">{p.key}</td>
                    <td className="px-2 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-2 py-3 text-gray-500">{p.programName ?? '—'}</td>
                    <td className="px-2 py-3">{p.companyName ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{p.companyName}</span> : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Global</span>}</td>
                    <td className="px-2 py-3 text-gray-500">{p.managerName}</td>
                    <td className="px-2 py-3 text-gray-500">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
                {others.length === 0 && favorites.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No projects found.</td></tr>
                )}
                {others.length === 0 && favorites.length > 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-xs">All projects are favorites</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showCreate && <CreateProjectModal onClose={() => { setShowCreate(false); fetchProjects(); }} />}
    </div>
  );
}

function StarIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.682 20.557a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [programId, setProgramId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [stage, setStage] = useState('INITIATION');
  const [strategicScore, setStrategicScore] = useState('');
  const [budget, setBudget] = useState('');
  const [targetStartDate, setTargetStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [clientId, setClientId] = useState('');
  const isGlobalUser = !user?.companyId;
  const [companyId, setCompanyId] = useState<string>(user?.companyId ? String(user.companyId) : '');
  const [showCompany, setShowCompany] = useState(true);
  const [showGlobal, setShowGlobal] = useState(false);
  const [showExternal, setShowExternal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listPrograms().then((res) => {
      setPrograms(res.data);
    }).catch(() => setLoadError('Failed to load programs. You may not have permission.'));
    listAllUsers({ active: 'true' }).then((users) => {
      setUsers(users);
      if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
        setManagerId(String(user.id));
      }
    }).catch(() => setLoadError('Failed to load users. You may not have permission.'));
    listCompanies().then((res) => setCompanies(res.data.filter((c) => c.active))).catch(() => {});
    listClients({ size: 200 }).then((res) => setClients(res.data)).catch(() => {});
  }, []);

  const selectedCompany = companies.find((c) => String(c.id) === companyId);
  const filteredUsers = users.filter((u) => {
    if (!u.active) return false;
    if (showCompany && selectedCompany && u.companyId === selectedCompany.id) return true;
    if (showGlobal && u.companyId === null && u.role !== 'EXTERNAL') return true;
    if (showExternal && u.role === 'EXTERNAL') return true;
    return false;
  });

  const filteredClients = clients.filter((c) => {
    if (!companyId) return c.companyId === null;
    return c.companyId === null || (selectedCompany && c.companyId === selectedCompany.id);
  });

  const eligibleManagers = users.filter((u) => {
    if (!u.active) return false;
    if (u.role !== 'ADMIN' && u.role !== 'MANAGER') return false;
    if (selectedCompany && u.companyId === selectedCompany.id) return true;
    if (u.companyId === null) return true;
    return false;
  });

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!/^[A-Z][A-Z0-9]*$/.test(key.toUpperCase())) {
      errors.key = 'Key must start with a letter and contain only letters and numbers';
    }
    if (key.length < 2) {
      errors.key = 'Key must be at least 2 characters';
    }
    if (strategicScore && (Number(strategicScore) < 1 || Number(strategicScore) > 10)) {
      errors.strategicScore = 'Strategic score must be between 1 and 10';
    }
    if (budget && isNaN(Number(budget))) {
      errors.budget = 'Budget must be a number';
    }
    if (targetStartDate && targetEndDate && targetEndDate < targetStartDate) {
      errors.targetEndDate = 'End date must be after start date';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const project = await createProject({
        name,
        key: key.toUpperCase(),
        description: description || undefined,
        programId: programId ? Number(programId) : undefined,
        managerId: Number(managerId),
        companyId: companyId ? Number(companyId) : null,
        clientId: clientId ? Number(clientId) : null,
        memberIds: memberIds.length > 0 ? memberIds : undefined,
        stage: stage || undefined,
        strategicScore: strategicScore ? Number(strategicScore) : undefined,
        budget: budget || undefined,
        targetStartDate: targetStartDate || undefined,
        targetEndDate: targetEndDate || undefined,
      });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      const serverErrors = extractValidationErrors(err);
      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
      } else {
        setError('Failed to create project. Check the details and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleMember = (userId: number) => {
    setMemberIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  return (
    <Modal title="Create Project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        {loadError && <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg px-3 py-2">{loadError}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Name" value={name} onChange={setName} required className="col-span-2" error={fieldErrors.name} />
          <Field label="Key" value={key} onChange={setKey} required maxLength={10} error={fieldErrors.key} />
        </div>
        <Field label="Description" value={description} onChange={setDescription} textarea />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— None —</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.key})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setClientId(''); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Global</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.key})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— None —</option>
              {filteredClients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.companyId === null ? ' (Global)' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {eligibleManagers.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.username}){u.companyId === null ? ' — Global' : ''}</option>)}
            </select>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">PMO Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="INITIATION">Initiation</option>
                <option value="PLANNING">Planning</option>
                <option value="EXECUTION">Execution</option>
                <option value="CLOSING">Closing</option>
              </select>
            </div>
            <Field label="Strategic Score (1-10)" value={strategicScore} onChange={(v) => setStrategicScore(v.replace(/[^0-9]/g, ''))} error={fieldErrors.strategicScore} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <input type="text" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${fieldErrors.budget ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'}`} />
              {fieldErrors.budget && <p className="mt-1 text-sm text-red-600">{fieldErrors.budget}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={targetStartDate} onChange={(e) => setTargetStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${fieldErrors.targetEndDate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'}`} />
              {fieldErrors.targetEndDate && <p className="mt-1 text-sm text-red-600">{fieldErrors.targetEndDate}</p>}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Members</label>
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={showCompany} onChange={() => setShowCompany(!showCompany)} className="rounded border-gray-300 text-primary-600" />
              <span>Company</span>
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={showGlobal} onChange={() => setShowGlobal(!showGlobal)} className="rounded border-gray-300 text-primary-600" />
              <span>Global</span>
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={showExternal} onChange={() => setShowExternal(!showExternal)} className="rounded border-gray-300 text-primary-600" />
              <span>External</span>
            </label>
          </div>
          <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">No users match the selected filters</p>
            ) : filteredUsers.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                <input type="checkbox" checked={memberIds.includes(u.id)} onChange={() => toggleMember(u.id)} className="rounded border-gray-300" />
                <span>{u.firstName} {u.lastName} ({u.username})</span>
                <span className={`text-xs ml-auto px-1.5 py-0.5 rounded ${u.role === 'EXTERNAL' ? 'bg-gray-100 text-gray-500' : u.companyId === null ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role === 'EXTERNAL' ? 'Ext' : u.companyId === null ? 'Global' : u.role}</span>
              </label>
            ))}
          </div>
        </div>
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