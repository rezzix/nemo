import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getInitials } from '@/utils/format';

export default function TopBar({ title, version, mode }: { title: string; version?: string; mode?: string }) {
  const user = useAuthStore((s) => s.user);
  const isMobile = useUIStore((s) => s.isMobile);
  const openMobileSidebar = useUIStore((s) => s.openMobileSidebar);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={isMobile ? openMobileSidebar : toggleSidebar}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex items-baseline gap-1.5">
          {title}
          {version && <span className="text-xs text-gray-400 font-mono hidden sm:inline">{version}</span>}
        </h1>
        {mode && mode !== 'prod' && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {mode === 'dev' ? 'Dev' : 'Demo'}Mode
          </span>
        )}
      </div>
      {user && (
        <div className="flex items-center gap-2 sm:gap-3">
          {user.companyName && (
            <span className="hidden sm:inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{user.companyName}</span>
          )}
          {!user.companyName && user.role === 'ADMIN' && (
            <span className="hidden sm:inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Global</span>
          )}
          <span className="text-sm text-gray-600 hidden sm:inline">{user.firstName} {user.lastName}</span>
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
            {getInitials(user.firstName, user.lastName)}
          </div>
        </div>
      )}
    </header>
  );
}