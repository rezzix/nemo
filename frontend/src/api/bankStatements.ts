import { apiGetPaginated } from './client';
import { client } from './client';
import type { ApiResponse, PaginatedResponse, BankStatementDto, ImportResult } from '@/types';

export async function importStatement(bankAccountId: number, file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await client.post<ApiResponse<ImportResult>>(
    `/bank-accounts/${bankAccountId}/statements/import`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data.data;
}

export async function listStatements(bankAccountId: number, params?: Record<string, string | number>): Promise<PaginatedResponse<BankStatementDto>> {
  return apiGetPaginated<BankStatementDto>(`/bank-accounts/${bankAccountId}/statements`, params);
}