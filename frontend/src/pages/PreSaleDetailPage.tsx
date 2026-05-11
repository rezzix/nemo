import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PreSaleDto, PreSaleStage, CostSummaryDto, TimeLogDto } from '@/types';
import { getPreSale, updatePreSale, convertToProject, getCostSummary } from '@/api/presales';
import { listTimeLogs } from '@/api/timeLogs';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, preSaleStageLabel, preSaleStageBadge, formatCurrency } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';

const STAGES: PreSaleStage[] = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export default function PreSaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'EXECUTIVE';

  const [presale, setPresale] = useState<PreSaleDto | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummaryDto | null>(null);
  const [timeLogs, setTimeLogs] = useState<TimeLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [ps, cost, logs] = await Promise.all([
        getPreSale(Number(id)),
        getCostSummary(Number(id)).catch(() => null),
        listTimeLogs({ presaleId: Number(id) }).catch(() => []),
      ]);
      setPresale(ps);
      setCostSummary(cost);
      setTimeLogs(logs);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!presale) return <div className="text-center text-gray-500 py-8">Pre-sale not found.</div>;

  const handleStageChange = async (newStage: PreSaleStage) => {
    if (!presale) return;
    try {
      const updated = await updatePreSale(presale.id, { stage: newStage });
      setPresale(updated);
      setShowStageModal(false);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <Link to="/presales" className="text-sm text-primary-600 hover:text-primary-800">&larr; Back to Pre-Sales</Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-gray-500">{presale.key}</span>
              <h2 className="text-2xl font-bold text-gray-900">{presale.name}</h2>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${preSaleStageBadge(presale.stage)}`}>{preSaleStageLabel(presale.stage)}</span>
            </div>
            {presale.description && <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{presale.description}</p>}
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowStageModal(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Change Stage</button>
              <button onClick={() => setShowEditModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Edit</button>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Client Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Client</h3>
          {presale.clientName ? (
            <div>
              <p className="font-medium text-gray-900">{presale.clientName}</p>
              {presale.clientContactName && <p className="text-sm text-gray-600 mt-1">Contact: {presale.clientContactName}</p>}
            </div>
          ) : <p className="text-gray-400 text-sm">No client assigned</p>}
        </div>

        {/* Financial Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Financial</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-600">Est. Value</span><span className="font-medium text-gray-900">{presale.estimatedValue ? formatCurrency(Number(presale.estimatedValue)) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Probability</span><span className="font-medium text-gray-900">{presale.probability != null ? `${presale.probability}%` : '—'}</span></div>
            {presale.estimatedValue && presale.probability != null && (
              <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-sm text-gray-600">Weighted Value</span><span className="font-medium text-primary-700">{formatCurrency(Number(presale.estimatedValue) * presale.probability / 100)}</span></div>
            )}
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-600">Close Date</span><span className="text-sm text-gray-900">{presale.expectedCloseDate ? formatDate(presale.expectedCloseDate) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Manager</span><span className="text-sm text-gray-900">{presale.managerName}</span></div>
            {presale.companyName && <div className="flex justify-between"><span className="text-sm text-gray-600">Company</span><span className="text-sm text-gray-900">{presale.companyName}</span></div>}
            {presale.programName && <div className="flex justify-between"><span className="text-sm text-gray-600">Program</span><span className="text-sm text-gray-900">{presale.programName}</span></div>}
            {presale.lostReason && <div><span className="text-sm text-gray-600">Lost Reason</span><p className="text-sm text-red-700 mt-1">{presale.lostReason}</p></div>}
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      {costSummary && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{costSummary.totalHours.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">Total Hours</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(costSummary.totalCost)}</p>
              <p className="text-xs text-gray-500 mt-1">Labor Cost</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className={`text-2xl font-bold ${costSummary.margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(costSummary.margin)}</p>
              <p className="text-xs text-gray-500 mt-1">Margin</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className={`text-2xl font-bold ${costSummary.marginPercent >= 0 ? 'text-green-700' : 'text-red-700'}`}>{costSummary.marginPercent.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">Margin %</p>
            </div>
          </div>
          {costSummary.byUser.length > 0 && (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-3 py-2 font-medium text-gray-500">User</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">Hours</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">Rate</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">Cost</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {costSummary.byUser.map(e => (
                  <tr key={e.userId} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{e.userName}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{e.hours.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(e.hourlyRate)}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(e.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Time Logs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Time Logs ({timeLogs.length})</h3>
        </div>
        {timeLogs.length === 0 ? (
          <p className="text-gray-500 text-sm p-5">No time logs recorded for this pre-sale.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-2 font-medium text-gray-500">Date</th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">User</th>
              <th className="text-right px-4 py-2 font-medium text-gray-500">Hours</th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">Description</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {timeLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600">{formatDate(log.date)}</td>
                  <td className="px-4 py-2 text-gray-900">{log.userName}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{log.hours.toFixed(1)}</td>
                  <td className="px-4 py-2 text-gray-600 max-w-xs truncate">{log.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Convert to Project */}
      {presale.convertedProjectId ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-green-800">Converted to project</p>
            <Link to={`/projects/${presale.convertedProjectId}`} className="text-sm text-primary-600 hover:text-primary-800">{presale.convertedProjectName}</Link>
          </div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${preSaleStageBadge('WON')}`}>Won</span>
        </div>
      ) : canEdit && presale.stage !== 'LOST' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Ready to convert?</p>
            <p className="text-sm text-gray-500">Convert this pre-sale into a project when the deal is won.</p>
          </div>
          <button onClick={() => setShowConvertModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Convert to Project</button>
        </div>
      ) : null}

      {showStageModal && (
        <StageModal currentStage={presale.stage} onSelect={handleStageChange} onClose={() => setShowStageModal(false)} />
      )}

      {showEditModal && (
        <EditPreSaleModal presale={presale} onClose={() => setShowEditModal(false)} onSaved={(updated) => { setPresale(updated); setShowEditModal(false); }} />
      )}

      {showConvertModal && presale && (
        <ConvertModal presale={presale} onClose={() => setShowConvertModal(false)} onConverted={(updated) => { setPresale(updated); setShowConvertModal(false); fetchData(); }} />
      )}
    </div>
  );
}

function StageModal({ currentStage, onSelect, onClose }: { currentStage: PreSaleStage; onSelect: (s: PreSaleStage) => void; onClose: () => void }) {
  return (
    <Modal title="Change Stage" onClose={onClose}>
      <div className="space-y-2">
        {STAGES.map(s => (
          <button key={s} onClick={() => onSelect(s)} disabled={s === currentStage}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${s === currentStage ? 'bg-primary-50 text-primary-700 cursor-default' : 'hover:bg-gray-50 text-gray-700'}`}>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${preSaleStageBadge(s)}`}>{preSaleStageLabel(s)}</span>
            {s === currentStage && <span className="text-xs text-primary-600">(current)</span>}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function EditPreSaleModal({ presale, onClose, onSaved }: { presale: PreSaleDto; onClose: () => void; onSaved: (ps: PreSaleDto) => void }) {
  const [name, setName] = useState(presale.name);
  const [description, setDescription] = useState(presale.description || '');
  const [estimatedValue, setEstimatedValue] = useState(presale.estimatedValue || '');
  const [probability, setProbability] = useState(presale.probability != null ? String(presale.probability) : '');
  const [expectedCloseDate, setExpectedCloseDate] = useState(presale.expectedCloseDate || '');
  const [lostReason, setLostReason] = useState(presale.lostReason || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const updated = await updatePreSale(presale.id, {
        name: name.trim(),
        description: description || undefined,
        estimatedValue: estimatedValue || null,
        probability: probability ? Number(probability) : null,
        expectedCloseDate: expectedCloseDate || null,
        lostReason: lostReason || null,
      });
      onSaved(updated);
    } catch { setError('Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Edit Pre-Sale" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value</label>
            <input type="text" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} placeholder="e.g. 50000" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
            <input type="number" min="0" max="100" value={probability} onChange={e => setProbability(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
            <input type="date" value={expectedCloseDate} onChange={e => setExpectedCloseDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lost Reason</label>
            <input value={lostReason} onChange={e => setLostReason(e.target.value)} placeholder="If lost, explain why" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || !name.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConvertModal({ presale, onClose, onConverted }: { presale: PreSaleDto; onClose: () => void; onConverted: (ps: PreSaleDto) => void }) {
  const [projectName, setProjectName] = useState(presale.name);
  const [projectKey, setProjectKey] = useState(presale.key);
  const [description, setDescription] = useState(presale.description || '');
  const [budget, setBudget] = useState(presale.estimatedValue || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectKey.trim()) return;
    setSaving(true); setError(null);
    try {
      const updated = await convertToProject(presale.id, {
        projectName: projectName.trim(),
        projectKey: projectKey.trim().toUpperCase(),
        programId: presale.programId ?? 0,
        managerId: presale.managerId,
        description: description || undefined,
        budget: budget || undefined,
      });
      onConverted(updated);
    } catch { setError('Failed to convert to project.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Convert to Project" onClose={onClose}>
      <form onSubmit={handleConvert} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <p className="text-sm text-gray-500">This will create a new project from this pre-sale and mark it as Won.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Key *</label>
            <input value={projectKey} onChange={e => setProjectKey(e.target.value)} maxLength={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
          <input type="text" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 50000" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || !projectName.trim() || !projectKey.trim()} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Convert
          </button>
        </div>
      </form>
    </Modal>
  );
}