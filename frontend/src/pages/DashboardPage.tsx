import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import ManagerDashboard from '@/pages/dashboard/ManagerDashboard';
import ExecutiveDashboard from '@/pages/dashboard/ExecutiveDashboard';
import ContributorDashboard from '@/pages/dashboard/ContributorDashboard';
import HrDashboard from '@/pages/dashboard/HrDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'EXECUTIVE':
      return <ExecutiveDashboard />;
    case 'HR':
      return <HrDashboard />;
    default:
      return <ContributorDashboard />;
  }
}