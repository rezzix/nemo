import { useState, useEffect, useCallback } from 'react';
import type { ProjectDto, PhaseDto, DeliverableDto, MemberDto, InstructionDto, NoteDto, EvmMetrics } from '@/types';
import { listPhases, listDeliverables } from '@/api/phases';
import { getMembers, listInstructions, createInstruction, updateInstruction, deleteInstruction, listNotes, createNote, updateNote, deleteNote } from '@/api/projects';
import { getEvmMetrics } from '@/api/pmo';
import { formatDate, formatCurrency, stageLabel } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

type Tab = 'summary' | 'issues' | 'board' | 'docs' | 'raid' | 'phases' | 'members' | 'settings';

function isInstructionVisible(inst: InstructionDto): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (inst.visibleFrom && inst.visibleFrom > today) return false;
  if (inst.visibleTo && inst.visibleTo < today) return false;
  return true;
}

export default function SummaryTab({ project, projectId, managerId, onNavigate }: { project: ProjectDto; projectId: number; managerId: number; onNavigate?: (tab: Tab) => void }) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const isAdmin = user?.role === 'ADMIN';
  const canCreateInstructions = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'EXECUTIVE';

  const [phases, setPhases] = useState<PhaseDto[]>([]);
  const [deliverables, setDeliverables] = useState<DeliverableDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [instructions, setInstructions] = useState<InstructionDto[]>([]);
  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [evm, setEvm] = useState<EvmMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewInstruction, setShowNewInstruction] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, d, m, i, n, e] = await Promise.all([listPhases(projectId), listDeliverables(projectId), getMembers(projectId), listInstructions(projectId), listNotes(projectId), getEvmMetrics(projectId)]);
      setPhases(p);
      setDeliverables(d);
      setMembers(m);
      setInstructions(i);
      setNotes(n);
      setEvm(e);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const visibleInstructions = instructions.filter(isInstructionVisible);
  const deliverablesByPhase = (phaseId: number) => deliverables.filter(d => d.phaseId === phaseId);

  // Derived financials from EVM
  const totalPlanned = evm?.derivedPlannedValue ?? phases.reduce((sum, p) => sum + Number(p.plannedAmount || 0), 0);
  const totalPaid = evm?.totalPaid ?? phases.reduce((sum, p) => sum + Number(p.totalPaid || 0), 0);
  const paymentPct = totalPlanned > 0 ? Math.min(100, Math.round((totalPaid / totalPlanned) * 100)) : 0;
  const paymentColor = paymentPct >= 100 ? 'bg-green-500' : paymentPct >= 50 ? 'bg-blue-500' : totalPlanned > 0 ? 'bg-amber-500' : 'bg-gray-300';

  // Timeline progress
  const timelinePct = (() => {
    if (!project.targetStartDate || !project.targetEndDate) return null;
    const start = new Date(project.targetStartDate).getTime();
    const end = new Date(project.targetEndDate).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  })();
  const timelineColor = timelinePct != null ? (timelinePct >= 100 ? 'bg-amber-500' : 'bg-blue-500') : '';
  const durationLabel = (() => {
    if (!project.targetStartDate || !project.targetEndDate) return null;
    const start = new Date(project.targetStartDate);
    const end = new Date(project.targetEndDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months < 1) return '< 1 month';
    if (months < 24) return `${months} month${months > 1 ? 's' : ''}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}m` : `${years} year${years > 1 ? 's' : ''}`;
  })();

  // EVM color helpers
  const fmt = (v: number | null) => formatCurrency(v);
  const cvColor = evm && evm.costVariance >= 0 ? 'text-green-600' : 'text-red-600';
  const svColor = evm && evm.scheduleVariance >= 0 ? 'text-green-600' : 'text-red-600';
  const cpiColor = evm && evm.cpi != null ? (evm.cpi >= 1 ? 'text-green-600' : evm.cpi >= 0.9 ? 'text-yellow-600' : 'text-red-600') : '';
  const spiColor = evm && evm.spi != null ? (evm.spi >= 1 ? 'text-green-600' : evm.spi >= 0.9 ? 'text-yellow-600' : 'text-red-600') : '';

  const handleDeleteInstruction = async (inst: InstructionDto) => {
    if (!confirm('Delete this instruction?')) return;
    await deleteInstruction(projectId, inst.id);
    setInstructions(prev => prev.filter(i => i.id !== inst.id));
  };

  const handleToggleImportant = async (inst: InstructionDto) => {
    const updated = await updateInstruction(projectId, inst.id, { important: !inst.important });
    setInstructions(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const handleDeleteNote = async (note: NoteDto) => {
    if (!confirm('Delete this note?')) return;
    await deleteNote(projectId, note.id);
    setNotes(prev => prev.filter(n => n.id !== note.id));
  };

  const handleTogglePinned = async (note: NoteDto) => {
    const updated = await updateNote(projectId, note.id, { pinned: !note.pinned });
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  if (loading) return <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Merged Project Dashboard Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Highlights</h3>
          <div className="flex items-center gap-3">
            {project.strategicScore != null && <span className="text-sm text-gray-500">Score: {project.strategicScore}/10</span>}
            {evm && <span className="text-sm text-gray-500">{evm.completedTasks}/{evm.totalTasks} tasks done</span>}
          </div>
        </div>

        {/* Two-column body: Key Info + EVM Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Info */}
          <div className="space-y-3">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <span className="text-gray-500">Manager</span>
              <span className="text-gray-900 font-medium">{project.managerName}</span>
              <span className="text-gray-500">Client</span>
              <span className="text-gray-900 font-medium">{project.clientName || '—'}</span>
              <span className="text-gray-500">Program</span>
              <span className="text-gray-900 font-medium">{project.programName || '—'}</span>
              <span className="text-gray-500">Timeline</span>
              <span className="text-gray-900 font-medium">
                {project.targetStartDate && project.targetEndDate
                  ? `${formatDate(project.targetStartDate)} → ${formatDate(project.targetEndDate)}`
                  : '—'}
              </span>
            </div>
            {timelinePct != null && (
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${timelineColor}`} style={{ width: `${timelinePct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{timelinePct}%</span>
                </div>
                {durationLabel && <span className="text-xs text-gray-400">{durationLabel}</span>}
              </div>
            )}
          </div>

          {/* EVM Metrics */}
          {evm && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-medium">PV</div>
                  <div className="text-lg font-bold text-gray-900">{fmt(evm.pvToday)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-medium">EV</div>
                  <div className="text-lg font-bold text-gray-900">{fmt(evm.earnedValue)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-medium">AC</div>
                  <div className="text-lg font-bold text-gray-900">{fmt(evm.actualCost)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-medium">CV</div>
                  <div className={`text-lg font-bold ${cvColor}`}>{fmt(evm.costVariance)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-medium">SV</div>
                  <div className={`text-lg font-bold ${svColor}`}>{fmt(evm.scheduleVariance)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-medium">CPI</div>
                  <div className={`text-lg font-bold ${cpiColor}`}>{evm.cpi != null ? evm.cpi.toFixed(2) : '—'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-medium">SPI</div>
                  <div className={`text-lg font-bold ${spiColor}`}>{evm.spi != null ? evm.spi.toFixed(2) : '—'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom metrics row */}
        {evm && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Completion</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-primary-600 rounded-full h-2.5" style={{ width: `${Math.round(evm.completionPct * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-gray-700">{(evm.completionPct * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Budget</div>
              <div className="text-sm font-medium text-gray-900 mt-1">{fmt(evm.budget)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Labor Cost</div>
              <div className="text-sm font-medium text-gray-900 mt-1">{fmt(evm.laborCost)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Risk Score (max)</div>
              <div className="text-sm font-medium text-gray-900 mt-1">{evm.maxRiskScore} <span className="text-xs text-gray-400">avg: {evm.avgRiskScore.toFixed(1)}</span></div>
            </div>
          </div>
        )}

        {/* Phase financials (only when phases have planned amounts) */}
        {totalPlanned > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Planned (Phases)</div>
              <div className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(totalPlanned)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Payments Received</div>
              <div className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(totalPaid)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-gray-500 mb-1">Collection Progress</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div className={`${paymentColor} rounded-full h-2.5`} style={{ width: `${paymentPct}%` }} />
                </div>
                <span className="text-sm font-semibold text-gray-700">{paymentPct}%</span>
              </div>
              <span className="text-xs text-gray-400">{formatCurrency(totalPaid)} of {formatCurrency(totalPlanned)} collected</span>
            </div>
          </div>
        )}
      </div>

      {/* Instructions and My Notes side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructions */}
        <div>
          {visibleInstructions.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Instructions</h3>
              {visibleInstructions.map(inst => (
                <div key={inst.id} className={`bg-white rounded-xl border p-5 ${inst.important ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {inst.important && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Important</span>}
                      <span className="text-sm text-gray-500">{inst.authorName}</span>
                      <span className="text-xs text-gray-400">{formatDate(inst.createdAt)}</span>
                      {inst.visibleFrom && inst.visibleTo && (
                        <span className="text-xs text-gray-400">{inst.visibleFrom} &rarr; {inst.visibleTo}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {canCreateInstructions && (
                        <button onClick={() => handleToggleImportant(inst)} className="text-xs text-gray-400 hover:text-amber-600 px-1" title={inst.important ? 'Unmark important' : 'Mark important'}>
                          {inst.important ? '★' : '☆'}
                        </button>
                      )}
                      {(inst.authorId === currentUserId || isAdmin) && (
                        <button onClick={() => handleDeleteInstruction(inst)} className="text-xs text-red-400 hover:text-red-600 px-1">Delete</button>
                      )}
                    </div>
                  </div>
                  <MarkdownRenderer content={inst.content} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
              <p className="text-sm text-gray-400">No instructions yet.</p>
            </div>
          )}
          {canCreateInstructions && (
            <button onClick={() => setShowNewInstruction(true)} className="mt-2 text-sm text-primary-600 hover:text-primary-800 font-medium">
              + Add Instruction
            </button>
          )}
        </div>

        {/* My Notes */}
        <div>
          {notes.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">My Notes</h3>
              {notes.map(note => (
                <div key={note.id} className={`bg-white rounded-xl border p-5 ${note.pinned ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {note.pinned && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">Pinned</span>}
                      <span className="text-xs text-gray-400">{formatDate(note.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button onClick={() => handleTogglePinned(note)} className="text-xs text-gray-400 hover:text-indigo-600 px-1" title={note.pinned ? 'Unpin' : 'Pin'}>
                        {note.pinned ? '📌' : '📍'}
                      </button>
                      <button onClick={() => handleDeleteNote(note)} className="text-xs text-red-400 hover:text-red-600 px-1">Delete</button>
                    </div>
                  </div>
                  <MarkdownRenderer content={note.content} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Notes</h3>
              <p className="text-sm text-gray-400">No notes yet.</p>
            </div>
          )}
          <button onClick={() => setShowNewNote(true)} className="mt-2 text-sm text-primary-600 hover:text-primary-800 font-medium">
            + Add Note
          </button>
        </div>
      </div>

      {showNewInstruction && (
        <NewInstructionModal projectId={projectId} onClose={() => setShowNewInstruction(false)} onCreated={(inst) => { setInstructions(prev => [...prev, inst]); setShowNewInstruction(false); }} />
      )}

      {showNewNote && (
        <NewNoteModal projectId={projectId} onClose={() => setShowNewNote(false)} onCreated={(note) => { setNotes(prev => [...prev, note]); setShowNewNote(false); }} />
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
                const hasPayment = phase.plannedAmount && Number(phase.plannedAmount) > 0;
                const paid = Number(phase.totalPaid || 0);
                const planned = Number(phase.plannedAmount || 0);
                const phasePct = planned > 0 ? Math.min(100, Math.round((paid / planned) * 100)) : 0;
                const phaseColor = phasePct >= 100 ? 'bg-green-500' : phasePct >= 50 ? 'bg-blue-500' : planned > 0 ? 'bg-amber-500' : 'bg-gray-300';
                return (
                  <div key={phase.id} className="py-2 px-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900">{phase.name}</span>
                        {phase.startDate && phase.endDate && (
                          <span className="ml-2 text-xs text-gray-400">{formatDate(phase.startDate)} &rarr; {formatDate(phase.endDate)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
                        {hasPayment && (
                          <span className="text-xs">{formatCurrency(paid)} / {formatCurrency(planned)}</span>
                        )}
                        {phaseDels.length > 0 && (
                          <span>{completedDels}/{phaseDels.length} deliverables</span>
                        )}
                        {phase.stage && <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}>{stageLabel(phase.stage)}</span>}
                      </div>
                    </div>
                    {hasPayment && (
                      <div className="mt-1.5">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${phaseColor}`} style={{ width: `${phasePct}%` }} />
                        </div>
                      </div>
                    )}
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

function NewInstructionModal({ projectId, onClose, onCreated }: { projectId: number; onClose: () => void; onCreated: (inst: InstructionDto) => void }) {
  const [content, setContent] = useState('');
  const [important, setImportant] = useState(false);
  const [visibleFrom, setVisibleFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [visibleTo, setVisibleTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const inst = await createInstruction(projectId, {
        content: content.trim(),
        important,
        visibleFrom,
        visibleTo,
      });
      onCreated(inst);
    } catch {
      setError('Failed to create instruction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New Instruction" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Write your instruction (markdown supported)..." />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="important" checked={important} onChange={e => setImportant(e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <label htmlFor="important" className="text-sm font-medium text-gray-700">Mark as important</label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visible from</label>
            <input type="date" value={visibleFrom} onChange={e => setVisibleFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visible to</label>
            <input type="date" value={visibleTo} onChange={e => setVisibleTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || !content.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Create
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NewNoteModal({ projectId, onClose, onCreated }: { projectId: number; onClose: () => void; onCreated: (note: NoteDto) => void }) {
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const note = await createNote(projectId, {
        content: content.trim(),
        pinned,
      });
      onCreated(note);
    } catch {
      setError('Failed to create note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New Note" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Write your note (markdown supported)..." />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="pinned" checked={pinned} onChange={e => setPinned(e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <label htmlFor="pinned" className="text-sm font-medium text-gray-700">Pin to top</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || !content.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Create
          </button>
        </div>
      </form>
    </Modal>
  );
}