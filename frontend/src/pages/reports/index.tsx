import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import ProjectSelector from './ProjectSelector';
import OverviewReport from './OverviewReport';
import AgingReport from './AgingReport';
import VelocityReport from './VelocityReport';
import WorkloadReport from './WorkloadReport';
import TimeReport from './TimeReport';
import TrendsReport from './TrendsReport';
import PortfolioReport from './PortfolioReport';
import AttendanceReport from './AttendanceReport';
import HeadcountReport from './HeadcountReport';

type Section = 'portfolio' | 'overview' | 'aging' | 'velocity' | 'workload' | 'time' | 'trends' | 'attendance' | 'headcount';

export default function TimeReportsPage() {
  const [section, setSection] = useState<Section>('overview');
  const [projectId, setProjectId] = useState<number | null>(null);
  const user = useAuthStore((s) => s.user);

  const isExecutive = user?.role === 'EXECUTIVE' || user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isHr = user?.role === 'HR';

  const sections: { key: Section; label: string }[] = [
    ...(isExecutive ? [{ key: 'portfolio' as Section, label: 'Portfolio' }] : []),
    { key: 'overview', label: 'Project Overview' },
    ...(user?.role !== 'HR' ? [
      { key: 'aging' as Section, label: 'Task Aging' },
      { key: 'velocity' as Section, label: 'Sprint Velocity' },
    ] : []),
    { key: 'workload', label: 'Workload' },
    { key: 'time', label: 'Time Reports' },
    { key: 'trends', label: 'Time Trends' },
    ...(isHr || user?.role === 'ADMIN' ? [
      { key: 'attendance' as Section, label: 'Attendance' },
      { key: 'headcount' as Section, label: 'Headcount' },
    ] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
      </div>

      {section !== 'portfolio' && section !== 'attendance' && section !== 'headcount' && (
        <div className="flex items-center gap-3">
          <ProjectSelector value={projectId} onChange={setProjectId} />
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                section === s.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {section === 'portfolio' && <PortfolioReport />}
      {section === 'overview' && <OverviewReport projectId={projectId} />}
      {section === 'aging' && <AgingReport projectId={projectId} />}
      {section === 'velocity' && <VelocityReport projectId={projectId} />}
      {section === 'workload' && <WorkloadReport projectId={projectId} />}
      {section === 'time' && <TimeReport />}
      {section === 'trends' && <TrendsReport />}
      {section === 'attendance' && <AttendanceReport />}
      {section === 'headcount' && <HeadcountReport />}
    </div>
  );
}