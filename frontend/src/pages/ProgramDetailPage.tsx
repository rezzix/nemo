import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ProgramDto, ProjectDto } from '@/types';
import { getProgram } from '@/api/programs';
import { listProjects } from '@/api/projects';
import { stageBadge, stageLabel, formatCurrency, formatDate, deadlineBadge, deadlineLabel } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<ProgramDto | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [prog, projRes] = await Promise.all([
        getProgram(Number(id)),
        listProjects({ programId: Number(id), size: 100 }),
      ]);
      setProgram(prog);
      setProjects(projRes);
    } catch {
      setProgram(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!program) return <div className="text-center text-gray-500 py-8">Program not found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate('/programs')} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Programs
        </button>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{program.key}</span>
          <h2 className="text-2xl font-bold text-gray-900">{program.name}</h2>
        </div>
        {program.description && <p className="text-gray-500 mt-1">{program.description}</p>}
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
          <span>Manager: {program.managerName}</span>
          {program.companyName && <span>Company: {program.companyName}</span>}
          {!program.companyName && <span>Company: Global</span>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Projects ({projects.length})</h3>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          No projects in this program yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: ProjectDto; onClick: () => void }) {
  const budgetVal = project.budget ? Number(project.budget) : null;
  const pvVal = project.plannedValue ? Number(project.plannedValue) : null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{project.key}</span>
          {project.stage && (
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge(project.stage)}`}>
              {stageLabel(project.stage)}
            </span>
          )}
          {project.targetEndDate && deadlineLabel(project.targetEndDate) && (
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${deadlineBadge(project.targetEndDate)}`}>
              {deadlineLabel(project.targetEndDate)}
            </span>
          )}
        </div>
      </div>

      <h4 className="text-base font-semibold text-gray-900 mb-1">{project.name}</h4>
      <p className="text-xs text-gray-400 mb-3">Manager: {project.managerName}</p>

      {/* Dates */}
      {(project.targetStartDate || project.targetEndDate) && (
        <div className="text-xs mb-3">
          {project.targetStartDate && <span className="text-gray-500">{formatDate(project.targetStartDate)}</span>}
          {project.targetStartDate && project.targetEndDate && <span className="text-gray-500"> → </span>}
          {project.targetEndDate && <span className={deadlineBadge(project.targetEndDate) || 'text-gray-500'}>{formatDate(project.targetEndDate)}</span>}
        </div>
      )}

      {/* Financials */}
      {(budgetVal !== null || pvVal !== null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-gray-100">
          <div>
            <div className="text-[10px] text-gray-400 font-medium uppercase">Budget</div>
            <div className="text-sm font-medium text-gray-900">{formatCurrency(budgetVal)}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-medium uppercase">PV</div>
            <div className="text-sm font-medium text-gray-900">{formatCurrency(pvVal)}</div>
          </div>
        </div>
      )}

      {/* Strategic Score */}
      {project.strategicScore != null && (
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <span className="font-medium">Score:</span>
          <span className="text-gray-700">{project.strategicScore}/10</span>
        </div>
      )}
    </div>
  );
}