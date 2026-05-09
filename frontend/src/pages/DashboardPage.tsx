import { Component, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import ManagerDashboard from '@/pages/dashboard/ManagerDashboard';
import ExecutiveDashboard from '@/pages/dashboard/ExecutiveDashboard';
import ContributorDashboard from '@/pages/dashboard/ContributorDashboard';
import HrDashboard from '@/pages/dashboard/HrDashboard';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-lg">
            <p className="text-red-600 font-medium text-lg">Something went wrong</p>
            <p className="text-sm text-gray-500 mt-2">{this.state.error.message}</p>
            <pre className="text-xs text-gray-400 mt-4 text-left overflow-auto max-h-48 bg-gray-50 p-3 rounded">{this.state.error.stack}</pre>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DashboardPage() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN':
      return <ErrorBoundary><AdminDashboard /></ErrorBoundary>;
    case 'MANAGER':
      return <ErrorBoundary><ManagerDashboard /></ErrorBoundary>;
    case 'EXECUTIVE':
      return <ErrorBoundary><ExecutiveDashboard /></ErrorBoundary>;
    case 'HR':
      return <ErrorBoundary><HrDashboard /></ErrorBoundary>;
    default:
      return <ErrorBoundary><ContributorDashboard /></ErrorBoundary>;
  }
}