import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { HolidayDto, CreateHolidayRequest, UpdateHolidayRequest } from '@/types';

export async function listHolidays(params?: { year?: number; startDate?: string; endDate?: string }): Promise<HolidayDto[]> {
  return apiGet<HolidayDto[]>('/holidays', params as Record<string, string | number>);
}

export async function createHoliday(request: CreateHolidayRequest): Promise<HolidayDto> {
  return apiPost<HolidayDto>('/holidays', request);
}

export async function updateHoliday(id: number, request: UpdateHolidayRequest): Promise<HolidayDto> {
  return apiPut<HolidayDto>(`/holidays/${id}`, request);
}

export async function deleteHoliday(id: number): Promise<void> {
  await apiDelete(`/holidays/${id}`);
}