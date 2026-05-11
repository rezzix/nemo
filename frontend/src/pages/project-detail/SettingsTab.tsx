import { useState, useEffect, useCallback } from 'react';
import type { ProjectDto, LabelDto } from '@/types';
import { updateProject, getLabels, createLabel, updateLabel, deleteLabel } from '@/api/projects';
import { extractValidationErrors } from '@/api/client';
import Spinner from '@/components/common/Spinner';

export default function SettingsTab({ project, onUpdate, canEdit }: { project: ProjectDto; onUpdate: (p: ProjectDto) => void; canEdit: boolean }) {
  const [stage, setStage] = useState(project.stage || 'INITIATION');
  const [strategicScore, setStrategicScore] = useState(project.strategicScore?.toString() || '');
  const [plannedValue, setPlannedValue] = useState(project.plannedValue || '');
  const [budget, setBudget] = useState(project.budget || '');
  const [budgetSpent, setBudgetSpent] = useState(project.budgetSpent || '');
  const [targetStartDate, setTargetStartDate] = useState(project.targetStartDate || '');
  const [targetEndDate, setTargetEndDate] = useState(project.targetEndDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Labels state
  const [labels, setLabels] = useState<LabelDto[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');

  const fetchLabels = useCallback(async () => {
    setLabelsLoading(true);
    try { setLabels(await getLabels(project.id)); } finally { setLabelsLoading(false); }
  }, [project.id]);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);

  const handleCreateLabel = async () => {
    if (!newName.trim()) return;
    await createLabel(project.id, { name: newName.trim(), color: newColor });
    setNewName('');
    setNewColor('#6366f1');
    fetchLabels();
  };

  const handleUpdateLabel = async (id: number) => {
    if (!editName.trim()) return;
    await updateLabel(project.id, id, { name: editName.trim(), color: editColor });
    setEditingId(null);
    fetchLabels();
  };

  const handleDeleteLabel = async (id: number) => {
    if (!confirm('Delete this label?')) return;
    await deleteLabel(project.id, id);
    fetchLabels();
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (strategicScore && (Number(strategicScore) < 1 || Number(strategicScore) > 10)) {
      errors.strategicScore = 'Strategic score must be between 1 and 10';
    }
    if (plannedValue && isNaN(Number(plannedValue))) {
      errors.plannedValue = 'Planned value must be a number';
    }
    if (budget && isNaN(Number(budget))) {
      errors.budget = 'Budget must be a number';
    }
    if (budgetSpent && isNaN(Number(budgetSpent))) {
      errors.budgetSpent = 'Budget spent must be a number';
    }
    if (targetStartDate && targetEndDate && targetEndDate < targetStartDate) {
      errors.targetEndDate = 'End date must be after start date';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setError(null); setSuccess(false);
    try {
      const updated = await updateProject(project.id, {
        stage, strategicScore: strategicScore ? Number(strategicScore) : null,
        plannedValue: plannedValue || null, budget: budget || null,
        budgetSpent: budgetSpent || null,
        targetStartDate: targetStartDate || null, targetEndDate: targetEndDate || null,
      });
      onUpdate(updated);
      setSuccess(true);
    } catch (err) {
      const serverErrors = extractValidationErrors(err);
      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
      } else {
        setError('Failed to save project settings.');
      }
    } finally { setSaving(false); }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${fieldErrors[field] ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'}`;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900">Project Settings</h3>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">Settings saved.</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select value={stage} onChange={e => setStage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="INITIATION">Initiation</option>
              <option value="PLANNING">Planning</option>
              <option value="EXECUTION">Execution</option>
              <option value="CLOSING">Closing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strategic Score (1-10)</label>
            <input type="number" min="1" max="10" value={strategicScore} onChange={e => setStrategicScore(e.target.value)} placeholder="e.g. 7" className={inputClass('strategicScore')} />
            {fieldErrors.strategicScore && <p className="mt-1 text-sm text-red-600">{fieldErrors.strategicScore}</p>}
          </div>
        </div>

        <h4 className="text-sm font-semibold text-gray-700 pt-2 border-t border-gray-100">Budget &amp; EVM</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Planned Value (PV Baseline)</label>
            <input type="text" value={plannedValue} onChange={e => setPlannedValue(e.target.value)} placeholder="e.g. 150000" className={inputClass('plannedValue')} />
            {fieldErrors.plannedValue && <p className="mt-1 text-sm text-red-600">{fieldErrors.plannedValue}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget</label>
            <input type="text" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 150000" className={inputClass('budget')} />
            {fieldErrors.budget && <p className="mt-1 text-sm text-red-600">{fieldErrors.budget}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Spent (Non-Labor)</label>
            <input type="text" value={budgetSpent} onChange={e => setBudgetSpent(e.target.value)} placeholder="e.g. 12000" className={inputClass('budgetSpent')} />
            {fieldErrors.budgetSpent && <p className="mt-1 text-sm text-red-600">{fieldErrors.budgetSpent}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Start Date</label>
            <input type="date" value={targetStartDate} onChange={e => setTargetStartDate(e.target.value)} className={inputClass('targetStartDate')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target End Date</label>
            <input type="date" value={targetEndDate} onChange={e => setTargetEndDate(e.target.value)} className={inputClass('targetEndDate')} />
            {fieldErrors.targetEndDate && <p className="mt-1 text-sm text-red-600">{fieldErrors.targetEndDate}</p>}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Labels section */}
      {canEdit && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Labels</h3>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Label name..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer" />
            </div>
            <button onClick={handleCreateLabel} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Add</button>
          </div>

          {labelsLoading ? (
            <div className="flex justify-center py-4"><Spinner className="h-5 w-5 text-primary-600" /></div>
          ) : labels.length === 0 ? (
            <p className="text-gray-500 text-sm">No labels yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {labels.map(l => (
                <div key={l.id} className="flex items-center gap-1.5 group">
                  {editingId === l.id ? (
                    <>
                      <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-6 h-6 border border-gray-300 rounded cursor-pointer" />
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" onKeyDown={(e) => e.key === 'Enter' && handleUpdateLabel(l.id)} autoFocus />
                      <button onClick={() => handleUpdateLabel(l.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: l.color + '20', color: l.color }}>{l.name}</span>
                      <button onClick={() => { setEditingId(l.id); setEditName(l.name); setEditColor(l.color); }} className="text-primary-600 hover:text-primary-800 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                      <button onClick={() => handleDeleteLabel(l.id)} className="text-red-600 hover:text-red-800 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}