import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPortfolioByCompany, getEvmMetrics, getPortfolioSummary, listPortfolioRaidItems } from '@/api/pmo';
import { listProjects } from '@/api/projects';
import { formatCurrency, stageBadge, deadlineBadge, deadlineLabel, riskColor, riskLabel, eviColor } from '@/utils/format';
import type { CompanyPortfolioSummary, EvmMetrics, PortfolioSummary, ProjectDto, RaidItemDto } from '@/types';
import Spinner from '@/components/common/Spinner';

export default function PortfolioReport() {
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<CompanyPortfolioSummary[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [evmMap, setEvmMap] = useState<Record<number, EvmMetrics>>({});
  const [risks, setRisks] = useState<RaidItemDto[]>([]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [companyList, portfolioData, projectList, raidData] = await Promise.all([
        getPortfolioByCompany().catch(() => []),
        getPortfolioSummary().catch(() => null),
        listProjects(),
        listPortfolioRaidItems('RISK').catch(() => [] as RaidItemDto[]),
      ]);
      setCompanyData(companyList);
      setPortfolio(portfolioData);
      setProjects(projectList);
      setRisks(raidData);

      const ids = projectList.map((p) => p.id);
      const evmResults = await Promise.all(ids.map((id) => getEvmMetrics(id).catch(() => null)));
      const map: Record<number, EvmMetrics> = {};
      evmResults.forEach((e, i) => { if (e) map[ids[i]] = e; });
      setEvmMap(map);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return <div className="flex items-center justify-center h-32"><Spinner className="h-6 w-6 text-primary-600" /></div>;
  }

  const totalBudget = portfolio?.totalBudget ?? projects.reduce((s, p) => s + Number(p.budget || 0), 0);
  const totalSpent = portfolio?.totalBudgetSpent ?? projects.reduce((s, p) => s + Number(p.budgetSpent || 0), 0);
  const topRisks = [...risks].filter(r => r.status === 'OPEN' || r.status === 'MITIGATING').sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      {portfolio && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Total Budget</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Completion</p>
            <p className="text-xl font-bold text-gray-900">{portfolio.totalTasks > 0 ? ((portfolio.totalCompleted / portfolio.totalTasks) * 100).toFixed(0) + '%' : '-'}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Active Risks</p>
            <p className="text-xl font-bold text-gray-900">{portfolio.totalOpenRisks + portfolio.totalMitigatingRisks}</p>
          </div>
        </div>
      )}

      {/* Stage Distribution */}
      {portfolio && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Projects by Stage</h3>
          <div className="flex flex-wrap gap-4">
            {(['INITIATION', 'PLANNING', 'EXECUTION', 'CLOSING'] as const).map(stage => (
              <div key={stage} className="flex-1 text-center">
                <div className="text-2xl font-bold text-gray-900">{portfolio.stageDistribution[stage] || 0}</div>
                <span className={'inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ' + stageBadge(stage)}>{stage}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Breakdown */}
      {companyData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-700 px-5 py-3 border-b border-gray-200">Performance by Company</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Company</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">Projects</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">Budget</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">Spent</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">Completion</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">Risks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companyData.map((c) => (
                <tr key={c.companyId ?? 'unassigned'} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.companyName}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{c.totalProjects}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(c.totalBudget)}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(c.totalBudgetSpent)}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{c.totalTasks > 0 ? ((c.totalCompleted / c.totalTasks) * 100).toFixed(0) + '%' : '-'}</td>
                  <td className="px-3 py-3 text-right">{c.totalOpenRisks + c.totalMitigatingRisks > 0 ? (
                    <span className="text-amber-600 font-medium">{c.totalOpenRisks + c.totalMitigatingRisks}</span>
                  ) : <span className="text-gray-400">0</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Project EVM Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-700 px-5 py-3 border-b border-gray-200">Project Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Project</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Stage</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">Budget</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">PV</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">EV</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">AC</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">CPI</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">SPI</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">CV</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">SV</th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((p) => {
                const evm = evmMap[p.id];
                if (!evm) return null;
                const completionPct = Math.round(evm.completionPct * 100);
                const dlBadge = p.targetEndDate ? deadlineBadge(p.targetEndDate) : '';
                const cpiColor = evm.cpi != null ? eviColor(evm.cpi) : '';
                const spiColor = evm.spi != null ? eviColor(evm.spi) : '';
                const cvColor = evm.costVariance >= 0 ? 'text-green-600' : 'text-red-600';
                const svColor = evm.scheduleVariance >= 0 ? 'text-green-600' : 'text-red-600';
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium"><Link to={`/projects/${p.id}`} className="text-primary-600 hover:text-primary-800">{p.name}</Link></td>
                    <td className="px-3 py-3">
                      <span className={"inline-block px-2 py-0.5 rounded-full text-xs font-medium " + stageBadge(evm.stage)}>{evm.stage}</span>
                      {p.targetEndDate && deadlineLabel(p.targetEndDate) && (
                        <span className={'inline-block ml-1 px-2 py-0.5 rounded-full text-xs font-medium ' + dlBadge}>
                          {deadlineLabel(p.targetEndDate)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(evm.budget)}</td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(evm.plannedValue)}</td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(evm.earnedValue)}</td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(evm.actualCost)}</td>
                    <td className={'px-3 py-3 text-right font-semibold ' + cpiColor}>{evm.cpi != null ? evm.cpi.toFixed(2) : '—'}</td>
                    <td className={'px-3 py-3 text-right font-semibold ' + spiColor}>{evm.spi != null ? evm.spi.toFixed(2) : '—'}</td>
                    <td className={'px-3 py-3 text-right ' + cvColor}>{formatCurrency(evm.costVariance)}</td>
                    <td className={'px-3 py-3 text-right ' + svColor}>{formatCurrency(evm.scheduleVariance)}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-primary-600 rounded-full h-2" style={{ width: completionPct + '%' }} />
                        </div>
                        <span className="text-xs text-gray-600 w-8 text-right">{completionPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Risks */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-700 px-5 py-3 border-b border-gray-200">Top Risks</h3>
        {topRisks.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No risks registered</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Project</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Risk</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Prob</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Impact</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Score</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Level</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topRisks.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{r.projectName}</td>
                  <td className="px-3 py-3 text-gray-700">{r.title}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{r.probability ?? '—'}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{r.impact ?? '—'}</td>
                  <td className="px-3 py-3 text-center font-semibold">{r.riskScore}</td>
                  <td className="px-3 py-3 text-center"><span className={'inline-block px-2 py-0.5 rounded-full text-xs font-medium ' + riskColor(r.riskScore)}>{riskLabel(r.riskScore)}</span></td>
                  <td className="px-3 py-3"><span className="text-xs font-medium text-gray-600">{r.status}</span></td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{r.ownerName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}