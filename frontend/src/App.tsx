import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AuthGuard from '@/components/guards/AuthGuard';
import AdminGuard from '@/components/guards/AdminGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import GuestGuard from '@/components/guards/GuestGuard';
import AppLayout from '@/components/layout/AppLayout';
import LoadingScreen from '@/components/common/LoadingScreen';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPage from '@/pages/admin';
import ProjectsPage from '@/pages/ProjectsPage';
import ProgramDetailPage from '@/pages/ProgramDetailPage';
import ProgramsPage from '@/pages/ProgramsPage';
import ProjectDetailPage from '@/pages/project-detail';
import TaskDetailPage from '@/pages/TaskDetailPage';
import MyTimePage from '@/pages/MyTimePage';
import TimesheetsPage from '@/pages/TimesheetsPage';
import PeoplePage from '@/pages/PeoplePage';
import TimeReportsPage from '@/pages/reports';
import HolidaysPage from '@/pages/HolidaysPage';
import LeavePage from '@/pages/LeavePage';
import AssetsPage from '@/pages/AssetsPage';
import ClientsPage from '@/pages/ClientsPage';
import ClientDetailPage from '@/pages/ClientDetailPage';
import PreSalesPage from '@/pages/PreSalesPage';
import PreSaleDetailPage from '@/pages/PreSaleDetailPage';
import UserDetailPage from '@/pages/UserDetailPage';
import FinancePage from '@/pages/FinancePage';
import BankAccountsPage from '@/pages/BankAccountsPage';
import BankAccountDetailPage from '@/pages/BankAccountDetailPage';

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    checkSession();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkSession]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/programs" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'EXECUTIVE', 'HR', 'FINANCE']}><ProgramsPage /></RoleGuard>} />
          <Route path="/programs/:id" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'EXECUTIVE', 'HR', 'FINANCE']}><ProgramDetailPage /></RoleGuard>} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:id/:tab" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="/my-time" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'CONTRIBUTOR']}><MyTimePage /></RoleGuard>} />
          <Route path="/timesheets" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'HR']}><TimesheetsPage /></RoleGuard>} />
          <Route path="/people" element={<RoleGuard roles={['HR', 'EXECUTIVE']}><PeoplePage /></RoleGuard>} />
          <Route path="/people/:id" element={<RoleGuard roles={['HR', 'EXECUTIVE']}><UserDetailPage /></RoleGuard>} />
          <Route path="/holidays" element={<RoleGuard roles={['HR', 'ADMIN']}><HolidaysPage /></RoleGuard>} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/reports" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'EXECUTIVE', 'HR']}><TimeReportsPage /></RoleGuard>} />
          <Route path="/assets" element={<RoleGuard roles={['ADMIN', 'HR']}><AssetsPage /></RoleGuard>} />
          <Route path="/clients" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'EXECUTIVE', 'HR', 'FINANCE']}><ClientsPage /></RoleGuard>} />
          <Route path="/clients/:id" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'EXECUTIVE', 'HR', 'FINANCE']}><ClientDetailPage /></RoleGuard>} />
          <Route path="/presales" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'EXECUTIVE', 'HR', 'FINANCE']}><PreSalesPage /></RoleGuard>} />
          <Route path="/presales/:id" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'EXECUTIVE', 'HR', 'FINANCE']}><PreSaleDetailPage /></RoleGuard>} />
          <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
          <Route path="/finance" element={<RoleGuard roles={['FINANCE']}><FinancePage /></RoleGuard>} />
          <Route path="/finance/bank-accounts" element={<RoleGuard roles={['FINANCE', 'EXECUTIVE']}><BankAccountsPage /></RoleGuard>} />
          <Route path="/finance/bank-accounts/:id" element={<RoleGuard roles={['FINANCE', 'EXECUTIVE']}><BankAccountDetailPage /></RoleGuard>} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}