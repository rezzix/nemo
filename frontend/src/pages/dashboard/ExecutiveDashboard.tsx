import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getPortfolioSummary, getEvmMetrics, listPortfolioRaidItems, getPortfolioByCompany, getPortfolioTimeline } from '@/api/pmo';
import { listProjects } from '@/api/projects';
import { listCompanies } from '@/api/companies';
import { formatCurrency, stageBadge, stageLabel, riskColor, riskLabel } from '@/utils/format';
import type { PortfolioSummary, EvmMetrics, RaidItemDto, ProjectDto, CompanyPortfolioSummary, ProjectTimelineEntry, CompanyDto } from '@/types';
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
      if (evm.cpi != null && evm.cpi < 0.9) {
        alerts.push({
          projectId: project.id, projectKey: project.key, projectName: project.name,
          type: 'cpi', message: 'Cost performance below threshold',
          value: `CPI ${evm.cpi.toFixed(2)}`, severity: evm.cpi < 0.8 ? 'red' : 'yellow',
        });
      }
      if (evm.spi != null && evm.spi < 0.9) {
        alerts.push({
          projectId: project.id, projectKey: project.key, projectName: project.name,
          type: 'spi', message: 'Schedule performance below threshold',
          value: `SPI ${evm.spi.toFixed(2)}`, severity: evm.spi < 0.8 ? 'red' : 'yellow',
        });
      }
      if (project.budget && Number(project.budget) > 0) {
        const spentRatio = evm.actualCost / Number(project.budget);
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
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null); // null = Group (all)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getPortfolioSummary().catch(() => null),
      listProjects(),
      getPortfolioByCompany().catch(() => []),
      getPortfolioTimeline().catch(() => []),
      listCompanies().then((res) => res.data).catch(() => []),
    ]).then(async ([portfolioData, projectList, companyList, timelineData, companyDtos]) => {
      setPortfolio(portfolioData);
      setProjects(projectList);
      setCompanyData(companyList);
      setTimeline(timelineData);
      setCompanies(Array.isArray(companyDtos) ? companyDtos : []);

      const ids = projectList.map((p) => p.id);
      const [evmResults, risks] = await Promise.all([
        Promise.all(ids.map((id) => getEvmMetrics(id).catch(() => null))).then((results) => {
          const map: Record<number, EvmMetrics> = {};
          results.forEach((e, i) => { if (e) map[ids[i]] = e; });
          return map;
        }),
        listPortfolioRaidItems('RISK').then((items) =>
          items.filter((r) => r.status === 'OPEN' || r.status === 'MITIGATING'),
        ).catch(() => []),
      ]);

      setEvmMap(evmResults);
      setAllRisks(risks);
      setLoading(false);
    }).catch((err) => {
      console.error('ExecutiveDashboard data loading error:', err);
      setError(err?.message || 'Failed to load dashboard data');
      setLoading(false);
    });
  }, []);

  // Filter data by selected company — hooks must be called before any early returns
  const filteredProjects = useMemo(() => {
    if (selectedCompanyId === null) return projects;
    return projects.filter((p) => p.companyId === selectedCompanyId);
  }, [projects, selectedCompanyId]);

  const filteredRisks = useMemo(() => {
    if (selectedCompanyId === null) return allRisks;
    const projectIds = new Set(filteredProjects.map((p) => p.id));
    return allRisks.filter((r) => projectIds.has(r.projectId));
  }, [allRisks, filteredProjects, selectedCompanyId]);

  const filteredEvmMap = useMemo(() => {
    if (selectedCompanyId === null) return evmMap;
    const map: Record<number, EvmMetrics> = {};
    for (const p of filteredProjects) {
      if (evmMap[p.id]) map[p.id] = evmMap[p.id];
    }
    return map;
  }, [evmMap, filteredProjects, selectedCompanyId]);

  const selectedCompanySummary = useMemo(() => {
    if (selectedCompanyId === null) return null;
    return companyData.find((c) => c.companyId === selectedCompanyId) ?? null;
  }, [companyData, selectedCompanyId]);

  // Build ordered company cards: Global projects (companyId=null) then companies by order
  const companyCards = useMemo(() => {
    const sorted = [...companies].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    // Include companies that have projects
    const projectCompanyIds = new Set(projects.map((p) => p.companyId).filter(Boolean));
    const cards: { id: number | null; name: string; projectCount: number; logo: string | null }[] = [];
    // Global (projects with no company)
    const globalCount = projects.filter((p) => p.companyId === null).length;
    if (globalCount > 0) cards.push({ id: null, name: 'Global', projectCount: globalCount, logo: null });
    // Companies
    for (const c of sorted) {
      if (projectCompanyIds.has(c.id)) {
        const count = projects.filter((p) => p.companyId === c.id).length;
        cards.push({ id: c.id, name: c.name, projectCount: count, logo: c.logo ?? null });
      }
    }
    return cards;
  }, [companies, projects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium">Something went wrong</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Retry</button>
        </div>
      </div>
    );
  }

  const kpiCards = (() => {
    // If a specific company is selected, use CompanyPortfolioSummary
    if (selectedCompanySummary) {
      const cs = selectedCompanySummary;
      const totalEarnedValue = Object.values(filteredEvmMap).filter(e => e.actualCost > 0).reduce((s, e) => s + e.earnedValue, 0);
      const totalActualCost = Object.values(filteredEvmMap).filter(e => e.actualCost > 0).reduce((s, e) => s + e.actualCost, 0);
      const totalPlannedValue = Object.values(filteredEvmMap).reduce((s, e) => s + e.plannedValue, 0);
      const cv = totalEarnedValue - totalActualCost;
      const sv = totalEarnedValue - totalPlannedValue;
      return [
        { label: 'Total Projects', value: cs.totalProjects, color: 'bg-primary-50 text-primary-700' },
        { label: 'Total Budget', value: formatCurrency(cs.totalBudget), color: 'bg-blue-50 text-blue-700' },
        { label: 'Portfolio CPI', value: totalActualCost > 0 ? (totalEarnedValue / totalActualCost).toFixed(2) : '—', color: cv >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700' },
        { label: 'Portfolio SPI', value: totalPlannedValue > 0 ? (totalEarnedValue / totalPlannedValue).toFixed(2) : '—', color: sv >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700' },
        { label: 'Open Risks', value: cs.totalOpenRisks + cs.totalMitigatingRisks, color: 'bg-amber-50 text-amber-700' },
        { label: 'Completion', value: cs.totalTasks > 0 ? ((cs.totalCompleted / cs.totalTasks) * 100).toFixed(0) + '%' : '—', color: 'bg-emerald-50 text-emerald-700' },
      ];
    }
    // Group (all companies) — use full portfolio
    return portfolio ? [
    { label: 'Total Projects', value: portfolio.totalProjects, color: 'bg-primary-50 text-primary-700' },
    { label: 'Total Budget', value: formatCurrency(portfolio.totalBudget), color: 'bg-blue-50 text-blue-700' },
    { label: 'Portfolio CPI', value: portfolio.portfolioCv !== 0 ? (portfolio.totalActualCost > 0 ? (portfolio.totalEarnedValue / portfolio.totalActualCost).toFixed(2) : '—') : '—', color: portfolio.portfolioCv >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700' },
    { label: 'Portfolio SPI', value: portfolio.totalPlannedValue > 0 ? (portfolio.totalEarnedValue / portfolio.totalPlannedValue).toFixed(2) : '—', color: portfolio.portfolioSv >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700' },
    { label: 'Open Risks', value: portfolio.totalOpenRisks + portfolio.totalMitigatingRisks, color: 'bg-amber-50 text-amber-700' },
    { label: 'Completion', value: portfolio.totalTasks > 0 ? ((portfolio.totalCompleted / portfolio.totalTasks) * 100).toFixed(0) + '%' : '—', color: 'bg-emerald-50 text-emerald-700' },
  ] : [
    { label: 'Total Projects', value: projects.length, color: 'bg-primary-50 text-primary-700' },
  ];
  })();

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

  const budgetItems = filteredProjects
    .filter((p) => p.budget)
    .map((p) => ({
      label: p.key,
      title: p.name,
      value: Number(p.budget),
      color: 'bg-blue-500',
    }));

  const spentItems = filteredProjects
    .filter((p) => p.budget)
    .map((p) => {
      const evm = filteredEvmMap[p.id];
      const spent = evm?.actualCost || 0;
      const over = spent > Number(p.budget);
      return {
        label: p.key,
        title: p.name,
        value: spent,
        color: over ? 'bg-red-500' : 'bg-green-500',
      };
    });

  const maxBudget = Math.max(...budgetItems.map((i) => i.value), 1);

  const alerts = computeAlerts(filteredProjects, filteredEvmMap, filteredRisks);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {user ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user.firstName}` : 'Welcome'}
        </h2>
        <p className="text-gray-500 mt-1">Portfolio overview and strategic insights.</p>
      </div>

      {/* Company Selector */}
      {companyCards.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCompanyId(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all text-left ${
              selectedCompanyId === null
                ? 'border-primary-600 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">Group</span>
              <span className="text-xs text-gray-400">All</span>
            </div>
            <p className="text-sm font-bold text-gray-900">{projects.length} projects</p>
          </button>
          {companyCards.filter((c) => c.id !== null).map((card) => {
            const cs = companyData.find((c) => c.companyId === card.id);
            const isSelected = selectedCompanyId === card.id;
            return (
              <button
                key={card.id}
                onClick={() => setSelectedCompanyId(isSelected ? null : card.id!)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all text-left min-w-[140px] ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {card.logo ? (
                    <img src={card.logo} alt={card.name} className="h-6 w-6 rounded object-contain" />
                  ) : (
                    <span className="h-6 w-6 rounded bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                      {card.name.charAt(0)}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-gray-900 truncate">{card.name}</span>
                </div>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{card.projectCount} projects{cs ? ` · ${cs.totalOpenRisks + cs.totalMitigatingRisks} risks` : ''}</p>
              </button>
            );
          })}
        </div>
      )}

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
      {(() => {
        const stageDistribution = selectedCompanySummary?.stageDistribution ?? portfolio?.stageDistribution;
        return stageDistribution && Object.keys(stageDistribution).length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Distribution</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stageDistribution).map(([stage, count]) => (
              <div key={stage} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${stageColors[stage] || 'bg-gray-400'}`} />
                <span className="text-sm text-gray-700">{stageLabels[stage] || stage}: <strong>{count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      ) : null;
    })()}

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
      {selectedCompanyId === null && companyData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {companyData.map((c) => {
              const completionPct = c.totalTasks > 0 ? ((c.totalCompleted / c.totalTasks) * 100).toFixed(0) : '0';
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
      {filteredProjects.some((p) => p.strategicScore != null) && (
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
                {[...filteredProjects]
                  .filter((p) => p.strategicScore != null)
                  .sort((a, b) => (b.strategicScore ?? 0) - (a.strategicScore ?? 0))
                  .map((project) => {
                    const evm = filteredEvmMap[project.id];
                    const budget = Number(project.budget || 0);
                    const spent = evm?.actualCost || 0;
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
                          {evm && evm.cpi != null ? (
                            <span className={evm.cpi >= 1 ? 'text-green-600' : evm.cpi >= 0.9 ? 'text-yellow-600' : 'text-red-600'}>
                              {evm.cpi.toFixed(2)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {evm && evm.spi != null ? (
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
            const tiers = filteredProjects.reduce((acc, p) => {
              const score = p.strategicScore ?? 5;
              const tier = score >= 7 ? 'High (7-10)' : score >= 4 ? 'Medium (4-6)' : 'Low (1-3)';
              if (!acc[tier]) acc[tier] = { budget: 0, spent: 0, count: 0 };
              acc[tier].budget += Number(p.budget || 0);
              acc[tier].spent += filteredEvmMap[p.id]?.actualCost || 0;
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
          {filteredProjects.map((project) => {
            const evm = filteredEvmMap[project.id];
            const projectRisks = filteredRisks.filter((r) => r.projectId === project.id);
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
                      <span>CPI: <span className={evm.cpi != null ? (evm.cpi >= 1 ? 'text-green-600' : evm.cpi >= 0.9 ? 'text-yellow-600' : 'text-red-600') : ''}>{evm.cpi != null ? evm.cpi.toFixed(2) : '—'}</span></span>
                      <span>SPI: <span className={evm.spi != null ? (evm.spi >= 1 ? 'text-green-600' : evm.spi >= 0.9 ? 'text-yellow-600' : 'text-red-600') : ''}>{evm.spi != null ? evm.spi.toFixed(2) : '—'}</span></span>
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
        const filteredTimeline = selectedCompanyId === null
          ? timeline
          : timeline.filter((t) => filteredProjects.some((p) => p.id === t.projectId));
        const projectsWithDates = filteredTimeline.filter((t) => t.targetStartDate && t.targetEndDate);
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

      {/* Risk Matrix */}
      {filteredRisks.length > 0 && (() => {
        const matrixRisks = filteredRisks.filter((r) => r.probability != null && r.impact != null);
        const cellColor = (p: number, i: number): string => {
          const score = p * i;
          if (score >= 15) return 'bg-red-100 text-red-800';
          if (score >= 8) return 'bg-amber-100 text-amber-800';
          if (score >= 4) return 'bg-yellow-100 text-yellow-800';
          return 'bg-green-100 text-green-800';
        };
        const risksAt = (p: number, i: number) => matrixRisks.filter((r) => r.probability === p && r.impact === i);
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Matrix</h3>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-end gap-1">
                    <div className="flex flex-col items-center gap-1 pr-2">
                      <span className="text-xs font-medium text-gray-500 -rotate-90 origin-center whitespace-nowrap mb-2">Probability</span>
                      {[5, 4, 3, 2, 1].map((p) => (
                        <div key={p} className="h-12 flex items-center justify-center text-xs font-medium text-gray-500">{p}</div>
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-5 gap-1">
                        {([5, 4, 3, 2, 1] as const).flatMap((p) =>
                          ([1, 2, 3, 4, 5] as const).map((i) => {
                            const risksHere = risksAt(p, i);
                            return (
                              <div key={`${p}-${i}`} className={`h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium ${cellColor(p, i)} ${risksHere.length > 0 ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}>
                                {risksHere.length > 0 ? (
                                  <span className="font-bold" title={risksHere.map((r) => r.title).join(', ')}>{risksHere.length}</span>
                                ) : (
                                  <span className="text-gray-300">{p * i}</span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="flex justify-between mt-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="w-[20%] text-center text-xs font-medium text-gray-500">{i}</div>
                        ))}
                      </div>
                      <div className="text-center text-xs font-medium text-gray-500 mt-0.5">Impact</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Low (1-3)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 inline-block" /> Medium (4-6)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 inline-block" /> High (8-12)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Critical (15-25)</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Risk Details</h4>
                  <div className="space-y-2">
                    {filteredRisks.slice(0, 10).map((r) => (
                      <div key={r.id} className="flex items-start gap-2 text-sm">
                        <span className={`inline-block w-2 h-2 rounded-full mt-1.5 shrink-0 ${riskColor(r.riskScore).replace('text-', 'bg-').split(' ')[0]}`} />
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900">{r.title}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{r.projectName}</span>
                            {r.probability && r.impact && <span>P{r.probability}×I{r.impact}</span>}
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${riskColor(r.riskScore)}`}>
                              {r.riskScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}