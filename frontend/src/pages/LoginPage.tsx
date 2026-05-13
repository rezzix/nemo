import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getCaptcha } from '@/api/auth';
import { getPublicOrganization } from '@/api/organization';
import type { OrganizationConfig } from '@/types';
import Spinner from '@/components/common/Spinner';

const features = [
  { icon: '▸', label: 'Program & Portfolio Management' },
  { icon: '▸', label: 'Project Phases & Deliverables' },
  { icon: '▸', label: 'EVM & Budget Tracking' },
  { icon: '▸', label: 'RAID Logs & Risk Management' },
  { icon: '▸', label: 'Task Tracking & Kanban Boards' },
  { icon: '▸', label: 'Sprint Planning' },
  { icon: '▸', label: 'Time Tracking & Timesheets' },
  { icon: '▸', label: 'Wiki Docs & Mermaid Diagrams' },
  { icon: '▸', label: 'Reports & Dashboards' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [org, setOrg] = useState<OrganizationConfig | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [version, setVersion] = useState('');
  const [build, setBuild] = useState('');
  const { login, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const fetchCaptcha = () => {
    getCaptcha().then((res) => {
      setCaptchaQuestion(res.question);
      setCaptchaAnswer('');
    }).catch(() => {});
  };

  useEffect(() => {
    getPublicOrganization().then((res) => {
      if (res) {
        setOrg(res.organization);
        setDevMode(res.devmode);
        setVersion(res.version);
        setBuild(res.build);
        if (!res.devmode) fetchCaptcha();
      }
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password, devMode ? undefined : captchaAnswer);
      navigate(from, { replace: true });
    } catch {
      if (!devMode) fetchCaptcha();
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900 tracking-tight">Nemo</span>
            {(version || build) && (
              <span className="text-xs text-gray-400 font-mono">
                v{version}{build && `+${build}`}
              </span>
            )}
          </div>
          {devMode && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              DevMode
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left branded panel — hidden on mobile */}
        <div className="hidden md:flex md:w-[40%] lg:w-[45%] bg-primary-600 flex-col justify-between p-10 lg:p-14">
          <div>
            <div className="flex items-center gap-3 mb-12">
              {org?.logo ? (
                <img src={org.logo} alt={org.name} className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center text-lg font-bold backdrop-blur-sm">
                  N
                </div>
              )}
              <span className="text-xl font-bold text-white tracking-tight">{org?.name ?? 'Nemo'}</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
              Multi-Company<br />Project Management
            </h2>
            <p className="text-primary-200 text-sm lg:text-base leading-relaxed max-w-xs">
              Coordinate programs, track deliverables, manage risks, and drive projects across your organization.
            </p>
          </div>

          <ul className="space-y-2.5">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 text-primary-100 text-sm lg:text-base">
                <span className="text-primary-300 font-medium">{f.icon}</span>
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-sm">
            {/* Mobile-only logo */}
            <div className="flex md:hidden items-center gap-2.5 mb-8 justify-center">
              {org?.logo ? (
                <img src={org.logo} alt={org.name} className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center text-lg font-bold">
                  N
                </div>
              )}
              <span className="text-xl font-bold text-gray-900 tracking-tight">{org?.name ?? 'Nemo'}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500 mb-7">Sign in to your workspace</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearError(); }}
                  required
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  required={!devMode}
                  minLength={devMode ? undefined : 6}
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                  placeholder={devMode ? 'Any password works in dev mode' : 'Enter your password'}
                />
                {devMode && (
                  <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    DevMode active — any password is accepted for existing users.
                  </p>
                )}
              </div>

              {!devMode && captchaQuestion && (
                <div>
                  <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Verify: {captchaQuestion} = ?
                  </label>
                  <input
                    id="captcha"
                    type="text"
                    inputMode="numeric"
                    value={captchaAnswer}
                    onChange={(e) => { setCaptchaAnswer(e.target.value); clearError(); }}
                    required
                    autoComplete="off"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                    placeholder="Enter the answer"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {isLoading && <Spinner className="h-4 w-4" />}
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer with org info */}
      {org && (
        <footer className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-3">
              {org.logo && <img src={org.logo} alt={org.name} className="h-6 w-6 rounded object-cover" />}
              <span className="font-medium text-gray-700">{org.name}</span>
              {org.address && <span className="hidden sm:inline">· {org.address}</span>}
            </div>
            <div className="flex items-center gap-4">
              {org.website && (
                <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                  {org.website}
                </a>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}