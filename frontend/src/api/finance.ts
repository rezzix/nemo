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

export interface ExpenseDto {
  id: number;
  projectId: number;
  projectName: string;
  category: string;
  amount: string;
  description: string | null;
  expenseDate: string | null;
  createdById: number | null;
  createdByName: string | null;
  approvalStatus: string | null;
  rejectionReason: string | null;
  createdAt: string | null;
}

export interface YearExpensesResponse {
  year: number;
  statusFilter: string;
  expenses: ExpenseDto[];
}

export interface MonthlyFinanceData {
  year: number;
  paymentsReceived: number[];
  paymentsPending: number[];
  expenses: number[];
}

export function getFinanceDashboard(): Promise<DashboardResponse> {
  return apiGet('/finance/dashboard');
}

export function getFinancePayments(year?: number): Promise<YearPaymentsResponse> {
  const params = year ? `?year=${year}` : '';
  return apiGet('/finance/payments' + params);
}

export function getFinanceExpenses(year?: number, status?: string): Promise<YearExpensesResponse> {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (status) params.set('status', status);
  return apiGet('/finance/expenses-by-year?' + params.toString());
}

export function getFinanceChartData(year?: number): Promise<MonthlyFinanceData> {
  const params = year ? `?year=${year}` : '';
  return apiGet('/finance/chart-data' + params);
}

// --- Bank Dashboard ---

export interface BankKpiDto {
  totalCash: number;
  unreconciledCount: number;
  pendingPaymentsTotal: number;
  lastImportDate: string | null;
}

export interface BankAccountWidgetDto {
  id: number;
  name: string;
  currency: string;
  balance: number;
  lastImportDate: string | null;
}

export interface RecentTransactionDto {
  id: number;
  bankAccountId: number;
  bankAccountName: string;
  date: string | null;
  description: string;
  amount: number;
  currency: string;
  status: string;
  matchedTo: string | null;
}

export interface BankDashboardResponse {
  kpis: BankKpiDto;
  bankAccounts: BankAccountWidgetDto[];
  recentTransactions: RecentTransactionDto[];
}

export function getBankDashboard(): Promise<BankDashboardResponse> {
  return apiGet('/finance/dashboard/bank');
}