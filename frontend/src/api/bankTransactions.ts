import { apiGet, apiGetPaginated, apiPost, apiPut, apiDelete } from './client';
import type { PaginatedResponse, BankTransactionDto, CreateBankTransactionRequest, UpdateBankTransactionRequest } from '@/types';

export async function listTransactions(bankAccountId: number, params?: Record<string, string | number>): Promise<PaginatedResponse<BankTransactionDto>> {
  return apiGetPaginated<BankTransactionDto>(`/bank-accounts/${bankAccountId}/transactions`, params);
}

export async function getTransaction(bankAccountId: number, id: number): Promise<BankTransactionDto> {
  return apiGet<BankTransactionDto>(`/bank-accounts/${bankAccountId}/transactions/${id}`);
}

export async function createTransaction(bankAccountId: number, request: CreateBankTransactionRequest): Promise<BankTransactionDto> {
  return apiPost<BankTransactionDto>(`/bank-accounts/${bankAccountId}/transactions`, request);
}

export async function updateTransaction(bankAccountId: number, id: number, request: UpdateBankTransactionRequest): Promise<BankTransactionDto> {
  return apiPut<BankTransactionDto>(`/bank-accounts/${bankAccountId}/transactions/${id}`, request);
}

export async function deleteTransaction(bankAccountId: number, id: number): Promise<void> {
  await apiDelete(`/bank-accounts/${bankAccountId}/transactions/${id}`);
}