import { useState, useEffect, useCallback } from 'react';
import { getWeeklyTimesheet, getDailyTimesheet, deleteTimeLog } from '@/api/timeLogs';
import { listAllUsers } from '@/api/users';
import { useHolidays } from '@/hooks/useHolidays';
import type { UserDto, TimeLogDto } from '@/types';
import Spinner from '@/components/common/Spinner';

function getWeekStart(date: Date): string {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

function getWeekDays(weekStart: string): string[] {
  const days: string[] = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TimesheetTab() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const { holidayMap } = useHolidays(weekStart);
  const [weekData, setWeekData] = useState<Record<string, TimeLogDto[]>>({});
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [dayEntries, setDayEntries] = useState<TimeLogDto[]>([]);

  useEffect(() => {
    listAllUsers({ active: 'true' }).then((list) => {
      setUsers(list);
      if (list.length > 0) setSelectedUserId(list[0].id);
    });
  }, []);

  const fetchWeek = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const data = await getWeeklyTimesheet(selectedUserId, weekStart);
      setWeekData(data.days ?? {});
    } catch {
      setWeekData({});
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, weekStart]);

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  const handleDayClick = async (day: string) => {
    if (expandedDay === day) { setExpandedDay(null); return; }
    if (!selectedUserId) return;
    setExpandedDay(day);
    try {
      const data = await getDailyTimesheet(selectedUserId, day);
      setDayEntries(data.entries ?? []);
    } catch {
      setDayEntries([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this time log?')) return;
    await deleteTimeLog(id);
    fetchWeek();
    if (expandedDay) handleDayClick(expandedDay);
  };

  const weekDays = getWeekDays(weekStart);
  const weekTotal = weekDays.reduce((sum, day) => {
    const logs = weekData[day] ?? [];
    return sum + logs.reduce((s, l) => s + l.hours, 0);
  }, 0);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <select
          value={selectedUserId ?? ''}
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.username})</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d.toISOString().slice(0, 10)); }} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-medium text-gray-700">Week of {new Date(weekStart + 'T00:00:00').toLocaleDateString()}</span>
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d.toISOString().slice(0, 10)); }} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
          <button onClick={() => setWeekStart(getWeekStart(new Date()))} className="text-xs text-primary-600 hover:text-primary-800 font-medium">This week</button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">Weekly total:</span>
          <span className="text-lg font-bold text-gray-900">{weekTotal.toFixed(1)}h</span>
        </div>
      </div>

      {selectedUser && (
        <div className="text-sm text-gray-500">Viewing timesheet for <span className="font-medium text-gray-700">{selectedUser.firstName} {selectedUser.lastName}</span></div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <div className="space-y-2">
          {weekDays.map((day, i) => {
            const logs = weekData[day] ?? [];
            const dayTotal = logs.reduce((s, l) => s + l.hours, 0);
            const isToday = day === new Date().toISOString().slice(0, 10);
            const isHoliday = !!holidayMap[day];
            const holidayName = holidayMap[day]?.name;
            const isExpanded = expandedDay === day;
            return (
              <div key={day} className={`bg-white rounded-xl border ${isHoliday ? 'border-pink-300 bg-pink-50' : isToday ? 'border-primary-300' : 'border-gray-200'} overflow-hidden`}>
                <button
                  onClick={() => handleDayClick(day)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-20">
                    <span className={`text-sm font-medium ${isHoliday ? 'text-pink-700' : isToday ? 'text-primary-700' : 'text-gray-700'}`}>{dayNames[i]}</span>
                    <span className="text-xs text-gray-400 ml-2">{new Date(day + 'T00:00:00').toLocaleDateString()}</span>
                  </div>
                  {isHoliday && <span className="text-xs text-pink-600 font-medium">{holidayName}</span>}
                  <div className="flex-1 flex flex-wrap gap-2">
                    {logs.map((l) => (
                      <span key={l.id} className="text-xs bg-gray-100 rounded-full px-2 py-0.5 text-gray-700">
                        {l.issueKey} <span className="font-medium">{l.hours}h</span>
                      </span>
                    ))}
                    {logs.length === 0 && <span className="text-xs text-gray-400">No entries</span>}
                  </div>
                  <span className={`text-sm font-semibold ${dayTotal > 8 ? 'text-orange-600' : 'text-gray-900'}`}>{dayTotal > 0 ? `${dayTotal.toFixed(1)}h` : '-'}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                    {dayEntries.map((l) => (
                      <div key={l.id} className="flex items-center justify-between py-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary-600">{l.issueKey}</span>
                            <span className="text-sm text-gray-900 font-medium">{l.hours}h</span>
                          </div>
                          {l.description && <p className="text-xs text-gray-500 truncate">{l.description}</p>}
                        </div>
                        <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:text-red-800 text-xs font-medium ml-4">Delete</button>
                      </div>
                    ))}
                    {dayEntries.length === 0 && <p className="text-xs text-gray-400">No entries for this day.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}