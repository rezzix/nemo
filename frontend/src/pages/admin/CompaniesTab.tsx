import { useState, useEffect, useCallback } from 'react';
import type { CompanyDto, OrganizationConfig } from '@/types';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';
import Spinner from '@/components/common/Spinner';
import { listCompanies, createCompany, updateCompany } from '@/api/companies';
import { getOrganization, updateOrganization } from '@/api/admin';

function SpinnerWrapper() {
  return (
    <div className="flex items-center justify-center h-32">
      <Spinner className="h-6 w-6 text-primary-600" />
    </div>
  );
}

const LOGO_COLORS: Record<string, string> = {
  A: 'bg-red-500', B: 'bg-blue-500', C: 'bg-green-500', D: 'bg-yellow-500',
  E: 'bg-purple-500', F: 'bg-pink-500', G: 'bg-indigo-500', H: 'bg-orange-500',
  I: 'bg-teal-500', J: 'bg-cyan-500', K: 'bg-rose-500', L: 'bg-emerald-500',
  M: 'bg-violet-500', N: 'bg-amber-500', O: 'bg-lime-500', P: 'bg-sky-500',
  Q: 'bg-fuchsia-500', R: 'bg-slate-500', S: 'bg-zinc-500', T: 'bg-red-600',
  U: 'bg-blue-600', V: 'bg-green-600', W: 'bg-yellow-600', X: 'bg-purple-600',
  Y: 'bg-pink-600', Z: 'bg-indigo-600',
};

export default function CompaniesTab() {
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [org, setOrg] = useState<OrganizationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyDto | null>(null);
  const [editingOrg, setEditingOrg] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, orgData] = await Promise.all([listCompanies(), getOrganization()]);
      const sorted = [...res.data].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setCompanies(sorted);
      setOrg(orgData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      {loading ? <SpinnerWrapper /> : (
        <>
          {/* Organization card — full width, horizontal layout */}
          {org && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-5 p-5">
                <div className="h-20 w-20 shrink-0 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                  {org.logo ? (
                    <img src={org.logo} alt={org.name} className="h-20 w-20 object-contain" />
                  ) : (
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white text-xl font-bold ${LOGO_COLORS[org.name.charAt(0).toUpperCase()] || 'bg-gray-500'}`}>
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">Organization</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {org.address && (
                      <div className="flex items-start gap-1.5 text-sm text-gray-500">
                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span>{org.address}</span>
                      </div>
                    )}
                    {org.website && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.8-9-2.253m18 0A9 9 0 003 12" />
                        </svg>
                        <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 truncate">{org.website}</a>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setEditingOrg(true)} className="text-primary-600 hover:text-primary-800 text-sm font-medium shrink-0">
                  Edit
                </button>
              </div>
            </div>
          )}

          {/* Companies grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="h-[120px] bg-gray-50 flex items-center justify-center overflow-hidden">
                  {c.logo ? (
                    <img src={c.logo} alt={c.name} className="h-[120px] w-full object-contain" />
                  ) : (
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ${LOGO_COLORS[c.name.charAt(0).toUpperCase()] || 'bg-gray-500'}`}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{c.name}</h3>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 font-mono">{c.key}</span>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <button onClick={() => setEditingCompany(c)} className="text-primary-600 hover:text-primary-800 text-sm font-medium shrink-0">
                      Edit
                    </button>
                  </div>
                  {c.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{c.description}</p>
                  )}
                  <div className="mt-3 space-y-1.5">
                    {c.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span>{c.address}</span>
                      </div>
                    )}
                    {c.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.8-9-2.253m18 0A9 9 0 003 12" />
                        </svg>
                        <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800 truncate">{c.website}</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {companies.length === 0 && !loading && (
              <div className="col-span-full text-center text-gray-500 py-8">No companies found.</div>
            )}
          </div>
        </>
      )}

      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          Create Company
        </button>
      </div>

      {showCreate && <CreateCompanyModal onClose={() => { setShowCreate(false); fetchData(); }} />}
      {editingCompany && <EditCompanyModal company={editingCompany} onClose={() => { setEditingCompany(null); fetchData(); }} />}
      {editingOrg && org && <EditOrgModal org={org} onClose={() => { setEditingOrg(false); fetchData(); }} />}
    </div>
  );
}

function EditOrgModal({ org, onClose }: { org: OrganizationConfig; onClose: () => void }) {
  const [name, setName] = useState(org.name);
  const [address, setAddress] = useState(org.address ?? '');
  const [website, setWebsite] = useState(org.website ?? '');
  const [logo, setLogo] = useState(org.logo ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateOrganization({ name, address: address || undefined, website: website || undefined, logo: logo || undefined });
      onClose();
    } catch {
      setError('Failed to update organization.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit Organization" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Organization Name" value={name} onChange={setName} required />
        <Field label="Address" value={address} onChange={setAddress} textarea />
        <Field label="Website" value={website} onChange={setWebsite} />
        <Field label="Logo URL" value={logo} onChange={setLogo} />
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

function CreateCompanyModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createCompany({
        name, key: key.toUpperCase(), description: description || undefined,
        address: address || undefined, website: website || undefined, logo: logo || undefined,
      });
      onClose();
    } catch {
      setError('Failed to create company. Key must be unique.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create Company" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Name" value={name} onChange={setName} required className="col-span-2" />
          <Field label="Key" value={key} onChange={setKey} required maxLength={10} />
        </div>
        <Field label="Description" value={description} onChange={setDescription} textarea />
        <Field label="Address" value={address} onChange={setAddress} />
        <Field label="Website" value={website} onChange={setWebsite} />
        <Field label="Logo URL" value={logo} onChange={setLogo} />
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

function EditCompanyModal({ company, onClose }: { company: CompanyDto; onClose: () => void }) {
  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description ?? '');
  const [address, setAddress] = useState(company.address ?? '');
  const [website, setWebsite] = useState(company.website ?? '');
  const [logo, setLogo] = useState(company.logo ?? '');
  const [active, setActive] = useState(company.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateCompany(company.id, {
        name: name || undefined, description: description || undefined,
        address: address || undefined, website: website || undefined, logo: logo || undefined,
        active,
      });
      onClose();
    } catch {
      setError('Failed to update company.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit ${company.key}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Description" value={description} onChange={setDescription} textarea />
        <Field label="Address" value={address} onChange={setAddress} />
        <Field label="Website" value={website} onChange={setWebsite} />
        <Field label="Logo URL" value={logo} onChange={setLogo} />
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