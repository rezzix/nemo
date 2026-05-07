import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useVersion } from '@/hooks/useVersion';
import { useUIStore } from '@/stores/uiStore';

export default function AppLayout() {
  const { version, devmode } = useVersion();
  const isMobile = useUIStore((s) => s.isMobile);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const closeMobileSidebar = useUIStore((s) => s.closeMobileSidebar);
  const setMobile = useUIStore((s) => s.setMobile);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setMobile]);

  return (
    <div className="flex h-screen bg-surface">
      {isMobile ? (
        <>
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 bg-black/40" onClick={closeMobileSidebar} />
          )}
          <div className="fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:hidden">
            <Sidebar />
          </div>
        </>
      ) : (
        <Sidebar />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Nemo" version={version} devmode={devmode} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}