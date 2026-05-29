import { apiGet } from './client';

export interface DashboardSummary {
  totalBudget: number;
  totalExpenses: number;
  totalPaymentsReceived: number;
  totalPaymentsPending: number;
  collectionRate: number;
  pendingExpenseApprovals: number;
}

export interface ProjectFinance {
  projectId: number;
  projectName: string;
  budget: number;
  laborCost: number;
  expenses: number;
  paymentsReceived: number;
  collectionProgress: number;
  cpi: number | null;
  spi: number | null;
  pendingExpenses: number;
}

export interface OverduePayment {
  paymentId: number;
  projectId: number;
  projectName: string;
  title: string;
  amount: number;
  dueDate: string | null;
  daysOverdue: number;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  byProject: ProjectFinance[];
  overduePayments: OverduePayment[];
}

export function getFinanceDashboard(): Promise<DashboardResponse> {
  return apiGet('/finance/dashboard');
}