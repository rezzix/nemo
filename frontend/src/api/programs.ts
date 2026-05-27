import { apiGet, apiGetPaginated } from './client';
import type { ProgramDto, ProgramEvmMetrics } from '@/types';

export function listPrograms(params?: Record<string, string | number>) {
  return apiGetPaginated<ProgramDto>('/programs', params);
}

export function getProgram(id: number) {
  return apiGet<ProgramDto>(`/programs/${id}`);
}

export function getProgramEvm(id: number) {
  return apiGet<ProgramEvmMetrics>(`/programs/${id}/evm`);
}