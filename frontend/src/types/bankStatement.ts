export interface BankStatementDto {
  id: number;
  bankAccountId: number;
  fileName: string;
  periodStart: string | null;
  periodEnd: string | null;
  totalDebits: number | null;
  totalCredits: number | null;
  openingBalance: number | null;
  closingBalance: number | null;
  computedDebits: number | null;
  computedCredits: number | null;
  matched: boolean;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImportResult {
  statementId: number;
  importedCount: number;
  matched: boolean;
  warning: string | null;
}