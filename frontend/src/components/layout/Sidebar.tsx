import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getInitials } from '@/utils/format';
import { useEffect } from 'react';

type NavItem = { to: string; label: string; icon: React.FC<{ className?: string }> };
type NavSection = { header?: string; items: NavItem[] };

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const isMobile = useUIStore((s) => s.isMobile);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const closeMobileSidebar = useUIStore((s) => s.closeMobileSidebar);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isMobile) closeMobileSidebar();
  }, [location.pathname, isMobile, closeMobileSidebar]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isMobile && !sidebarOpen) return null;

  const role = user?.role;
  const isExternal = role === 'EXTERNAL';

  const sections: NavSection[] = [
    {
      items: [
        { to: '/', label: 'Dashboard', icon: DashboardIcon },
        ...(role === 'ADMIN' ? [{ to: '/admin', label: 'Admin', icon: AdminIcon }] : []),
        ...(role !== 'ADMIN' ? [{ to: '/projects', label: 'Projects', icon: ProjectsIcon }] : []),
        ...(!isExternal && (role === 'ADMIN' || role === 'MANAGER' || role === 'EXECUTIVE' || role === 'HR')
          ? [{ to: '/programs', label: 'Programs', icon: ProgramsIcon }]
          : []),
        ...(role === 'HR' || role === 'EXECUTIVE'
          ? [{ to: '/people', label: 'People', icon: PeopleIcon }]
          : []),
        ...(role === 'ADMIN' || role === 'HR'
          ? [{ to: '/assets', label: 'Assets', icon: AssetsIcon }]
          : []),
        ...(role === 'MANAGER' || role === 'EXECUTIVE' || role === 'HR'
          ? [{ to: '/clients', label: 'Clients', icon: ClientsIcon }]
          : []),
        ...(role === 'MANAGER' || role === 'EXECUTIVE' || role === 'HR'
          ? [{ to: '/presales', label: 'Pre-Sales', icon: PresalesIcon }]
          : []),
      ],
    },
    ...(!isExternal && role !== 'EXECUTIVE' ? [{
      header: 'Time' as string | undefined,
      items: [
        ...(role !== 'HR' ? [{ to: '/my-time', label: 'My Time', icon: TimeIcon }] : []),
        ...(role === 'ADMIN' || role === 'MANAGER' || role === 'HR'
          ? [{ to: '/timesheets', label: 'Timesheets', icon: TimesheetIcon }]
          : []),
      ],
    }] : []),
    ...(!isExternal ? [{
      header: undefined as string | undefined,
      items: [
        { to: '/leave', label: 'Leave', icon: LeaveIcon },
      ],
    }] : []),
    ...(role === 'HR' ? [{
      header: 'HR' as string | undefined,
      items: [
        { to: '/holidays', label: 'Holidays', icon: HolidayIcon },
      ],
    }] : []),
    ...(!isExternal ? [{
      header: 'Insights' as string | undefined,
      items: [
        ...(role === 'ADMIN' || role === 'MANAGER' || role === 'EXECUTIVE' || role === 'HR'
          ? [{ to: '/reports', label: 'Reports', icon: ReportsIcon }]
          : []),
      ],
    }] : []),
  ].filter((s) => s.items.length > 0);

  return (
    <aside
      className={`bg-sidebar text-white flex flex-col transition-all duration-200 ${
        isMobile ? 'w-60' : collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-bold text-sm">
          N
        </div>
        {(!collapsed || isMobile) && (
          <span className="font-semibold text-lg">Nemo</span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.header && (!collapsed || isMobile) && (
              <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {section.header}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {(!collapsed || isMobile) && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {user && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3">
            <NavLink
              to="/profile"
              className="flex items-center gap-3 flex-1 min-w-0 group"
              title="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs font-medium shrink-0 group-hover:bg-primary-600 transition-colors">
                {getInitials(user.firstName, user.lastName)}
              </div>
              {(!collapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-white transition-colors">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{user.role}</p>
                </div>
              )}
            </NavLink>
            {(!collapsed || isMobile) && (
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function ProjectsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-18 0A2.25 2.25 0 004.5 15.75h15a2.25 2.25 0 002.25-2.25V12m-18 0V6A2.25 2.25 0 014.5 3.75h15A2.25 2.25 0 0121.75 6v6" />
    </svg>
  );
}

function TimeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TimesheetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m7.5-12.75c0-.621-.504-1.125-1.125-1.125H5.625c-.621 0-1.125.504-1.125 1.125m13.5 0v1.5c0 .621-.504 1.125-1.125 1.125M5.625 4.5h12.75c.621 0 1.125.504 1.125 1.125M4.875 7.5h14.25M10.5 10.875h2.25M10.5 14.25h2.25" />
    </svg>
  );
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function AdminIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.297-1.06.562-1.54.375-.68.945-1.28 1.844-1.28.9 0 1.47.6 1.844 1.28.265.48.472 1 .562 1.54.292.025.574.072.84.14.72.18 1.35.51 1.86.94.52.44.9.99 1.15 1.6.25.61.34 1.29.26 1.97-.08.67-.32 1.31-.69 1.87-.37.56-.87 1.03-1.47 1.38.1.57.1 1.16 0 1.73-.1.67-.35 1.3-.74 1.84-.39.54-.9.97-1.5 1.26-.6.29-1.27.43-1.95.41-.68-.02-1.34-.2-1.93-.54l-.22-.13-.22.13c-.59.34-1.25.52-1.93.54-.68.02-1.35-.12-1.95-.41-.6-.29-1.11-.72-1.5-1.26-.39-.54-.64-1.17-.74-1.84-.1-.57-.1-1.16 0-1.73-.6-.35-1.1-.82-1.47-1.38-.37-.56-.61-1.2-.69-1.87-.08-.68.01-1.36.26-1.97.25-.61.63-1.16 1.15-1.6.51-.43 1.14-.76 1.86-.94.266-.068.548-.115.84-.14z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 0h.008v.008H12v-.008zm0 0H9m3 0h3" />
    </svg>
  );
}

function ProgramsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

function HolidayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.785-3.072M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function LeaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.181a48.413 48.413 0 00-8.048 0 2.25 2.25 0 00-1.976 2.181V15.75M9 18.75H6a2.25 2.25 0 01-2.25-2.25V6.108c0-1.135.845-2.098 1.976-2.181a48.413 48.413 0 018.048 0 2.25 2.25 0 011.976 2.181V15.75" />
    </svg>
  );
}

function AssetsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.75 7.5h16.5" />
    </svg>
  );
}

function ClientsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.001A9.375 9.375 0 0112 21.75c-2.527 0-4.87-.82-6.75-2.21M12 21.75c1.755 0 3.392-.47 4.808-1.289M12 21.75a9.375 9.375 0 01-6.75-2.21m0 0A4.125 4.125 0 018.25 15.375M15 19.128a9.375 9.375 0 00-3-5.613M9 9.375a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0z" />
    </svg>
  );
}

function PresalesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.875c0-.621.91-1.092 1.607-.792l3.403 1.495a3.75 3.75 0 002.58 0l3.403-1.495c.697-.3 1.607.171 1.607.792v8.25c0 .621-.91 1.092-1.607.792l-3.403-1.495a3.75 3.75 0 00-2.58 0L5.357 13.868c-.697.3-1.607-.171-1.607-.792V4.875zM15.75 3.75v12M18.75 3.75v12" />
    </svg>
  );
}