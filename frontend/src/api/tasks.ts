import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from './client';
import type { TaskDto, CreateTaskRequest, UpdateTaskRequest, CommentDto, CreateCommentRequest, UpdateCommentRequest } from '@/types';

export async function listProjectTasks(
  projectId: number,
  params?: Record<string, string | number>,
): Promise<TaskDto[]> {
  const res = await apiGetPaginated<TaskDto>(`/projects/${projectId}/tasks`, {
    size: 100,
    ...params,
  });
  return res.data;
}

export async function getTask(projectId: number, taskId: number): Promise<TaskDto> {
  return apiGet<TaskDto>(`/projects/${projectId}/tasks/${taskId}`);
}

export async function createTask(projectId: number, request: CreateTaskRequest): Promise<TaskDto> {
  return apiPost<TaskDto>(`/projects/${projectId}/tasks`, request);
}

export async function updateTask(projectId: number, taskId: number, request: UpdateTaskRequest): Promise<TaskDto> {
  return apiPut<TaskDto>(`/projects/${projectId}/tasks/${taskId}`, request);
}

export async function deleteTask(projectId: number, taskId: number): Promise<void> {
  await apiDelete(`/projects/${projectId}/tasks/${taskId}`);
}

// Comments
export async function getComments(projectId: number, taskId: number): Promise<CommentDto[]> {
  return apiGet<CommentDto[]>(`/projects/${projectId}/tasks/${taskId}/comments`);
}

export async function addComment(projectId: number, taskId: number, request: CreateCommentRequest): Promise<CommentDto> {
  return apiPost<CommentDto>(`/projects/${projectId}/tasks/${taskId}/comments`, request);
}

export async function updateComment(projectId: number, taskId: number, commentId: number, request: UpdateCommentRequest): Promise<CommentDto> {
  return apiPut<CommentDto>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, request);
}

export async function deleteComment(projectId: number, taskId: number, commentId: number): Promise<void> {
  await apiDelete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
}