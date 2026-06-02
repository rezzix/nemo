import { apiGet, apiGetPaginated, apiPost, apiPut, apiDelete } from './client';
import type { PaginatedResponse, BankAccountDto, CreateBankAccountRequest, UpdateBankAccountRequest } from '@/types';

export async function listBankAccounts(params?: Record<string, string | number>): Promise<PaginatedResponse<BankAccountDto>> {
  return apiGetPaginated<BankAccountDto>('/bank-accounts', params);
}

export async function getBankAccount(id: number): Promise<BankAccountDto> {
  return apiGet<BankAccountDto>(`/bank-accounts/${id}`);
}

export async function createBankAccount(request: CreateBankAccountRequest): Promise<BankAccountDto> {
  return apiPost<BankAccountDto>('/bank-accounts', request);
}

export async function updateBankAccount(id: number, request: UpdateBankAccountRequest): Promise<BankAccountDto> {
  return apiPut<BankAccountDto>(`/bank-accounts/${id}`, request);
}

export async function deactivateBankAccount(id: number): Promise<void> {
  await apiDelete(`/bank-accounts/${id}`);
}