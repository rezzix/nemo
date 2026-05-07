import { useState } from 'react';
import { getTimeByProject, getTimeByUser } from '@/api/timeLogs';
import { listAllUsers } from '@/api/users';
import type { UserDto } from '@/types';
import Spinner from '@/components/common/Spinner';

export default function TimeReport() {
  const [tab, setTab] = useState<'project' | 'user'>('project');
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); });
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [users, setUsers] = useState<UserDto[]>([]);
  const [projectData, setProjectData] = useState<{ projectId: number; totalHours: number }[]>([]);
  const [userData, setUserData] = useState<{ userId: number; totalHours: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      await listAllUsers({ active: 'true' }).then(setUsers);
      if (tab === 'project') {
        setProjectData(await getTimeByProject(startDate, endDate));
      } else {
        setUserData(await getTimeByUser(startDate, endDate));
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const userName = (id: number) => { const u = users.find((u) => u.id === id); return u ? `${u.firstName} ${u.lastName}` : `User ${id}`; };
  const totalH = (d: { totalHours: number }[]) => d.reduce((s, r) => s + r.totalHours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <button onClick={generate} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 self-end">Generate</button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto whitespace-nowrap">
          <button onClick={() => setTab('project')} className={`shrink-0 pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'project' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>By Project</button>
          <button onClick={() => setTab('user')} className={`shrink-0 pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'user' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>By User</button>
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {tab === 'project' ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projectData.map((r) => (
                  <tr key={r.projectId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">Project {r.projectId}</td>
                    <td className="px-4 py-3 text-right font-semibold">{r.totalHours.toFixed(1)}h</td>
                  </tr>
                ))}
                {projectData.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">Click Generate to run the report</td></tr>}
              </tbody>
              {projectData.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr><td className="px-4 py-2 font-medium text-gray-700">Total</td><td className="px-4 py-2 text-right font-bold">{totalH(projectData).toFixed(1)}h</td></tr>
                </tfoot>
              )}
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {userData.map((r) => (
                  <tr key={r.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{userName(r.userId)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{r.totalHours.toFixed(1)}h</td>
                  </tr>
                ))}
                {userData.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">Click Generate to run the report</td></tr>}
              </tbody>
              {userData.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr><td className="px-4 py-2 font-medium text-gray-700">Total</td><td className="px-4 py-2 text-right font-bold">{totalH(userData).toFixed(1)}h</td></tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      )}
    </div>
  );
}