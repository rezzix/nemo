import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './client';
import type { ProjectExpenseDto, CreateProjectExpenseRequest, UpdateProjectExpenseRequest } from '@/types';

export function listProjectExpenses(projectId: number): Promise<ProjectExpenseDto[]> {
  return apiGet(`/projects/${projectId}/expenses`);
}

export function createProjectExpense(projectId: number, data: CreateProjectExpenseRequest): Promise<ProjectExpenseDto> {
  return apiPost(`/projects/${projectId}/expenses`, data);
}

export function updateProjectExpense(projectId: number, expenseId: number, data: UpdateProjectExpenseRequest): Promise<ProjectExpenseDto> {
  return apiPut(`/projects/${projectId}/expenses/${expenseId}`, data);
}

export function deleteProjectExpense(projectId: number, expenseId: number): Promise<void> {
  return apiDelete(`/projects/${projectId}/expenses/${expenseId}`);
}

export function approveExpense(projectId: number, expenseId: number): Promise<ProjectExpenseDto> {
  return apiPatch(`/projects/${projectId}/expenses/${expenseId}/approve`);
}

export function rejectExpense(projectId: number, expenseId: number, rejectionReason: string): Promise<ProjectExpenseDto> {
  return apiPatch(`/projects/${projectId}/expenses/${expenseId}/reject`, { rejectionReason });
}