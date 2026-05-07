import { useState, useEffect, useCallback } from 'react';
import { listProjectIssues } from '@/api/issues';
import type { IssueDto } from '@/types';
import Spinner from '@/components/common/Spinner';
import StatCard from './ReportStatCard';

export default function WorkloadReport({ projectId }: { projectId: number | null }) {
  const [issues, setIssues] = useState<IssueDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setIssues([]); return; }
    setLoading(true);
    try { setIssues(await listProjectIssues(projectId, { size: 200 })); } catch { setIssues([]); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const byAssignee = Object.entries(
    issues.reduce<Record<string, { total: number; open: number; done: number }>>((acc, i) => {
      const name = i.assigneeName ?? 'Unassigned';
      if (!acc[name]) acc[name] = { total: 0, open: 0, done: 0 };
      acc[name].total++;
      const s = i.statusName.toLowerCase();
      if (s.includes('done') || s.includes('complete')) acc[name].done++;
      else acc[name].open++;
      return acc;
    }, {})
  ).map(([name, counts]) => ({ name, ...counts }));

  const maxTotal = Math.max(...byAssignee.map((a) => a.total), 1);

  return (
    <div className="space-y-6">
      {!projectId ? (
        <div className="text-center text-gray-400 py-8">Select a project above to view workload</div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Team Members" value={byAssignee.filter((a) => a.name !== 'Unassigned').length} color="border-gray-200 bg-white" />
            <StatCard label="Unassigned Issues" value={byAssignee.find((a) => a.name === 'Unassigned')?.total ?? 0} color="border-orange-200 bg-orange-50" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Assignee</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Open</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Done</th>
                  <th className="px-4 py-3 font-medium text-gray-500 w-48">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byAssignee.map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-right font-semibold">{row.total}</td>
                    <td className="px-4 py-3 text-right text-orange-600 font-medium">{row.open}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{row.done}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5 h-4">
                        <div className="bg-green-500 rounded-l" style={{ width: `${(row.done / maxTotal) * 100}%`, minWidth: row.done > 0 ? '4px' : '0' }} />
                        <div className="bg-orange-400 rounded-r" style={{ width: `${(row.open / maxTotal) * 100}%`, minWidth: row.open > 0 ? '4px' : '0' }} />
                      </div>
                    </td>
                  </tr>
                ))}
                {byAssignee.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No issues</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}