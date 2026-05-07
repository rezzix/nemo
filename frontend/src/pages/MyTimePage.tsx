import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { listTimeLogs, createTimeLog, updateTimeLog, deleteTimeLog, getWeeklyTimesheet } from '@/api/timeLogs';
import { useMyIssues } from '@/hooks/useMyIssues';
import { useHolidays } from '@/hooks/useHolidays';
import type { TimeLogDto, IssueDto } from '@/types';
import { formatDate } from '@/utils/format';
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

export default function MyTimePage() {
  const user = useAuthStore((s) => s.user);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const { holidayMap } = useHolidays(weekStart);
  const [weekData, setWeekData] = useState<Record<string, TimeLogDto[]>>({});
  const [loading, setLoading] = useState(true);
  const [allLogs, setAllLogs] = useState<TimeLogDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formIssueId, setFormIssueId] = useState('');
  const [formHours, setFormHours] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editHours, setEditHours] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const { myIssues, projects, isLoading: issuesLoading } = useMyIssues();

  const openIssues = useMemo(() => {
    return myIssues.filter(
      (i) => i.statusCategory === 'TODO' || i.statusCategory === 'IN_PROGRESS',
    );
  }, [myIssues]);

  // Group open issues by project for the dropdown
  const issuesByProject = useMemo(() => {
    const groups: Record<string, IssueDto[]> = {};
    for (const issue of openIssues) {
      const key = issue.projectKey || `Project ${issue.projectId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(issue);
    }
    return groups;
  }, [openIssues]);

  const fetchWeek = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getWeeklyTimesheet(user.id, weekStart);
      setWeekData(data.days ?? {});
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [user, weekStart]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      const logs = await listTimeLogs({ userId: user.id, size: 200 });
      setAllLogs(logs);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    fetchWeek();
    fetchLogs();
  }, [fetchWeek, fetchLogs]);

  const weekDays = getWeekDays(weekStart);
  const weekTotal = weekDays.reduce((sum, day) => {
    const logs = weekData[day] ?? [];
    return sum + logs.reduce((s, l) => s + l.hours, 0);
  }, 0);

  const handlePrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().slice(0, 10));
  };

  const handleNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().slice(0, 10));
  };

  const handleThisWeek = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIssueId || !formHours) return;
    setSaving(true);
    setError(null);
    try {
      await createTimeLog({
        issueId: Number(formIssueId),
        hours: parseFloat(formHours),
        logDate: formDate,
        description: formDesc || undefined,
      });
      setFormIssueId('');
      setFormHours('');
      setFormDesc('');
      setShowForm(false);
      fetchWeek();
      fetchLogs();
    } catch {
      setError('Failed to log time.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (id: number) => {
    setSaving(true);
    setError(null);
    try {
      await updateTimeLog(id, {
        hours: parseFloat(editHours),
        logDate: editDate,
        description: editDesc || undefined,
      });
      setEditingId(null);
      fetchWeek();
      fetchLogs();
    } catch {
      setError('Failed to update time log.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (log: TimeLogDto) => {
    setEditingId(log.id);
    setEditHours(String(log.hours));
    setEditDate(log.logDate);
    setEditDesc(log.description ?? '');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this time log?')) return;
    await deleteTimeLog(id);
    fetchWeek();
    fetchLogs();
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Time</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          {showForm ? 'Cancel' : 'Log Time'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Task</label>
              {issuesLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Spinner className="h-4 w-4 text-gray-400" />
                </div>
              ) : openIssues.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No open tasks assigned to you.</p>
              ) : (
                <select
                  value={formIssueId}
                  onChange={(e) => setFormIssueId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a task...</option>
                  {Object.entries(issuesByProject).map(([projectKey, issues]) => (
                    <optgroup key={projectKey} label={projectKey}>
                      {issues.map((issue) => (
                        <option key={issue.id} value={issue.id}>
                          {issue.issueKey}: {issue.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hours</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={formHours}
                onChange={(e) => setFormHours(e.target.value)}
                required
                placeholder="e.g. 2.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
            <input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="What did you work on?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !formIssueId || !formHours}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Spinner className="h-4 w-4" />}Log Time
            </button>
          </div>
        </form>
      )}

      {/* Week navigation */}
      <div className="flex items-center gap-3 flex-wrap gap-y-2">
        <button onClick={handlePrevWeek} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-sm font-medium text-gray-700">
          Week of {new Date(weekStart + 'T00:00:00').toLocaleDateString()}
        </span>
        <button onClick={handleNextWeek} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
        <button onClick={handleThisWeek} className="text-xs text-primary-600 hover:text-primary-800 font-medium ml-1">This week</button>
        <span className="ml-auto text-sm font-semibold text-gray-900">Total: {weekTotal.toFixed(1)}h</span>
      </div>

      {/* Weekly grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((day, i) => {
            const logs = weekData[day] ?? [];
            const dayTotal = logs.reduce((s, l) => s + l.hours, 0);
            const dateObj = new Date(day + 'T00:00:00');
            const isToday = day === new Date().toISOString().slice(0, 10);
            const isHoliday = !!holidayMap[day];
            const holidayName = holidayMap[day]?.name;
            return (
              <div key={day} className={`bg-white rounded-xl border p-3 space-y-2 ${isHoliday ? 'border-pink-300 bg-pink-50' : isToday ? 'border-primary-300 ring-1 ring-primary-200' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isHoliday ? 'text-pink-700' : isToday ? 'text-primary-700' : 'text-gray-500'}`}>{dayNames[i]}</span>
                  <span className="text-xs text-gray-400">{dateObj.getDate()}/{dateObj.getMonth() + 1}</span>
                </div>
                {isHoliday && <span className="text-xs text-pink-600 font-medium truncate" title={holidayName}>{holidayName}</span>}
                <div className="text-lg font-bold text-gray-900">{dayTotal > 0 ? `${dayTotal.toFixed(1)}h` : '-'}</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {logs.map((l) => (
                    <div key={l.id} className="text-xs bg-gray-50 rounded p-1.5">
                      <div className="font-medium text-gray-800 truncate">{l.issueKey}</div>
                      <div className="text-gray-500 truncate">{l.description || l.issueTitle}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent logs with edit/delete */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Recent Time Logs</h3>
        {allLogs.length === 0 ? (
          <p className="text-sm text-gray-400">No time logs yet.</p>
        ) : (
          <div className="space-y-2">
            {allLogs.slice(0, 30).map((l) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                {editingId === l.id ? (
                  <div className="flex-1 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-primary-600">{l.issueKey}</span>
                    <input
                      type="number" step="0.25" min="0.25" value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="date" value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text" value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description"
                      className="flex-1 min-w-[120px] px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button onClick={() => handleEditSave(l.id)} disabled={saving} className="text-green-600 hover:text-green-800 text-xs font-medium">
                      {saving ? <Spinner className="h-3 w-3" /> : 'Save'}
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary-600">{l.issueKey}</span>
                        <span className="text-sm font-semibold text-gray-700">{l.hours}h</span>
                        <span className="text-xs text-gray-400">{formatDate(l.logDate)}</span>
                      </div>
                      {l.description && <p className="text-xs text-gray-500 truncate">{l.description}</p>}
                    </div>
                    <div className="flex items-center gap-3 ml-2">
                      <button onClick={() => startEdit(l)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}