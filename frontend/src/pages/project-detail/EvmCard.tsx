import { useState, useEffect } from 'react';
import type { EvmMetrics } from '@/types';
import { getEvmMetrics } from '@/api/pmo';
import { stageBadge, stageLabel, formatCurrency } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

export default function EvmCard({ projectId }: { projectId: number }) {
  const [evm, setEvm] = useState<EvmMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getEvmMetrics(projectId).then(setEvm).catch(() => {}).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="bg-white rounded-xl border border-gray-200 p-6"><Spinner className="h-6 w-6 text-primary-600 mx-auto" /></div>;
  if (!evm) return null;

  const fmt = (v: number | null) => formatCurrency(v);
  const pct = (v: number) => (v * 100).toFixed(1) + '%';
  const cvColor = evm.costVariance >= 0 ? 'text-green-600' : 'text-red-600';
  const svColor = evm.scheduleVariance >= 0 ? 'text-green-600' : 'text-red-600';
  const cpiColor = evm.cpi >= 1 ? 'text-green-600' : evm.cpi >= 0.9 ? 'text-yellow-600' : 'text-red-600';
  const spiColor = evm.spi >= 1 ? 'text-green-600' : evm.spi >= 0.9 ? 'text-yellow-600' : 'text-red-600';

  const totalPaid = evm.totalPaid || 0;
  const derivedPV = evm.derivedPlannedValue || 0;
  const paymentPct = derivedPV > 0 ? Math.min(100, Math.round((totalPaid / derivedPV) * 100)) : 0;
  const paymentColor = paymentPct >= 100 ? 'bg-green-500' : paymentPct >= 50 ? 'bg-blue-500' : derivedPV > 0 ? 'bg-amber-500' : 'bg-gray-300';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Earned Value Management</h3>
        <div className="flex items-center gap-2">
          {evm.stage && <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${stageBadge(evm.stage)}`}>{stageLabel(evm.stage)}</span>}
          <span className="text-sm text-gray-500">{evm.completedIssues}/{evm.totalIssues} issues done</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
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
          <div className={`text-lg font-bold ${cpiColor}`}>{evm.cpi.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 font-medium">SPI</div>
          <div className={`text-lg font-bold ${spiColor}`}>{evm.spi.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-500">Completion</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2.5">
              <div className="bg-primary-600 rounded-full h-2.5" style={{ width: `${Math.round(evm.completionPct * 100)}%` }} />
            </div>
            <span className="text-sm font-semibold text-gray-700">{pct(evm.completionPct)}</span>
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

      {derivedPV > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500">Planned (Phases)</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{fmt(derivedPV)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Payments Received</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{fmt(totalPaid)}</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-gray-500 mb-1">Collection Progress</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                <div className={`${paymentColor} rounded-full h-2.5`} style={{ width: `${paymentPct}%` }} />
              </div>
              <span className="text-sm font-semibold text-gray-700">{paymentPct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}