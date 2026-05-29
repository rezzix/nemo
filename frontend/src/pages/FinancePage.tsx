import { useAuthStore } from '@/stores/authStore';

export default function FinancePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Finance Dashboard</h1>
      <p className="text-gray-500">Welcome, {user?.firstName}. The finance dashboard will be available here.</p>
    </div>
  );
}