import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from './client';
import type { ProjectDto, CreateProjectRequest, UpdateProjectRequest, MemberDto, LabelDto, LabelCreateRequest, BoardConfigDto, BoardUpdateRequest, InstructionDto, CreateInstructionRequest, UpdateInstructionRequest } from '@/types';

export async function listProjects(params?: Record<string, string | number>): Promise<ProjectDto[]> {
  const res = await apiGetPaginated<ProjectDto>('/projects', { size: 100, ...params });
  return res.data;
}

export async function getProject(id: number): Promise<ProjectDto> {
  return apiGet<ProjectDto>(`/projects/${id}`);
}

export async function createProject(request: CreateProjectRequest): Promise<ProjectDto> {
  return apiPost<ProjectDto>('/projects', request);
}

export async function updateProject(id: number, request: UpdateProjectRequest): Promise<ProjectDto> {
  return apiPut<ProjectDto>(`/projects/${id}`, request);
}

export async function deleteProject(id: number): Promise<void> {
  await apiDelete(`/projects/${id}`);
}

// Members
export async function getMembers(projectId: number): Promise<MemberDto[]> {
  return apiGet<MemberDto[]>(`/projects/${projectId}/members`);
}

export async function addMembers(projectId: number, userIds: number[]): Promise<void> {
  await apiPost(`/projects/${projectId}/members`, { userIds });
}

export async function removeMember(projectId: number, userId: number): Promise<void> {
  await apiDelete(`/projects/${projectId}/members/${userId}`);
}

export async function updateMemberScore(projectId: number, userId: number, score: number): Promise<MemberDto> {
  return apiPut<MemberDto>(`/projects/${projectId}/members/${userId}/score`, { score });
}

// Labels
export async function getLabels(projectId: number): Promise<LabelDto[]> {
  return apiGet<LabelDto[]>(`/projects/${projectId}/labels`);
}

export async function createLabel(projectId: number, request: LabelCreateRequest): Promise<LabelDto> {
  return apiPost<LabelDto>(`/projects/${projectId}/labels`, request);
}

export async function updateLabel(projectId: number, labelId: number, request: LabelCreateRequest): Promise<LabelDto> {
  return apiPut<LabelDto>(`/projects/${projectId}/labels/${labelId}`, request);
}

export async function deleteLabel(projectId: number, labelId: number): Promise<void> {
  await apiDelete(`/projects/${projectId}/labels/${labelId}`);
}

// Board
export async function getBoard(projectId: number): Promise<BoardConfigDto> {
  return apiGet<BoardConfigDto>(`/projects/${projectId}/board`);
}

export async function updateBoard(projectId: number, request: BoardUpdateRequest): Promise<BoardConfigDto> {
  return apiPut<BoardConfigDto>(`/projects/${projectId}/board`, request);
}

// Favorites
export async function toggleProjectFavorite(projectId: number): Promise<ProjectDto> {
  return apiPost<ProjectDto>(`/projects/${projectId}/favorite`, {});
}

// Instructions
export async function listInstructions(projectId: number): Promise<InstructionDto[]> {
  return apiGet<InstructionDto[]>(`/projects/${projectId}/instructions`);
}

export async function createInstruction(projectId: number, request: CreateInstructionRequest): Promise<InstructionDto> {
  return apiPost<InstructionDto>(`/projects/${projectId}/instructions`, request);
}

export async function updateInstruction(projectId: number, id: number, request: UpdateInstructionRequest): Promise<InstructionDto> {
  return apiPut<InstructionDto>(`/projects/${projectId}/instructions/${id}`, request);
}

export async function deleteInstruction(projectId: number, id: number): Promise<void> {
  await apiDelete(`/projects/${projectId}/instructions/${id}`);
}