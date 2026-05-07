import { useState, useEffect, useCallback } from 'react';
import { listTimeLogs } from '@/api/timeLogs';
import { listAllUsers } from '@/api/users';
import type { UserDto, TimeLogDto } from '@/types';
import Spinner from '@/components/common/Spinner';
import StatCard from './ReportStatCard';

export default function TrendsReport() {
  const [weeks, setWeeks] = useState(8);
  const [data, setData] = useState<{ week: string; hours: number }[]>([]);
  const [byUser, setByUser] = useState<{ userName: string; weekHours: Record<string, number> }[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserDto[]>([]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const userList = await listAllUsers({ active: 'true' });
      setUsers(userList);

      const now = new Date();
      const weekStarts: string[] = [];
      for (let i = weeks - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        weekStarts.push(monday.toISOString().slice(0, 10));
      }

      const allLogs: TimeLogDto[] = [];
      for (const ws of weekStarts) {
        const endDate = new Date(ws + 'T00:00:00');
        endDate.setDate(endDate.getDate() + 6);
        const logs = await listTimeLogs({ startDate: ws, endDate: endDate.toISOString().slice(0, 10), size: 200 });
        allLogs.push(...logs);
      }

      const byWeek: Record<string, number> = {};
      for (const ws of weekStarts) byWeek[ws] = 0;
      for (const log of allLogs) {
        const logDate = new Date(log.logDate + 'T00:00:00');
        const day = logDate.getDay();
        const diff = logDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(logDate);
        monday.setDate(diff);
        const key = monday.toISOString().slice(0, 10);
        if (byWeek[key] !== undefined) byWeek[key] += log.hours;
      }

      setData(weekStarts.map((ws) => ({ week: ws, hours: byWeek[ws] || 0 })));

      // Per-user breakdown
      const userMap: Record<string, Record<string, number>> = {};
      for (const log of allLogs) {
        const uName = log.userName;
        const logDate = new Date(log.logDate + 'T00:00:00');
        const day = logDate.getDay();
        const diff = logDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(logDate);
        monday.setDate(diff);
        const key = monday.toISOString().slice(0, 10);
        if (!userMap[uName]) userMap[uName] = {};
        for (const ws of weekStarts) { if (userMap[uName][ws] === undefined) userMap[uName][ws] = 0; }
        if (userMap[uName][key] !== undefined) userMap[uName][key] += log.hours;
      }

      setByUser(Object.entries(userMap).map(([userName, weekHours]) => ({ userName, weekHours })));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [weeks]);

  useEffect(() => { fetch(); }, [fetch]);

  const maxHours = Math.max(...data.map((d) => d.hours), 1);
  const totalHours = data.reduce((s, d) => s + d.hours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500">Weeks:</label>
        <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value={4}>4</option>
          <option value={8}>8</option>
          <option value={12}>12</option>
          <option value={16}>16</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Avg Hours/Week" value={(totalHours / (weeks || 1)).toFixed(1)} color="border-gray-200 bg-white" />
            <StatCard label="Total Hours" value={totalHours.toFixed(1)} color="border-primary-200 bg-primary-50" />
          </div>

          {/* Weekly bar chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Weekly Hours</h3>
            <div className="flex items-end gap-2 h-40">
              {data.map((d) => {
                const pct = (d.hours / maxHours) * 100;
                const dateObj = new Date(d.week + 'T00:00:00');
                return (
                  <div key={d.week} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-700">{d.hours > 0 ? d.hours.toFixed(1) : ''}</span>
                    <div className="w-full bg-primary-500 rounded-t-md transition-all" style={{ height: `${Math.max(pct, 2)}%` }} />
                    <span className="text-[10px] text-gray-400">{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-user trend table */}
          {byUser.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 sticky left-0 bg-gray-50">User</th>
                    {data.map((d) => (
                      <th key={d.week} className="text-right px-3 py-3 font-medium text-gray-400 text-xs whitespace-nowrap">
                        {new Date(d.week + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byUser.map((row) => {
                    const userTotal = Object.values(row.weekHours).reduce((s, h) => s + h, 0);
                    return (
                      <tr key={row.userName} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900 font-medium sticky left-0 bg-white">{row.userName}</td>
                        {data.map((d) => (
                          <td key={d.week} className="px-3 py-2 text-right font-mono text-xs text-gray-600">
                            {(row.weekHours[d.week] || 0) > 0 ? (row.weekHours[d.week] || 0).toFixed(1) : '-'}
                          </td>
                        ))}
                        <td className="px-4 py-2 text-right font-semibold">{userTotal.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}