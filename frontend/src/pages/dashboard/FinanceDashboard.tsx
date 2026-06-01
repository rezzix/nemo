import { useState, useEffect, useCallback } from 'react';
import { getFinanceDashboard, getFinanceChartData } from '@/api/finance';
import type { DashboardResponse, ProjectFinance, MonthlyFinanceData } from '@/api/finance';
import { formatCurrency } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FinanceDashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [chartData, setChartData] = useState<MonthlyFinanceData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<keyof ProjectFinance>('projectName');
  const [sortAsc, setSortAsc] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, chart] = await Promise.all([
        getFinanceDashboard(),
        getFinanceChartData(year),
      ]);
      setDashboard(dash);
      setChartData(chart);
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = (key: keyof ProjectFinance) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!dashboard) return <div className="p-6 text-gray-500">Unable to load dashboard data.</div>;

  const { summary, byProject } = dashboard;
  const sorted = [...byProject].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortAsc ? cmp : -cmp;
  });

  const sortIcon = (key: keyof ProjectFinance) => sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : '';

  const maxVal = chartData ? Math.max(
    ...chartData.paymentsReceived, ...chartData.paymentsPending, ...chartData.expenses, 1
  ) : 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
        <div className="flex items-center gap-1 text-sm">
          <button onClick={() => setYear(year - 1)}
            className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 font-medium">&larr;</button>
          <span className="px-3 py-1 bg-gray-100 rounded font-medium text-gray-800">{year}</span>
          <button onClick={() => setYear(year + 1)}
            className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 font-medium">&rarr;</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Budget', value: formatCurrency(summary.totalBudget), color: 'bg-blue-50 text-blue-700' },
          { label: 'Total Expenses', value: formatCurrency(summary.totalExpenses), color: 'bg-red-50 text-red-700' },
          { label: 'Payments Received', value: formatCurrency(summary.totalPaymentsReceived), color: 'bg-green-50 text-green-700' },
          { label: 'Payments Pending', value: formatCurrency(summary.totalPaymentsPending), color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Collection Rate', value: `${summary.collectionRate}%`, color: 'bg-purple-50 text-purple-700' },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-xl border border-gray-200 p-4 ${kpi.color}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-75">{kpi.label}</p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts — side by side on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Payments Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payments Received vs Pending by Month</h2>
          <div className="flex items-end gap-1 h-48">
            {MONTHS.map((m, i) => {
              const received = Number(chartData?.paymentsReceived[i]) || 0;
              const pending = Number(chartData?.paymentsPending[i]) || 0;
              const rH = Math.round((received / maxVal) * 100);
              const pH = Math.round((pending / maxVal) * 100);
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col items-center justify-end h-44">
                    <div title={`Received: ${formatCurrency(received)}`}
                      className="w-full bg-green-500 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(rH, 1)}%` }} />
                    <div title={`Pending: ${formatCurrency(pending)}`}
                      className="w-full bg-yellow-400 transition-all duration-300"
                      style={{ height: `${Math.max(pH, 1)}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">{m}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Received</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400" /> Pending</span>
          </div>
        </div>

        {/* Expenses Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Month</h2>
          <div className="flex items-end gap-1 h-48">
            {MONTHS.map((m, i) => {
              const exp = Number(chartData?.expenses[i]) || 0;
              const h = Math.round((exp / maxVal) * 100);
              return (
                <div key={m} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-44">
                    <div title={`Expenses: ${formatCurrency(exp)}`}
                      className="w-full bg-red-400 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(h, 1)}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">{m}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Expenses</span>
          </div>
        </div>
      </div>

      {/* Project Financial Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Project Financials</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {([
                  ['projectName', 'Project'],
                  ['budget', 'Budget'],
                  ['expenses', 'Expenses'],
                  ['laborCost', 'Labor'],
                  ['paymentsReceived', 'Received'],
                  ['collectionProgress', 'Collection %'],
                  ['cpi', 'CPI'],
                  ['spi', 'SPI'],
                  ['pendingExpenses', 'Pending'],
                ] as [keyof ProjectFinance, string][]).map(([key, label]) => (
                  <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort(key)}>
                    {label}{sortIcon(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((p) => (
                <tr key={p.projectId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.projectName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(p.budget)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(p.expenses)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(p.laborCost)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(p.paymentsReceived)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.collectionProgress}%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.cpi !== null ? p.cpi : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.spi !== null ? p.spi : '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {p.pendingExpenses > 0
                      ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{p.pendingExpenses}</span>
                      : <span className="text-gray-400">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}