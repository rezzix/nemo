export interface BankTransactionDto {
  id: number;
  bankAccountId: number;
  bankStatementId: number | null;
  date: string;
  description: string;
  amount: number;
  currency: string;
  reference: string | null;
  status: 'NEW' | 'RECONCILED' | 'IGNORED';
  projectPaymentId?: number | null;
  projectPaymentTitle?: string | null;
  externalNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankTransactionRequest {
  date: string;
  description: string;
  amount: number;
  currency?: string;
  reference?: string;
}

export interface UpdateBankTransactionRequest {
  description?: string;
  reference?: string;
  status?: string;
}