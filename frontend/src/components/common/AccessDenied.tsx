import { useAuthStore } from '@/stores/authStore';

interface AccessDeniedProps {
  requiredRoles?: string[];
}

export default function AccessDenied({ requiredRoles }: AccessDeniedProps) {
  const user = useAuthStore((s) => s.user);
  const roleLabel = requiredRoles?.length
    ? requiredRoles.join(', ')
    : 'ADMIN';

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-4">
          You don't have permission to access this page.
        </p>
        {user && (
          <p className="text-sm text-gray-400">
            Your role ({user.role}) requires one of: {roleLabel}
          </p>
        )}
      </div>
    </div>
  );
}