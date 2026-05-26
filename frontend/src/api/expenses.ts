import { apiGet, apiPost, apiPut, apiDelete } from './client';
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