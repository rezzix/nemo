import client from './client';
import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from './client';
import type {
  UserDto,
  ProgramDto,
  CreateProgramRequest,
  UpdateProgramRequest,
  OrganizationConfig,
  TaskTypeDto,
  TaskStatusDto,
  OrganizationUpdateRequest,
  CreateUserRequest,
  AdminUpdateUserRequest,
  CreateTaskTypeRequest,
  CreateTaskStatusRequest,
} from '@/types';

// Users
export async function listUsers(params?: Record<string, string | number>) {
  const res = await apiGetPaginated<UserDto>('/users', { size: 100, ...params });
  return res;
}

export async function createUser(request: CreateUserRequest): Promise<UserDto> {
  return apiPost<UserDto>('/users', request);
}

export async function adminUpdateUser(id: number, request: AdminUpdateUserRequest): Promise<UserDto> {
  return apiPut<UserDto>(`/users/${id}`, request);
}

export async function deactivateUser(id: number): Promise<void> {
  await apiDelete(`/users/${id}`);
}

// Programs
export async function listPrograms(params?: Record<string, string | number>) {
  const res = await apiGetPaginated<ProgramDto>('/programs', { size: 100, ...params });
  return res;
}

export async function createProgram(request: CreateProgramRequest): Promise<ProgramDto> {
  return apiPost<ProgramDto>('/programs', request);
}

export async function updateProgram(id: number, request: UpdateProgramRequest): Promise<ProgramDto> {
  return apiPut<ProgramDto>(`/programs/${id}`, request);
}

export async function deleteProgram(id: number): Promise<void> {
  await apiDelete(`/programs/${id}`);
}

// Organization
export async function getOrganization(): Promise<OrganizationConfig> {
  return apiGet<OrganizationConfig>('/organization');
}

export async function updateOrganization(request: OrganizationUpdateRequest): Promise<OrganizationConfig> {
  return apiPut<OrganizationConfig>('/organization', request);
}

// Task Types (returns raw array, no ApiResponse envelope)
export async function listTaskTypes(): Promise<TaskTypeDto[]> {
  const res = await client.get<TaskTypeDto[]>('/task-types');
  return res.data;
}

export async function createTaskType(request: CreateTaskTypeRequest): Promise<TaskTypeDto> {
  const res = await client.post<TaskTypeDto>('/task-types', request);
  return res.data;
}

export async function updateTaskType(id: number, request: CreateTaskTypeRequest): Promise<TaskTypeDto> {
  const res = await client.put<TaskTypeDto>(`/task-types/${id}`, request);
  return res.data;
}

export async function deleteTaskType(id: number): Promise<void> {
  await client.delete(`/task-types/${id}`);
}

// Task Statuses (returns raw array, no ApiResponse envelope)
export async function listTaskStatuses(): Promise<TaskStatusDto[]> {
  const res = await client.get<TaskStatusDto[]>('/task-statuses');
  return res.data;
}

export async function createTaskStatus(request: CreateTaskStatusRequest): Promise<TaskStatusDto> {
  const res = await client.post<TaskStatusDto>('/task-statuses', request);
  return res.data;
}

export async function updateTaskStatus(id: number, request: CreateTaskStatusRequest): Promise<TaskStatusDto> {
  const res = await client.put<TaskStatusDto>(`/task-statuses/${id}`, request);
  return res.data;
}

export async function deleteTaskStatus(id: number): Promise<void> {
  await client.delete(`/task-statuses/${id}`);
}