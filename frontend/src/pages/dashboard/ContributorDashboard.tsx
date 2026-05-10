import { useAuth } from '@/hooks/useAuth';
import { useMyIssues } from '@/hooks/useMyIssues';
import { listTimeLogs } from '@/api/timeLogs';
import { priorityColor, statusColor, formatDate } from '@/utils/format';
import { currentWeekRange } from './dashboardUtils';
import type { IssuePriority, TimeLogDto } from '@/types';
import Spinner from '@/components/common/Spinner';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function ContributorDashboard() {
  const { user } = useAuth();
  const { projects, myIssues, isLoading } = useMyIssues();
  const [weekHours, setWeekHours] = useState<number | null>(null);
  const [lastLogDaysAgo, setLastLogDaysAgo] = useState<number | null>(null);
  const [lastLogDate, setLastLogDate] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const { start, end } = currentWeekRange();
    listTimeLogs({ userId: user.id, startDate: start, endDate: end, size: 200 })
      .then((logs: TimeLogDto[]) => {
        const total = logs.reduce((sum, l) => sum + l.hours, 0);
        setWeekHours(total);
      })
      .catch(() => setWeekHours(null));

    listTimeLogs({ userId: user.id, size: 1 })
      .then((logs: TimeLogDto[]) => {
        if (logs.length > 0) {
          const lastDate = logs[0].logDate;
          setLastLogDate(lastDate);
          const diff = Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
          setLastLogDaysAgo(diff);
        }
      })
      .catch(() => {});
  }, [user]);

  // Group issues by project
  const issuesByProject = useMemo(() => {
    const map = new Map<number, typeof myIssues>();
    for (const issue of myIssues) {
      const list = map.get(issue.projectId) || [];
      list.push(issue);
      map.set(issue.projectId, list);
    }
    return map;
  }, [myIssues]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  const todoCount = myIssues.filter(
    (i) => i.statusName.toLowerCase().includes('todo') || i.statusName.toLowerCase().includes('open'),
  ).length;
  const inProgressCount = myIssues.filter(
    (i) => i.statusName.toLowerCase().includes('progress') || i.statusName.toLowerCase().includes('active'),
  ).length;

  const stats = [
    { label: 'Assigned to me', value: myIssues.length, color: 'bg-primary-50 text-primary-700' },
    { label: 'In progress', value: inProgressCount, color: 'bg-blue-50 text-blue-700' },
    { label: 'To do', value: todoCount, color: 'bg-gray-50 text-gray-700' },
    { label: 'Projects', value: projects.length, color: 'bg-green-50 text-green-700' },
  ];

  const lastLogColor = lastLogDaysAgo !== null
    ? lastLogDaysAgo <= 1 ? 'text-green-600' : lastLogDaysAgo === 2 ? 'text-amber-600' : 'text-red-600'
    : 'text-gray-400';
  const lastLogBg = lastLogDaysAgo !== null
    ? lastLogDaysAgo <= 1 ? 'bg-green-50' : lastLogDaysAgo === 2 ? 'bg-amber-50' : 'bg-red-50'
    : 'bg-gray-50';
  const lastLogLabel = lastLogDaysAgo !== null
    ? lastLogDaysAgo === 0 ? 'Today' : lastLogDaysAgo === 1 ? 'Yesterday' : `${lastLogDaysAgo} days ago`
    : 'No logs';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {user ? `Welcome back, ${user.firstName}` : 'Welcome'}
        </h2>
        <p className="text-gray-500 mt-1">Here's an overview of your work.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Time logging status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {weekHours !== null && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-500">Time this week</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{weekHours.toFixed(1)} hours</p>
          </div>
        )}
        <div className={`${lastLogBg} rounded-xl border border-gray-200 p-5`}>
          <h3 className="text-sm font-medium text-gray-500">Last time log</h3>
          <p className={`text-2xl font-bold mt-1 ${lastLogColor}`}>{lastLogLabel}</p>
          {lastLogDate && <p className="text-xs text-gray-400 mt-1">{formatDate(lastLogDate)}</p>}
        </div>
      </div>

      {/* My Projects with tasks */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Projects</h3>
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No projects found.
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const projectIssues = issuesByProject.get(project.id) || [];
              const projectInProgress = projectIssues.filter(
                (i) => i.statusName.toLowerCase().includes('progress') || i.statusName.toLowerCase().includes('active'),
              );
              const projectTodo = projectIssues.filter(
                (i) => i.statusName.toLowerCase().includes('todo') || i.statusName.toLowerCase().includes('open'),
              );
              return (
                <div key={project.id} className="bg-white rounded-xl border border-gray-200">
                  {/* Project header */}
                  <Link to={`/projects/${project.id}`} className="block px-5 py-4 hover:bg-gray-50 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{project.key}</span>
                        <h4 className="font-semibold text-gray-900">{project.name}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {projectIssues.length > 0 && (
                          <>
                            <span>{projectIssues.length} issue{projectIssues.length !== 1 ? 's' : ''}</span>
                            {projectInProgress.length > 0 && <span className="text-blue-600">{projectInProgress.length} in progress</span>}
                            {projectTodo.length > 0 && <span>{projectTodo.length} to do</span>}
                          </>
                        )}
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                    )}
                  </Link>

                  {/* Issues under this project */}
                  {projectIssues.length > 0 && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {projectIssues.map((issue) => {
                        const isProgress = issue.statusName.toLowerCase().includes('progress') || issue.statusName.toLowerCase().includes('active');
                        return (
                          <Link
                            key={issue.id}
                            to={`/projects/${issue.projectId}/issues/${issue.id}`}
                            className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${isProgress ? 'bg-blue-500' : 'bg-gray-300'}`} />
                              <span className="font-mono text-xs text-gray-400">{issue.issueKey}</span>
                              <span className="text-sm text-gray-900 truncate">{issue.title}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(issue.priority as IssuePriority)}`}>
                                {issue.priority}
                              </span>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(issue.statusName)}`}>
                                {issue.statusName}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {projectIssues.length === 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 text-sm text-gray-400">No assigned issues</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}