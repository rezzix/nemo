import { useState, useEffect, useCallback } from 'react';
import type { PhaseDto, DeliverableDto, MemberDto } from '@/types';
import { listPhases, listDeliverables } from '@/api/phases';
import { getMembers } from '@/api/projects';
import { formatDate, stageLabel } from '@/utils/format';
import EvmCard from './EvmCard';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import Spinner from '@/components/common/Spinner';

type Tab = 'summary' | 'issues' | 'board' | 'docs' | 'raid' | 'phases' | 'members' | 'settings';

export default function SummaryTab({ projectId, managerId, instructions, onNavigate }: { projectId: number; managerId: number; instructions: string | null; onNavigate?: (tab: Tab) => void }) {
  const [phases, setPhases] = useState<PhaseDto[]>([]);
  const [deliverables, setDeliverables] = useState<DeliverableDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, d, m] = await Promise.all([listPhases(projectId), listDeliverables(projectId), getMembers(projectId)]);
      setPhases(p);
      setDeliverables(d);
      setMembers(m);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deliverablesByPhase = (phaseId: number) => deliverables.filter(d => d.phaseId === phaseId);

  return (
    <div className="space-y-6">
      <EvmCard projectId={projectId} />

      {/* Instructions */}
      {instructions && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
          <MarkdownRenderer content={instructions} />
        </div>
      )}

      {/* Phases and Members side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phases overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {onNavigate ? (
              <button onClick={() => onNavigate('phases')} className="hover:text-primary-600 transition-colors">
                Phases ({phases.length})
              </button>
            ) : (
              <>Phases ({phases.length})</>
            )}
          </h3>
          {loading ? (
            <div className="flex justify-center py-6"><Spinner className="h-5 w-5 text-primary-600" /></div>
          ) : phases.length === 0 ? (
            <p className="text-gray-500 text-sm">No phases defined.</p>
          ) : (
            <div className="space-y-3">
              {phases.map(phase => {
                const phaseDels = deliverablesByPhase(phase.id);
                const completedDels = phaseDels.filter(d => d.state === 'VALIDATED').length;
                return (
                  <div key={phase.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900">{phase.name}</span>
                      {phase.startDate && phase.endDate && (
                        <span className="ml-2 text-xs text-gray-400">{formatDate(phase.startDate)} → {formatDate(phase.endDate)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
                      {phaseDels.length > 0 && (
                        <span>{completedDels}/{phaseDels.length} deliverables</span>
                      )}
                      {phase.stage && <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}>{stageLabel(phase.stage)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Members list */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {onNavigate ? (
              <button onClick={() => onNavigate('members')} className="hover:text-primary-600 transition-colors">
                Members ({members.length})
              </button>
            ) : (
              <>Members ({members.length})</>
            )}
          </h3>
          {loading ? (
            <div className="flex justify-center py-6"><Spinner className="h-5 w-5 text-primary-600" /></div>
          ) : members.length === 0 ? (
            <p className="text-gray-500 text-sm">No members.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900">{m.fullName}</span>
                    <span className="ml-2 text-xs text-gray-400 font-mono">{m.username}</span>
                  </div>
                  {m.userId === managerId && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Manager</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}