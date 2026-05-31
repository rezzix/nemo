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

export interface PaymentDto {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  amount: number;
  currency: string | null;
  dueDate: string | null;
  receivedDate: string | null;
  status: string;
  invoiceRef: string | null;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  delayDays: number | null;
}

export interface YearPaymentsResponse {
  year: number;
  pending: PaymentDto[];
  received: PaymentDto[];
  overdue: PaymentDto[];
}

export function getFinanceDashboard(): Promise<DashboardResponse> {
  return apiGet('/finance/dashboard');
}

export function getFinancePayments(year?: number): Promise<YearPaymentsResponse> {
  const params = year ? `?year=${year}` : '';
  return apiGet('/finance/payments' + params);
}