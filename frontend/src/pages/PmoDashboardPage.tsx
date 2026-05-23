import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getPortfolioSummary, getEvmMetrics, listPortfolioRaidItems } from '@/api/pmo';
import { listProjects } from '@/api/projects';
import type { PortfolioSummary, EvmMetrics, RaidItemDto, ProjectDto } from '@/types';
import Spinner from '@/components/common/Spinner';
import { riskColor, riskLabel, stageBadge, formatCurrency, eviColor, deadlineBadge, deadlineLabel } from '@/utils/format';

export default function PmoDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [evmData, setEvmData] = useState<Record<number, EvmMetrics>>({});
  const [raidItems, setRaidItems] = useState<RaidItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [portfolioData, projectData] = await Promise.all([
        getPortfolioSummary(),
        listProjects()
      ]);
      setPortfolio(portfolioData);
      const projectList = Array.isArray(projectData) ? projectData : [];
      setProjects(projectList);

      // Fetch EVM for each project and RAID items
      const evmPromises = projectList.map((p: ProjectDto) =>
        getEvmMetrics(p.id).catch(() => null)
      );
      const evmResults = await Promise.all(evmPromises);
      const evmMap: Record<number, EvmMetrics> = {};
      projectList.forEach((p: ProjectDto, i: number) => {
        if (evmResults[i]) evmMap[p.id] = evmResults[i]!;
      });
      setEvmData(evmMap);

      // Fetch all RAID items across portfolio
      const allRaid = await listPortfolioRaidItems().catch(() => [] as RaidItemDto[]);
      setRaidItems(allRaid);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (!user) {
    return <div className="p-8 text-center text-gray-500">You do not have access to this page.</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  }

  const risks = raidItems.filter(r => r.type === 'RISK');
  const topRisks = [...risks].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">PMO Dashboard</h2>
        <div className="flex items-center gap-4">
          <Link to="/reports" className="text-sm text-gray-500 hover:text-gray-700 font-medium">View Reports</Link>
          <button onClick={fetchDashboard} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Refresh</button>
        </div>
      </div>

      {/* Portfolio KPIs */}
      {portfolio && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Projects" value={String(portfolio.totalProjects)} icon={ProjectIcon} />
          <StatCard label="Portfolio Budget" value={formatCurrency(portfolio.totalBudget)} sub={`Spent: ${formatCurrency(portfolio.totalBudgetSpent)}`} icon={BudgetIcon} />
          <StatCard label="Active Risks" value={String(portfolio.totalOpenRisks + portfolio.totalMitigatingRisks)} sub={`${portfolio.totalOpenRisks} open · ${portfolio.totalMitigatingRisks} mitigating`} icon={RiskIcon} />
          <StatCard label="Completion" value={`${portfolio.totalTasks > 0 ? Math.round((portfolio.totalCompleted / portfolio.totalTasks) * 100) : 0}%`} sub={`${portfolio.totalCompleted} / ${portfolio.totalTasks} tasks`} icon={ProgressIcon} />
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
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge(stage)}`}>{stage}</span>
              </div>
            ))}
          </div>
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
              {projects.map(p => {
                const evm = evmData[p.id];
                if (!evm) return null;
                const completionPct = Math.round(evm.completionPct * 100);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium"><Link to={`/projects/${p.id}`} className="text-primary-600 hover:text-primary-800">{p.name}</Link></td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge(evm.stage)}`}>{evm.stage}</span>
                      {p.targetEndDate && deadlineLabel(p.targetEndDate) && <span className={`inline-block ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${deadlineBadge(p.targetEndDate)}`}>{deadlineLabel(p.targetEndDate)}</span>}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(evm.budget)}</td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(evm.plannedValue)}</td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(evm.earnedValue)}</td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(evm.actualCost)}</td>
                    <td className={`px-3 py-3 text-right font-semibold ${evm.cpi != null ? eviColor(evm.cpi) : ''}`}>{evm.cpi != null ? evm.cpi.toFixed(2) : '—'}</td>
                    <td className={`px-3 py-3 text-right font-semibold ${evm.spi != null ? eviColor(evm.spi) : ''}`}>{evm.spi != null ? evm.spi.toFixed(2) : '—'}</td>
                    <td className={`px-3 py-3 text-right ${evm.costVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(evm.costVariance)}</td>
                    <td className={`px-3 py-3 text-right ${evm.scheduleVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(evm.scheduleVariance)}</td>
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
                  <td className="px-3 py-3 text-center"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${riskColor(r.riskScore)}`}>{riskLabel(r.riskScore)}</span></td>
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

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: React.FC<{ className?: string }> }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <div className="text-xs text-gray-500 font-medium">{label}</div>
          <div className="text-xl font-bold text-gray-900">{value}</div>
          {sub && <div className="text-xs text-gray-400">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function ProjectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-18 0A2.25 2.25 0 004.5 15.75h15a2.25 2.25 0 002.25-2.25V12m-18 0V6A2.25 2.25 0 014.5 3.75h15A2.25 2.25 0 0121.75 6v6" />
    </svg>
  );
}

function BudgetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.651 12 12 12c-.651 0-1.536.219-2.121.659C9.121 13.538 9.121 14.962 10.303 15.841c1.171.879 3.07.879 4.242 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function RiskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function ProgressIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}