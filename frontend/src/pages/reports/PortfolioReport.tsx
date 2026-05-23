import { useState, useEffect, useCallback } from 'react';
import { getPortfolioByCompany, getEvmMetrics, getPortfolioSummary } from '@/api/pmo';
import { listProjects } from '@/api/projects';
import { formatCurrency, stageBadge, deadlineBadge, deadlineLabel } from '@/utils/format';
import type { CompanyPortfolioSummary, EvmMetrics, PortfolioSummary, ProjectDto } from '@/types';
import Spinner from '@/components/common/Spinner';

export default function PortfolioReport() {
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<CompanyPortfolioSummary[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [evmMap, setEvmMap] = useState<Record<number, EvmMetrics>>({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [companyList, portfolioData, projectList] = await Promise.all([
        getPortfolioByCompany().catch(() => []),
        getPortfolioSummary().catch(() => null),
        listProjects(),
      ]);
      setCompanyData(companyList);
      setPortfolio(portfolioData);
      setProjects(projectList);

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
            <p className="text-xs text-gray-500">Open Risks</p>
            <p className="text-xl font-bold text-gray-900">{portfolio.totalOpenRisks + portfolio.totalMitigatingRisks}</p>
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-700 px-5 py-3 border-b border-gray-200">Project Performance</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Project</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">Stage</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600">Budget</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600">Spent</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600">CPI</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600">SPI</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((p) => {
              const evm = evmMap[p.id];
              if (!evm) return null;
              const spent = evm.actualCost;
              const completionPct = Math.round(evm.completionPct * 100);
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-3 py-3">
                    {p.stage ? <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge(p.stage)}`}>{p.stage}</span> : '-'}
                    {p.targetEndDate && deadlineLabel(p.targetEndDate) && <span className={`inline-block ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${deadlineBadge(p.targetEndDate)}`}>{deadlineLabel(p.targetEndDate)}</span>}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(Number(p.budget || 0))}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(spent)}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={evm.cpi != null ? (evm.cpi >= 1 ? 'text-green-600 font-semibold' : evm.cpi >= 0.9 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold') : ''}>
                      {evm.cpi != null ? evm.cpi.toFixed(2) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={evm.spi != null ? (evm.spi >= 1 ? 'text-green-600 font-semibold' : evm.spi >= 0.9 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold') : ''}>
                      {evm.spi != null ? evm.spi.toFixed(2) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-600 rounded-full h-2" style={{ width: `${completionPct}%` }} />
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
  );
}