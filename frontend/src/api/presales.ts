import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from './client';
import type { PreSaleDto, CreatePreSaleRequest, UpdatePreSaleRequest, ConvertPreSaleRequest, CostSummaryDto } from '@/types';

export async function listPreSales(params?: Record<string, string | number>) {
  return apiGetPaginated<PreSaleDto>('/presales', params);
}

export async function getPreSale(id: number): Promise<PreSaleDto> {
  return apiGet<PreSaleDto>(`/presales/${id}`);
}

export async function createPreSale(request: CreatePreSaleRequest): Promise<PreSaleDto> {
  return apiPost<PreSaleDto>('/presales', request);
}

export async function updatePreSale(id: number, request: UpdatePreSaleRequest): Promise<PreSaleDto> {
  return apiPut<PreSaleDto>(`/presales/${id}`, request);
}

export async function deletePreSale(id: number): Promise<void> {
  await apiDelete(`/presales/${id}`);
}

export async function convertToProject(id: number, request: ConvertPreSaleRequest): Promise<PreSaleDto> {
  return apiPost<PreSaleDto>(`/presales/${id}/convert`, request);
}

export async function getCostSummary(id: number): Promise<CostSummaryDto> {
  return apiGet<CostSummaryDto>(`/presales/${id}/cost-summary`);
}