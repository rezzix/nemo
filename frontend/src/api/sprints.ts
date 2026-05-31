import { apiGet, apiPost, apiPut } from './client';
import type { SprintDto, SprintVelocityDto, CreateSprintRequest, UpdateSprintRequest } from '@/types';

export async function listSprints(projectId: number): Promise<SprintDto[]> {
  return apiGet<SprintDto[]>(`/projects/${projectId}/sprints`);
}

export async function getSprintVelocity(projectId: number): Promise<SprintVelocityDto[]> {
  return apiGet<SprintVelocityDto[]>(`/projects/${projectId}/sprints/velocity`);
}

export async function createSprint(projectId: number, request: CreateSprintRequest): Promise<SprintDto> {
  return apiPost<SprintDto>(`/projects/${projectId}/sprints`, request);
}

export async function updateSprint(projectId: number, sprintId: number, request: UpdateSprintRequest): Promise<SprintDto> {
  return apiPut<SprintDto>(`/projects/${projectId}/sprints/${sprintId}`, request);
}

export async function updateSprintStatus(projectId: number, sprintId: number, status: string): Promise<SprintDto> {
  return apiPut<SprintDto>(`/projects/${projectId}/sprints/${sprintId}/status`, { status });
}

export async function startSprint(projectId: number, sprintId: number): Promise<SprintDto> {
  return apiPost<SprintDto>(`/projects/${projectId}/sprints/${sprintId}/start`);
}

export async function completeSprint(projectId: number, sprintId: number): Promise<SprintDto> {
  return apiPost<SprintDto>(`/projects/${projectId}/sprints/${sprintId}/complete`);
}