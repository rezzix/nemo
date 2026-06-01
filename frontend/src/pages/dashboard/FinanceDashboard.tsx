import { useState, useEffect } from 'react';
import { getFinanceChartData } from '@/api/finance';
import type { MonthlyFinanceData } from '@/api/finance';
import { formatCurrency } from '@/utils/format';
import Spinner from '@/components/common/Spinner';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FinanceDashboard() {
  const [data, setData] = useState<MonthlyFinanceData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFinanceChartData(year)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year]);

  const maxVal = data ? Math.max(
    ...data.paymentsReceived, ...data.paymentsPending, ...data.expenses, 1
  ) : 1;

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!data) return <div className="p-6 text-gray-500">Unable to load chart data.</div>;

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

      {/* Payments Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payments Received vs Pending by Month</h2>
        <div className="flex items-end gap-1 h-48">
          {MONTHS.map((m, i) => {
            const received = Number(data.paymentsReceived[i]) || 0;
            const pending = Number(data.paymentsPending[i]) || 0;
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
            const exp = Number(data.expenses[i]) || 0;
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
  );
}