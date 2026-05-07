import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getPortfolioSummary, getEvmMetrics, listPortfolioRaidItems, getPortfolioByCompany, getPortfolioTimeline } from '@/api/pmo';
import { listProjects } from '@/api/projects';
import { formatCurrency, stageBadge, stageLabel, riskColor, riskLabel } from '@/utils/format';
import type { PortfolioSummary, EvmMetrics, RaidItemDto, ProjectDto, CompanyPortfolioSummary, ProjectTimelineEntry } from '@/types';
import BarChart from '@/pages/reports/BarChart';
import Spinner from '@/components/common/Spinner';

interface Alert {
  projectId: number;
  projectKey: string;
  projectName: string;
  type: 'cpi' | 'spi' | 'budget' | 'risk';
  message: string;
  value: string;
  severity: 'red' | 'yellow';
}

function computeAlerts(
  projects: ProjectDto[],
  evmMap: Record<number, EvmMetrics>,
  allRisks: RaidItemDto[],
): Alert[] {
  const alerts: Alert[] = [];
  for (const project of projects) {
    const evm = evmMap[project.id];
    const projectRisks = allRisks.filter((r) => r.projectId === project.id);
    const maxRisk = projectRisks.length > 0 ? Math.max(...projectRisks.map((r) => r.riskScore)) : 0;

    if (evm) {
      if (evm.cpi < 0.9) {
        alerts.push({
          projectId: project.id, projectKey: project.key, projectName: project.name,
          type: 'cpi', message: 'Cost performance below threshold',
          value: `CPI ${evm.cpi.toFixed(2)}`, severity: evm.cpi < 0.8 ? 'red' : 'yellow',
        });
      }
      if (evm.spi < 0.9) {
        alerts.push({
          projectId: project.id, projectKey: project.key, projectName: project.name,
          type: 'spi', message: 'Schedule performance below threshold',
          value: `SPI ${evm.spi.toFixed(2)}`, severity: evm.spi < 0.8 ? 'red' : 'yellow',
        });
      }
      if (project.budget && Number(project.budget) > 0) {
        const spentRatio = (Number(project.budgetSpent || 0) + evm.actualCost) / Number(project.budget);
        if (spentRatio > 0.8) {
          alerts.push({
            projectId: project.id, projectKey: project.key, projectName: project.name,
            type: 'budget', message: 'Budget consumption exceeds 80%',
            value: `${(spentRatio * 100).toFixed(0)}% spent`, severity: spentRatio > 1 ? 'red' : 'yellow',
          });
        }
      }
    }
    if (maxRisk >= 15) {
      alerts.push({
        projectId: project.id, projectKey: project.key, projectName: project.name,
        type: 'risk', message: 'High-severity risk identified',
        value: `Max risk score ${maxRisk}`, severity: maxRisk >= 20 ? 'red' : 'yellow',
      });
    }
  }
  return alerts.sort((a, b) => (a.severity === 'red' ? 0 : 1) - (b.severity === 'red' ? 0 : 1));
}

const alertIcons: Record<Alert['type'], string> = {
  cpi: '💰', spi: '📅', budget: '💳', risk: '⚠️',
};

const alertSeverityStyles: Record<Alert['severity'], string> = {
  red: 'border-red-300 bg-red-50',
  yellow: 'border-amber-300 bg-amber-50',
};

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [evmMap, setEvmMap] = useState<Record<number, EvmMetrics>>({});
  const [allRisks, setAllRisks] = useState<RaidItemDto[]>([]);
  const [companyData, setCompanyData] = useState<CompanyPortfolioSummary[]>([]);
  const [timeline, setTimeline] = useState<ProjectTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPortfolioSummary().catch(() => null),
      listProjects(),
      getPortfolioByCompany().catch(() => []),
      getPortfolioTimeline().catch(() => []),
    ]).then(async ([portfolioData, projectList, companyList, timelineData]) => {
      setPortfolio(portfolioData);
      setProjects(projectList);
      setCompanyData(companyList);
      setTimeline(timelineData);

      const ids = projectList.map((p) => p.id);
      const [evmResults, risks] = await Promise.all([
        Promise.all(ids.map((id) => getEvmMetrics(id).catch(() => null))).then((results) => {
          const map: Record<number, EvmMetrics> = {};
          results.forEach((e, i) => { if (e) map[ids[i]] = e; });
          return map;
        }),
        listPortfolioRaidItems('RISK').then((items) =>
          items.filter((r) => r.status === 'OPEN' || r.status === 'MITIGATING'),
        ),
      ]);

      setEvmMap(evmResults);
      setAllRisks(risks);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  const kpiCards = portfolio ? [
    { label: 'Total Projects', value: portfolio.totalProjects, color: 'bg-primary-50 text-primary-700' },
    { label: 'Total Budget', value: formatCurrency(portfolio.totalBudget), color: 'bg-blue-50 text-blue-700' },
    { label: 'Portfolio CPI', value: portfolio.portfolioCv !== 0 ? (portfolio.totalActualCost > 0 ? (portfolio.totalEarnedValue / portfolio.totalActualCost).toFixed(2) : '—') : '—', color: portfolio.portfolioCv >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700' },
    { label: 'Portfolio SPI', value: portfolio.totalPlannedValue > 0 ? (portfolio.totalEarnedValue / portfolio.totalPlannedValue).toFixed(2) : '—', color: portfolio.portfolioSv >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700' },
    { label: 'Open Risks', value: portfolio.totalOpenRisks + portfolio.totalMitigatingRisks, color: 'bg-amber-50 text-amber-700' },
    { label: 'Completion', value: portfolio.totalIssues > 0 ? ((portfolio.totalCompleted / portfolio.totalIssues) * 100).toFixed(0) + '%' : '—', color: 'bg-emerald-50 text-emerald-700' },
  ] : [
    { label: 'Total Projects', value: projects.length, color: 'bg-primary-50 text-primary-700' },
  ];

  const stageLabels: Record<string, string> = {
    INITIATION: 'Initiation',
    PLANNING: 'Planning',
    EXECUTION: 'Execution',
    CLOSING: 'Closing',
  };

  const stageColors: Record<string, string> = {
    INITIATION: 'bg-blue-500',
    PLANNING: 'bg-purple-500',
    EXECUTION: 'bg-amber-500',
    CLOSING: 'bg-green-500',
  };

  const budgetItems = projects
    .filter((p) => p.budget)
    .map((p) => ({
      label: p.key,
      title: p.name,
      value: Number(p.budget),
      color: 'bg-blue-500',
    }));

  const spentItems = projects
    .filter((p) => p.budget)
    .map((p) => {
      const evm = evmMap[p.id];
      const spent = Number(p.budgetSpent || 0) + (evm?.actualCost || 0);
      const over = spent > Number(p.budget);
      return {
        label: p.key,
        title: p.name,
        value: spent,
        color: over ? 'bg-red-500' : 'bg-green-500',
      };
    });

  const maxBudget = Math.max(...budgetItems.map((i) => i.value), 1);

  const alerts = computeAlerts(projects, evmMap, allRisks);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {user ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user.firstName}` : 'Welcome'}
        </h2>
        <p className="text-gray-500 mt-1">Portfolio overview and strategic insights.</p>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Stage Distribution */}
      {portfolio?.stageDistribution && Object.keys(portfolio.stageDistribution).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Distribution</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(portfolio.stageDistribution).map(([stage, count]) => (
              <div key={stage} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${stageColors[stage] || 'bg-gray-400'}`} />
                <span className="text-sm text-gray-700">{stageLabels[stage] || stage}: <strong>{count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attention Needed */}
      {alerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Attention Needed</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map((a, i) => (
              <Link
                key={i}
                to={`/projects/${a.projectId}`}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${alertSeverityStyles[a.severity]} hover:opacity-80 transition-opacity`}
              >
                <span className="text-lg mt-0.5">{alertIcons[a.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-600">{a.projectKey}</span>
                    <span className="text-sm font-medium text-gray-900 truncate">{a.projectName}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{a.message}</p>
                  <span className={`text-xs font-semibold mt-1 inline-block ${a.severity === 'red' ? 'text-red-700' : 'text-amber-700'}`}>
                    {a.value}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Company Performance */}
      {companyData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {companyData.map((c) => {
              const completionPct = c.totalIssues > 0 ? ((c.totalCompleted / c.totalIssues) * 100).toFixed(0) : '0';
              return (
                <div key={c.companyId ?? 'unassigned'} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 truncate">{c.companyName}</h4>
                  <p className="text-xs text-gray-500 mb-3">{c.totalProjects} project{c.totalProjects !== 1 ? 's' : ''}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Budget</span>
                      <span className="font-medium text-gray-900">{formatCurrency(c.totalBudget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Spent</span>
                      <span className="font-medium text-gray-900">{formatCurrency(c.totalBudgetSpent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completion</span>
                      <span className="font-medium text-gray-900">{completionPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Risks</span>
                      <span className={`font-medium ${c.totalOpenRisks + c.totalMitigatingRisks > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {c.totalOpenRisks + c.totalMitigatingRisks}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {Object.entries(c.stageDistribution).map(([stage, count]) => (
                        <span key={stage} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${stageColors[stage] || 'bg-gray-400'} text-white`}>
                          {(stageLabels[stage] || stage).slice(0, 3)}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Budget Overview */}
      {budgetItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Spent</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Budget</h4>
              <BarChart items={budgetItems} maxValue={maxBudget} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Spent</h4>
              <BarChart items={spentItems} maxValue={maxBudget} />
            </div>
          </div>
        </div>
      )}

      {/* Strategic Investment */}
      {projects.some((p) => p.strategicScore != null) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Investment</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-500">Company</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">Strategic Score</th>
                  <th className="text-right px-3 py-3 font-medium text-gray-500">Budget</th>
                  <th className="text-right px-3 py-3 font-medium text-gray-500">Spent</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">Completion</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">CPI</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">SPI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...projects]
                  .filter((p) => p.strategicScore != null)
                  .sort((a, b) => (b.strategicScore ?? 0) - (a.strategicScore ?? 0))
                  .map((project) => {
                    const evm = evmMap[project.id];
                    const budget = Number(project.budget || 0);
                    const spent = Number(project.budgetSpent || 0) + (evm?.actualCost || 0);
                    const completionPct = evm ? (evm.completionPct * 100).toFixed(0) + '%' : '—';
                    return (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link to={`/projects/${project.id}`} className="text-primary-600 hover:text-primary-800 font-medium">
                            {project.key}
                          </Link>
                          <span className="ml-2 text-gray-700">{project.name}</span>
                        </td>
                        <td className="px-3 py-3 text-gray-600">{project.companyName || '—'}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            (project.strategicScore ?? 0) >= 7 ? 'bg-green-100 text-green-800' :
                            (project.strategicScore ?? 0) >= 4 ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.strategicScore}/10
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(budget)}</td>
                        <td className="px-3 py-3 text-right">
                          <span className={spent > budget && budget > 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                            {formatCurrency(spent)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-gray-700">{completionPct}</td>
                        <td className="px-3 py-3 text-center">
                          {evm ? (
                            <span className={evm.cpi >= 1 ? 'text-green-600' : evm.cpi >= 0.9 ? 'text-yellow-600' : 'text-red-600'}>
                              {evm.cpi.toFixed(2)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {evm ? (
                            <span className={evm.spi >= 1 ? 'text-green-600' : evm.spi >= 0.9 ? 'text-yellow-600' : 'text-red-600'}>
                              {evm.spi.toFixed(2)}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {/* Budget allocation by strategic tier */}
          {(() => {
            const tiers = projects.reduce((acc, p) => {
              const score = p.strategicScore ?? 5;
              const tier = score >= 7 ? 'High (7-10)' : score >= 4 ? 'Medium (4-6)' : 'Low (1-3)';
              if (!acc[tier]) acc[tier] = { budget: 0, spent: 0, count: 0 };
              acc[tier].budget += Number(p.budget || 0);
              acc[tier].spent += Number(p.budgetSpent || 0) + (evmMap[p.id]?.actualCost || 0);
              acc[tier].count += 1;
              return acc;
            }, {} as Record<string, { budget: number; spent: number; count: number }>);
            const tierOrder = ['High (7-10)', 'Medium (4-6)', 'Low (1-3)'];
            const maxTierBudget = Math.max(...Object.values(tiers).map((t) => t.budget), 1);
            return (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Budget by Strategic Priority</h4>
                <div className="space-y-3">
                  {tierOrder.map((tier) => {
                    const t = tiers[tier];
                    if (!t) return null;
                    const pct = maxTierBudget > 0 ? (t.budget / maxTierBudget) * 100 : 0;
                    const spentPct = t.budget > 0 ? (t.spent / t.budget) * 100 : 0;
                    return (
                      <div key={tier}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{tier} <span className="text-gray-400">({t.count})</span></span>
                          <span className="text-gray-500">{formatCurrency(t.budget)} budget / {formatCurrency(t.spent)} spent</span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-primary-500 rounded-full h-3" style={{ width: `${Math.min(pct, 100)}%` }} />
                          {t.budget > 0 && (
                            <div
                              className={`absolute top-0 h-3 rounded-full ${spentPct > 100 ? 'bg-red-400' : 'bg-green-400'}`}
                              style={{ width: `${Math.min(spentPct / (maxTierBudget / t.budget * 100 / pct), 100)}%`, left: 0 }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Project Health Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const evm = evmMap[project.id];
            const projectRisks = allRisks.filter((r) => r.projectId === project.id);
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {project.key}
                    </span>
                    <h4 className="font-semibold text-gray-900 truncate">{project.name}</h4>
                  </div>
                  {project.stage && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge(project.stage)}`}>
                      {stageLabel(project.stage)}
                    </span>
                  )}
                </div>
                {evm && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20">Completion</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 rounded-full h-2"
                          style={{ width: `${Math.round(evm.completionPct * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{(evm.completionPct * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span>CPI: <span className={evm.cpi >= 1 ? 'text-green-600' : evm.cpi >= 0.9 ? 'text-yellow-600' : 'text-red-600'}>{evm.cpi.toFixed(2)}</span></span>
                      <span>SPI: <span className={evm.spi >= 1 ? 'text-green-600' : evm.spi >= 0.9 ? 'text-yellow-600' : 'text-red-600'}>{evm.spi.toFixed(2)}</span></span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <span>Budget: {formatCurrency(Number(project.budget || 0))}</span>
                  <span>Risks: {projectRisks.length > 0 ? (
                    <span className={riskColor(Math.max(...projectRisks.map((r) => r.riskScore)))}>
                      {projectRisks.length} (max: {Math.max(...projectRisks.map((r) => r.riskScore))})
                    </span>
                  ) : '0'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Portfolio Timeline */}
      {timeline.length > 0 && (() => {
        const projectsWithDates = timeline.filter((t) => t.targetStartDate && t.targetEndDate);
        if (projectsWithDates.length === 0) return null;
        const allDates = projectsWithDates.flatMap((t) => [new Date(t.targetStartDate!).getTime(), new Date(t.targetEndDate!).getTime()]);
        const minDate = Math.min(...allDates);
        const maxDate = Math.max(...allDates);
        const totalRange = maxDate - minDate || 1;
        const today = new Date().getTime();
        const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Timeline</h3>
            <div className="space-y-3">
              {projectsWithDates.map((t) => {
                const start = new Date(t.targetStartDate!).getTime();
                const end = new Date(t.targetEndDate!).getTime();
                const leftPct = ((start - minDate) / totalRange) * 100;
                const widthPct = ((end - start) / totalRange) * 100;
                const completionPct = Math.round(t.completionPct * 100);
                const isPast = today > end;
                return (
                  <div key={t.projectId} className="flex items-center gap-3">
                    <div className="w-32 flex-shrink-0">
                      <Link to={`/projects/${t.projectId}`} className="text-sm font-medium text-primary-600 hover:text-primary-800 truncate block">
                        {t.projectKey}
                      </Link>
                      <p className="text-xs text-gray-500 truncate">{t.projectName}</p>
                    </div>
                    <div className="flex-1 relative h-6 bg-gray-100 rounded">
                      <div
                        className="absolute top-0 h-full rounded"
                        style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 1)}%` }}
                      >
                        <div
                          className={`h-full rounded ${isPast ? 'bg-gray-400' : t.stage === 'CLOSING' ? 'bg-green-400' : t.stage === 'EXECUTION' ? 'bg-amber-400' : 'bg-blue-400'}`}
                          style={{ width: `${completionPct}%` }}
                        />
                        <div className={`h-full rounded ${isPast ? 'bg-gray-300' : t.stage === 'CLOSING' ? 'bg-green-200' : t.stage === 'EXECUTION' ? 'bg-amber-200' : 'bg-blue-200'}`} style={{ width: '100%', position: 'absolute', top: 0, left: 0, zIndex: -1 }} />
                      </div>
                      {today >= minDate && today <= maxDate && (
                        <div className="absolute top-0 h-full w-px bg-red-500 z-10" style={{ left: `${((today - minDate) / totalRange) * 100}%` }} />
                      )}
                    </div>
                    <div className="w-20 flex-shrink-0 text-right">
                      <span className="text-xs text-gray-500">{fmt(t.targetStartDate!)}</span>
                      <span className="text-xs text-gray-400 mx-1">-</span>
                      <span className="text-xs text-gray-500">{fmt(t.targetEndDate!)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Top Risks */}
      {allRisks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Risks</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">P × I</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allRisks.slice(0, 10).map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{r.projectName}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${riskColor(r.riskScore)}`}>
                        {r.riskScore} — {riskLabel(r.riskScore)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.probability} × {r.impact}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'MITIGATING' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}