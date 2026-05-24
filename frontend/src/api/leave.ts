import { apiGet, apiPost, apiPut } from './client';
import type { LeaveRequestDto, CreateLeaveRequest, LeaveActionRequest, LeaveBalanceDto, LeaveEntitlementDto, CreateLeaveEntitlementRequest, UpdateLeaveEntitlementRequest, WorkingDaysResponse } from '@/types';

export async function listLeaveRequests(params?: Record<string, string | number>): Promise<LeaveRequestDto[]> {
  return apiGet('/leave-requests', params);
}

export async function listPendingLeaveRequests(): Promise<LeaveRequestDto[]> {
  return apiGet('/leave-requests/pending');
}

export async function getLeaveRequest(id: number): Promise<LeaveRequestDto> {
  return apiGet(`/leave-requests/${id}`);
}

export async function createLeaveRequest(request: CreateLeaveRequest): Promise<LeaveRequestDto> {
  return apiPost('/leave-requests', request);
}

export async function updateLeaveRequest(id: number, request: Partial<CreateLeaveRequest>): Promise<LeaveRequestDto> {
  return apiPut(`/leave-requests/${id}`, request);
}

export async function approveLeaveRequest(id: number, comment?: string): Promise<LeaveRequestDto> {
  const body: LeaveActionRequest = { comment };
  return apiPut(`/leave-requests/${id}/approve`, body);
}

export async function rejectLeaveRequest(id: number, comment?: string): Promise<LeaveRequestDto> {
  const body: LeaveActionRequest = { comment };
  return apiPut(`/leave-requests/${id}/reject`, body);
}

export async function cancelLeaveRequest(id: number): Promise<LeaveRequestDto> {
  return apiPut(`/leave-requests/${id}/cancel`);
}

export async function getLeaveBalances(params?: Record<string, string | number>): Promise<LeaveBalanceDto[]> {
  return apiGet('/leave-requests/balances', params);
}

export async function calculateWorkingDays(startDate: string, endDate: string, companyId?: number): Promise<WorkingDaysResponse> {
  const params: Record<string, string | number> = { startDate, endDate };
  if (companyId != null) params.companyId = companyId;
  return apiGet('/leave-requests/working-days', params);
}

export async function listEntitlements(params?: Record<string, string | number>): Promise<LeaveEntitlementDto[]> {
  return apiGet('/leave-requests/entitlements', params);
}

export async function createEntitlement(request: CreateLeaveEntitlementRequest): Promise<LeaveEntitlementDto> {
  return apiPost('/leave-requests/entitlements', request);
}

export async function updateEntitlement(id: number, request: UpdateLeaveEntitlementRequest): Promise<LeaveEntitlementDto> {
  return apiPut(`/leave-requests/entitlements/${id}`, request);
}