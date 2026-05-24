import { useState, useEffect, useCallback } from 'react';
import type { MemberDto, UserDto, AllocationSummaryDto } from '@/types';
import { getMembers, addMembers, removeMember, updateMemberScore, updateMemberAllocation } from '@/api/projects';
import { listAllUsers, getUserAllocationSummary } from '@/api/users';
import { scoreLabel, scoreColor } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

const SCORE_OPTIONS = [
  { value: 0, label: 'Marginal' },
  { value: 1, label: 'Functional' },
  { value: 2, label: 'Impactful' },
  { value: 4, label: 'Strategic' },
  { value: 5, label: 'Exceptional' },
];

export default function MembersTab({ projectId, managerId, canEdit, canSeeScores: canSeeScoresProp }: { projectId: number; managerId: number; canEdit: boolean; canSeeScores?: boolean }) {
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [scoringUserId, setScoringUserId] = useState<number | null>(null);
  const [savingScore, setSavingScore] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [editingAllocUserId, setEditingAllocUserId] = useState<number | null>(null);
  const [editAllocValue, setEditAllocValue] = useState('');
  const [savingAlloc, setSavingAlloc] = useState(false);
  const [allocationSummaries, setAllocationSummaries] = useState<Record<number, AllocationSummaryDto>>({});

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const mems = await getMembers(projectId);
      setMembers(mems);
      // Fetch allocation summaries for all members
      const summaries: Record<number, AllocationSummaryDto> = {};
      await Promise.all(mems.map(async (m) => {
        try {
          summaries[m.userId] = await getUserAllocationSummary(m.userId);
        } catch { /* ignore */ }
      }));
      setAllocationSummaries(summaries);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRemove = async (userId: number) => {
    if (userId === managerId) { alert('Cannot remove the project manager.'); return; }
    if (!confirm('Remove this member?')) return;
    await removeMember(projectId, userId);
    fetchMembers();
  };

  const handleScore = async (userId: number, score: number) => {
    setSavingScore(true);
    setScoreError(null);
    try {
      await updateMemberScore(projectId, userId, score);
      setScoringUserId(null);
      fetchMembers();
    } catch (err) {
      setScoreError('Failed to save evaluation. Please try again.');
      console.error('Failed to update score:', err);
    } finally {
      setSavingScore(false);
    }
  };

  const canSeeScores = canSeeScoresProp ?? canEdit;

  const handleAllocationSave = async (userId: number) => {
    const val = Number(editAllocValue);
    if (val < 1 || val > 100) return;
    setSavingAlloc(true);
    try {
      await updateMemberAllocation(projectId, userId, val);
      setEditingAllocUserId(null);
      fetchMembers();
    } catch { /* ignore */ } finally { setSavingAlloc(false); }
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => setShowAdd(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            Add Members
          </button>
        </div>
      )}
      {loading ? <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Full Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Allocation</th>
                {canSeeScores && <th className="text-left px-4 py-3 font-medium text-gray-500">Evaluation</th>}
                {canEdit && <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{m.username}</td>
                  <td className="px-4 py-3">{m.fullName}</td>
                  <td className="px-4 py-3">
                    {m.userId === managerId && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Manager</span>}
                  </td>
                  <td className="px-4 py-3">
                    {editingAllocUserId === m.userId ? (
                      <div className="flex items-center gap-1">
                        <input type="number" min={1} max={100} value={editAllocValue} onChange={(e) => setEditAllocValue(e.target.value)} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" autoFocus />
                        <span className="text-xs text-gray-500">%</span>
                        <button onClick={() => handleAllocationSave(m.userId)} disabled={savingAlloc} className="text-green-600 hover:text-green-800 text-xs font-medium">{savingAlloc ? '...' : 'Save'}</button>
                        <button onClick={() => setEditingAllocUserId(null)} className="text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { if (canEdit) { setEditingAllocUserId(m.userId); setEditAllocValue(String(m.allocation)); } }}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          (allocationSummaries[m.userId]?.totalAllocation ?? 0) > 100
                            ? 'bg-red-100 text-red-700'
                            : m.allocation >= 80
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        } ${canEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                      >
                        {m.allocation}%
                      </button>
                    )}
                    {editingAllocUserId !== m.userId && allocationSummaries[m.userId] && allocationSummaries[m.userId].totalAllocation > 100 && (
                      <span className="ml-1 text-xs text-red-500">({allocationSummaries[m.userId].totalAllocation}% total)</span>
                    )}
                  </td>
                  {canSeeScores && (
                    <td className="px-4 py-3">
                      {scoreError && scoringUserId === m.userId && (
                        <p className="text-xs text-red-600 mb-1">{scoreError}</p>
                      )}
                      {scoringUserId === m.userId ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {SCORE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              disabled={savingScore}
                              onClick={() => handleScore(m.userId, opt.value)}
                              className={`px-2 py-1 rounded text-xs font-medium ${scoreColor(opt.value)} hover:opacity-80 disabled:opacity-50`}
                            >
                              {opt.value} — {opt.label}
                            </button>
                          ))}
                          <button
                            onClick={() => setScoringUserId(null)}
                            className="text-gray-400 hover:text-gray-600 text-xs ml-1"
                            disabled={savingScore}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : m.score !== null && m.score !== undefined ? (
                        <button
                          onClick={() => { canEdit && setScoringUserId(m.userId); setScoreError(null); }}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${canEdit ? 'cursor-pointer hover:opacity-80' : ''} ${scoreColor(m.score)}`}
                        >
                          {m.score} — {scoreLabel(m.score)}
                        </button>
                      ) : canEdit ? (
                        <button
                          onClick={() => { setScoringUserId(m.userId); setScoreError(null); }}
                          className="text-xs text-gray-400 hover:text-primary-600 hover:underline"
                        >
                          Evaluate
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  )}
                  {canEdit && (
                    <td className="px-4 py-3">
                      {m.userId !== managerId && (
                        <button onClick={() => handleRemove(m.userId)} className="text-red-600 hover:text-red-800 text-xs font-medium">Remove</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={canSeeScores ? (canEdit ? 6 : 5) : (canEdit ? 5 : 4)} className="px-4 py-8 text-center text-gray-500">No members.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {showAdd && <AddMembersModal projectId={projectId} currentMembers={members} onClose={() => { setShowAdd(false); fetchMembers(); }} />}
    </div>
  );
}

function AddMembersModal({ projectId, currentMembers, onClose }: { projectId: number; currentMembers: MemberDto[]; onClose: () => void }) {
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [allocations, setAllocations] = useState<Record<number, number>>({});
  const [existingAllocations, setExistingAllocations] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAllUsers({ active: 'true' }).then(setAllUsers);
  }, []);

  useEffect(() => {
    // Fetch allocation summaries for available users
    const memberIds = new Set(currentMembers.map((m) => m.userId));
    const fetchAllocs = async () => {
      const result: Record<number, number> = {};
      await Promise.all(allUsers.map(async (u) => {
        if (!memberIds.has(u.id)) {
          try {
            const summary = await getUserAllocationSummary(u.id);
            result[u.id] = summary.totalAllocation;
          } catch { /* ignore */ }
        }
      }));
      setExistingAllocations(result);
    };
    if (allUsers.length > 0) fetchAllocs();
  }, [allUsers, currentMembers]);

  const memberIds = new Set(currentMembers.map((m) => m.userId));
  const available = allUsers.filter((u) => !memberIds.has(u.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await addMembers(projectId, selected);
      // Set allocations for each added member
      await Promise.all(selected.map(async (userId) => {
        const alloc = allocations[userId] ?? 100;
        if (alloc !== 100) {
          try { await updateMemberAllocation(projectId, userId, alloc); } catch { /* ignore */ }
        }
      }));
      onClose();
    } catch {
      setError('Failed to add members.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const getTotalForUser = (userId: number) => {
    const existing = existingAllocations[userId] ?? 0;
    const newAlloc = selected.includes(userId) ? (allocations[userId] ?? 100) : 0;
    return existing + newAlloc;
  };

  return (
    <Modal title="Add Members" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div className="max-h-72 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
          {available.length === 0 && <p className="text-sm text-gray-500 p-2">All users are already members.</p>}
          {available.map((u) => {
            const isSelected = selected.includes(u.id);
            const existingTotal = existingAllocations[u.id] ?? 0;
            const newTotal = getTotalForUser(u.id);
            return (
              <label key={u.id} className={`flex items-center gap-2 text-sm py-1.5 px-1 rounded cursor-pointer ${isSelected ? 'bg-primary-50' : ''}`}>
                <input type="checkbox" checked={isSelected} onChange={() => toggle(u.id)} className="rounded border-gray-300 shrink-0" />
                <span className="truncate">{u.firstName} {u.lastName}</span>
                <span className="text-gray-400 text-xs shrink-0">({u.username})</span>
                {existingTotal > 0 && (
                  <span className={`text-xs shrink-0 ml-1 ${existingTotal > 100 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {existingTotal}% allocated
                  </span>
                )}
                {isSelected && (
                  <div className="flex items-center gap-1 ml-auto shrink-0">
                    <input
                      type="number" min={1} max={100}
                      value={allocations[u.id] ?? 100}
                      onChange={(e) => setAllocations((prev) => ({ ...prev, [u.id]: Number(e.target.value) }))}
                      className="w-14 px-1.5 py-0.5 border border-gray-300 rounded text-xs text-center"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-gray-500">%</span>
                    {newTotal > 100 && (
                      <span className="text-xs text-red-500 font-medium">{newTotal}% total</span>
                    )}
                  </div>
                )}
              </label>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || selected.length === 0} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Add {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
        </div>
      </form>
    </Modal>
  );
}