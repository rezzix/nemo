import { useState, useEffect } from 'react';
import { getAttendanceReport, type AttendanceData } from '@/api/timeLogs';
import Spinner from '@/components/common/Spinner';

export default function AttendanceReport() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchData = async () => {
    setLoading(true);
    try {
      const attendance = await getAttendanceReport(startDate, endDate);
      setData(attendance);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <button onClick={fetchData} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          Apply
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8 text-primary-600" /></div>
      ) : !data ? (
        <div className="text-center py-12 text-gray-500">Failed to load attendance data.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Work Days in Period</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalWorkDays}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Active Internal Users</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalInternalUsers}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Users with Time Logs</p>
              <p className="text-2xl font-bold text-gray-900">{data.userAttendance.length}</p>
            </div>
          </div>

          {/* Daily attendance chart */}
          {data.dailySummary.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Daily Attendance</h3>
              <div className="flex items-end gap-1 h-32">
                {data.dailySummary.map((d) => {
                  const maxPresent = Math.max(...data.dailySummary.map((x) => x.usersPresent), 1);
                  const pct = (d.usersPresent / maxPresent) * 100;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center group relative min-w-0">
                      <div
                        className="w-full bg-primary-200 rounded-t group-hover:bg-primary-400 transition-colors"
                        style={{ height: `${pct}%`, minHeight: '2px' }}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {d.date}: {d.usersPresent} users
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* User attendance table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Days Worked</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Absent Days</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total Hours</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Avg/Day</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.userAttendance.map((u) => (
                  <tr key={u.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.userName}</td>
                    <td className="px-4 py-3 text-gray-600">{u.companyName}</td>
                    <td className="px-4 py-3 text-right">{u.daysWorked}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={u.absentDays > 5 ? 'text-red-600 font-medium' : ''}>{u.absentDays}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{Number(u.totalHours).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right">{Number(u.avgDailyHours).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.attendanceRate >= 80 ? 'bg-green-100 text-green-700' :
                        u.attendanceRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {Number(u.attendanceRate).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.userAttendance.length === 0 && (
              <div className="text-center text-gray-500 py-8">No time logged in this period.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}