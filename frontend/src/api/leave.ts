import { apiGet, apiPost, apiPut } from './client';
import type { LeaveRequestDto, CreateLeaveRequest, LeaveActionRequest } from '@/types';

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