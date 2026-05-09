import { useState } from 'react';
import { getTimeByProject, getTimeByUser } from '@/api/timeLogs';
import Spinner from '@/components/common/Spinner';

function ChevronIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg className={`${className} transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function TimeReport() {
  const [tab, setTab] = useState<'project' | 'user'>('project');
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); });
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [projectData, setProjectData] = useState<{ projectId: number; projectName: string; totalHours: number }[]>([]);
  const [userData, setUserData] = useState<{ userId: number; userName: string; totalHours: number }[]>([]);
  const [loading, setLoading] = useState(false);

  // Expandable project detail state
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  const [projectDetails, setProjectDetails] = useState<Record<number, { userId: number; userName: string; totalHours: number }[]>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Expandable user detail state
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<Record<number, { projectId: number; projectName: string; totalHours: number }[]>>({});
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  const generate = async () => {
    setLoading(true);
    setExpandedProjectId(null);
    setExpandedUserId(null);
    setProjectDetails({});
    setUserDetails({});
    try {
      if (tab === 'project') {
        setProjectData(await getTimeByProject(startDate, endDate));
      } else {
        setUserData(await getTimeByUser(startDate, endDate));
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleExpandProject = async (projectId: number) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      return;
    }
    setExpandedProjectId(projectId);
    if (!projectDetails[projectId]) {
      setLoadingDetail(true);
      try {
        const details = await getTimeByUser(startDate, endDate, projectId);
        setProjectDetails((prev) => ({ ...prev, [projectId]: details }));
      } catch {
        setProjectDetails((prev) => ({ ...prev, [projectId]: [] }));
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleExpandUser = async (userId: number) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    if (!userDetails[userId]) {
      setLoadingUserDetail(true);
      try {
        const details = await getTimeByProject(startDate, endDate, undefined, userId);
        setUserDetails((prev) => ({ ...prev, [userId]: details }));
      } catch {
        setUserDetails((prev) => ({ ...prev, [userId]: [] }));
      } finally {
        setLoadingUserDetail(false);
      }
    }
  };

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
                  <th className="w-8 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projectData.map((r) => {
                  const isExpanded = expandedProjectId === r.projectId;
                  const details = projectDetails[r.projectId];
                  return (
                    <>
                      <tr key={r.projectId} className={isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3">
                          <button onClick={() => handleExpandProject(r.projectId)} className="text-gray-400 hover:text-gray-600">
                            <ChevronIcon open={isExpanded} className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-900">{r.projectName}</td>
                        <td className="px-4 py-3 text-right font-semibold">{r.totalHours.toFixed(1)}h</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${r.projectId}-detail`}>
                          <td colSpan={3} className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                            {loadingDetail && !details ? (
                              <div className="flex items-center justify-center py-4"><Spinner className="h-5 w-5 text-primary-600" /></div>
                            ) : details && details.length > 0 ? (
                              <table className="w-full text-sm">
                                <tbody>
                                  {details.map((d) => (
                                    <tr key={d.userId}>
                                      <td className="py-1.5 pr-4 text-gray-700">{d.userName}</td>
                                      <td className="py-1.5 text-right font-medium text-gray-900">{d.totalHours.toFixed(1)}h</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : details && details.length === 0 ? (
                              <p className="text-gray-400 text-sm py-2">No time logged for this project in the selected period.</p>
                            ) : null}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {projectData.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Click Generate to run the report</td></tr>}
              </tbody>
              {projectData.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr><td colSpan={2} className="px-4 py-2 font-medium text-gray-700">Total</td><td className="px-4 py-2 text-right font-bold">{totalH(projectData).toFixed(1)}h</td></tr>
                </tfoot>
              )}
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-8 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {userData.map((r) => {
                  const isExpanded = expandedUserId === r.userId;
                  const details = userDetails[r.userId];
                  return (
                    <>
                      <tr key={r.userId} className={isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3">
                          <button onClick={() => handleExpandUser(r.userId)} className="text-gray-400 hover:text-gray-600">
                            <ChevronIcon open={isExpanded} className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-900">{r.userName}</td>
                        <td className="px-4 py-3 text-right font-semibold">{r.totalHours.toFixed(1)}h</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${r.userId}-detail`}>
                          <td colSpan={3} className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                            {loadingUserDetail && !details ? (
                              <div className="flex items-center justify-center py-4"><Spinner className="h-5 w-5 text-primary-600" /></div>
                            ) : details && details.length > 0 ? (
                              <table className="w-full text-sm">
                                <tbody>
                                  {details.map((d) => (
                                    <tr key={d.projectId}>
                                      <td className="py-1.5 pr-4 text-gray-700">{d.projectName}</td>
                                      <td className="py-1.5 text-right font-medium text-gray-900">{d.totalHours.toFixed(1)}h</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : details && details.length === 0 ? (
                              <p className="text-gray-400 text-sm py-2">No time logged for this user in the selected period.</p>
                            ) : null}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {userData.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Click Generate to run the report</td></tr>}
              </tbody>
              {userData.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr><td colSpan={2} className="px-4 py-2 font-medium text-gray-700">Total</td><td className="px-4 py-2 text-right font-bold">{totalH(userData).toFixed(1)}h</td></tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      )}
    </div>
  );
}