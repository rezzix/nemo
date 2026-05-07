import { useState, useEffect } from 'react';
import { getHeadcountReport, type HeadcountData } from '@/api/timeLogs';
import Spinner from '@/components/common/Spinner';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-400',
  EXECUTIVE: 'bg-amber-400',
  MANAGER: 'bg-blue-400',
  HR: 'bg-pink-400',
  CONTRIBUTOR: 'bg-green-400',
  EXTERNAL: 'bg-gray-400',
};

export default function HeadcountReport() {
  const [data, setData] = useState<HeadcountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHeadcountReport()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!data) return <div className="text-center py-12 text-gray-500">Failed to load headcount data.</div>;

  const maxRoleCount = Math.max(...data.byRole.map((r) => r.count), 1);
  const maxDeptCount = Math.max(...data.byDepartment.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalUsers}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{data.activeUsers}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-gray-400">{data.inactiveUsers}</p>
        </div>
      </div>

      {/* Active/Inactive donut */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Active vs Inactive</h3>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full border-8 border-green-500 relative">
            <div
              className="absolute inset-0 rounded-full border-8 border-gray-200"
              style={{
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(2 * Math.PI * data.activeUsers / data.totalUsers)}% ${50 - 50 * Math.cos(2 * Math.PI * data.activeUsers / data.totalUsers)}%)`,
              }}
            />
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center text-sm font-bold">
              {data.totalUsers > 0 ? Math.round((data.activeUsers / data.totalUsers) * 100) : 0}%
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Active ({data.activeUsers})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span>Inactive ({data.inactiveUsers})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Role */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">By Role</h3>
          <div className="space-y-2">
            {data.byRole.map((r) => (
              <div key={r.role} className="flex items-center gap-3">
                <span className="w-24 text-xs font-medium text-gray-600">{r.role}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                  <div
                    className={`h-full rounded-full ${(roleColors[r.role] || 'bg-gray-400')}`}
                    style={{ width: `${(r.count / maxRoleCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Company */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">By Company (excl. External)</h3>
          <div className="space-y-2">
            {data.byCompany.map((c) => (
              <div key={c.company} className="flex items-center gap-3">
                <span className="w-24 text-xs font-medium text-gray-600 truncate" title={c.company}>{c.company}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-400"
                    style={{ width: `${(c.count / Math.max(...data.byCompany.map((x) => x.count), 1)) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Department */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">By Department</h3>
          {data.byDepartment.length === 0 ? (
            <p className="text-sm text-gray-500">No department data available.</p>
          ) : (
            <div className="space-y-2">
              {data.byDepartment.map((d) => (
                <div key={d.department} className="flex items-center gap-3">
                  <span className="w-32 text-xs font-medium text-gray-600 truncate" title={d.department}>{d.department}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-400"
                      style={{ width: `${(d.count / maxDeptCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}