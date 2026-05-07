import { apiGetPaginated } from './client';
import type { ActivityLogDto, PaginatedResponse } from '@/types';

export async function listActivityLogs(params?: {
  username?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<ActivityLogDto>> {
  return apiGetPaginated<ActivityLogDto>('/activity-logs', params);
}