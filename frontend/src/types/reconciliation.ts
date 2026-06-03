export interface UnreconciledTransactionDto {
  id: number;
  bankAccountId: number | null;
  bankAccountName: string | null;
  date: string;
  description: string;
  amount: number;
  currency: string;
  reference: string | null;
  status: string;
  projectPaymentId: number | null;
  projectPaymentTitle: string | null;
  externalNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnmatchedPaymentDto {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  receivedDate: string | null;
  status: string;
  invoiceRef: string | null;
  reconciled: boolean;
}

export interface ReconcileRequest {
  paymentId?: number | null;
  externalNote?: string | null;
}

export interface UnreconciledCountDto {
  count: number;
}

export interface ReconciliationViewDto {
  transactions: UnreconciledTransactionDto[];
  unmatchedPayments: UnmatchedPaymentDto[];
  unreconciledCount: number;
}