import { useState, useEffect, useCallback } from 'react';
import type { ActivityLogDto } from '@/types';
import { listActivityLogs } from '@/api/activity';
import Spinner from '@/components/common/Spinner';

function threeDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function methodColor(method: string): string {
  switch (method) {
    case 'GET': return 'bg-blue-100 text-blue-700';
    case 'POST': return 'bg-green-100 text-green-700';
    case 'PUT': return 'bg-amber-100 text-amber-700';
    case 'DELETE': return 'bg-red-100 text-red-700';
    case 'PATCH': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-600';
  if (status >= 400 && status < 500) return 'text-yellow-600';
  if (status >= 500) return 'text-red-600';
  return 'text-gray-600';
}

function durationColor(ms: number): string {
  if (ms > 5000) return 'text-red-600 font-medium';
  if (ms > 1000) return 'text-yellow-600';
  return 'text-gray-600';
}

export default function ActivityTab() {
  const [startDate, setStartDate] = useState(threeDaysAgo());
  const [endDate, setEndDate] = useState(today());
  const [username, setUsername] = useState('');
  const [logs, setLogs] = useState<ActivityLogDto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const size = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listActivityLogs({
        username: username || undefined,
        startDate,
        endDate,
        page,
        size,
      });
      setLogs(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalElements(res.pagination.totalElements);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [username, startDate, endDate, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSearch = () => {
    setPage(0);
    fetchLogs();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Search by username..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{totalElements} result{totalElements !== 1 ? 's' : ''}</p>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Path</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">IP</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {log.username === 'unauthenticated' ? (
                        <span className="text-gray-400 italic">{log.username}</span>
                      ) : log.username}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${methodColor(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 max-w-xs truncate" title={log.path}>
                      {log.path}
                    </td>
                    <td className={`px-4 py-3 ${statusColor(log.status)}`}>
                      {log.status}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ip}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${durationColor(log.duration)}`}>
                      {formatDuration(log.duration)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No activity found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}