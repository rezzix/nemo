import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

type Role = 'ADMIN' | 'MANAGER' | 'EXECUTIVE' | 'CONTRIBUTOR' | 'EXTERNAL' | 'HR';

interface RoleGuardProps {
  roles: Role[];
  children: React.ReactNode;
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}