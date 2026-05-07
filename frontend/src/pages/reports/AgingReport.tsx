import { useState, useEffect, useCallback } from 'react';
import { listProjectIssues } from '@/api/issues';
import type { IssueDto } from '@/types';
import { statusColor } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import StatCard from './ReportStatCard';

export default function AgingReport({ projectId }: { projectId: number | null }) {
  const [issues, setIssues] = useState<IssueDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<'age' | 'updated'>('age');

  const fetch = useCallback(async () => {
    if (!projectId) { setIssues([]); return; }
    setLoading(true);
    try { setIssues(await listProjectIssues(projectId, { size: 200 })); } catch { setIssues([]); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const now = Date.now();
  const openIssues = issues.filter((i) => {
    const s = i.statusName.toLowerCase();
    return !s.includes('done') && !s.includes('complete');
  });

  const aged = openIssues.map((i) => ({
    ...i,
    daysOld: Math.floor((now - new Date(i.createdAt).getTime()) / 86400000),
    daysSinceUpdate: Math.floor((now - new Date(i.updatedAt).getTime()) / 86400000),
  }));

  const sorted = [...aged].sort((a, b) => sort === 'age' ? b.daysOld - a.daysOld : b.daysSinceUpdate - a.daysSinceUpdate);

  const staleCount = aged.filter((i) => i.daysSinceUpdate > 7).length;
  const oldCount = aged.filter((i) => i.daysOld > 30).length;

  return (
    <div className="space-y-6">
      {projectId && (
        <div className="flex items-center gap-3">
          <select value={sort} onChange={(e) => setSort(e.target.value as 'age' | 'updated')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="age">Sort by age</option>
            <option value="updated">Sort by stale time</option>
          </select>
        </div>
      )}

      {!projectId ? (
        <div className="text-center text-gray-400 py-8">Select a project above to view aging report</div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Open Issues" value={openIssues.length} color="border-gray-200 bg-white" />
            <StatCard label="Stale (>7d no update)" value={staleCount} color="border-orange-200 bg-orange-50" />
            <StatCard label="Old (>30d)" value={oldCount} color="border-red-200 bg-red-50" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Key</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Assignee</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Age (days)</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Stale (days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((i) => (
                  <tr key={i.id} className={i.daysSinceUpdate > 7 ? 'bg-orange-50' : ''}>
                    <td className="px-4 py-2 font-mono text-xs text-primary-600">{i.issueKey}</td>
                    <td className="px-4 py-2 text-gray-900 truncate max-w-[200px]">{i.title}</td>
                    <td className="px-4 py-2"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(i.statusName)}`}>{i.statusName}</span></td>
                    <td className="px-4 py-2 text-gray-500">{i.assigneeName ?? 'Unassigned'}</td>
                    <td className="px-4 py-2 text-right font-mono text-sm">{i.daysOld}</td>
                    <td className="px-4 py-2 text-right font-mono text-sm">{i.daysSinceUpdate}</td>
                  </tr>
                ))}
                {sorted.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No open issues</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}