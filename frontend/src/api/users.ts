import { apiGet, apiGetPaginated, apiPut } from './client';
import type { UserDto, UpdateProfileRequest, PasswordChangeRequest, AllocationSummaryDto } from '@/types';

export async function listAllUsers(params?: Record<string, string | number>): Promise<UserDto[]> {
  const res = await apiGetPaginated<UserDto>('/users', { size: 100, ...params });
  return res.data;
}

export async function getUser(id: number): Promise<UserDto> {
  return apiGet<UserDto>(`/users/${id}`);
}

export async function updateUser(id: number, request: UpdateProfileRequest): Promise<UserDto> {
  return apiPut<UserDto>(`/users/${id}`, request);
}

export async function changePassword(id: number, request: PasswordChangeRequest): Promise<void> {
  await apiPut(`/users/${id}/password`, request);
}

export async function updateUserCapacity(id: number, weeklyCapacity: number): Promise<UserDto> {
  return apiPut<UserDto>(`/users/${id}/capacity`, { weeklyCapacity });
}

export async function getUserAllocationSummary(id: number): Promise<AllocationSummaryDto> {
  return apiGet<AllocationSummaryDto>(`/users/${id}/allocation-summary`);
}