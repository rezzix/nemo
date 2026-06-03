export interface BankAccountDto {
  id: number;
  companyId: number;
  companyName: string | null;
  name: string;
  iban: string;
  currency: string;
  currentBalance: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankAccountRequest {
  companyId?: number | null;
  name: string;
  iban: string;
  currency: string;
  openingBalance: number;
}

export interface UpdateBankAccountRequest {
  name?: string;
  iban?: string;
  currency?: string;
}