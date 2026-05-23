import type { TaskStatusCategory } from './admin';

export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface TaskDto {
  id: number;
  title: string;
  description: string | null;
  taskKey: string;
  statusId: number;
  statusName: string;
  statusCategory: TaskStatusCategory;
  priority: TaskPriority;
  typeId: number;
  typeName: string;
  projectId: number;
  projectKey: string;
  assigneeId: number | null;
  assigneeName: string | null;
  reporterId: number | null;
  reporterName: string | null;
  sprintId: number | null;
  phaseId: number | null;
  phaseName: string | null;
  position: number;
  external: boolean;
  labelIds: number[];
  labelNames: string[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: string;
  typeId: number;
  assigneeId?: number | null;
  phaseId?: number | null;
  labelIds?: number[];
  external?: boolean;
  dueDate?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: string;
  typeId?: number;
  assigneeId?: number | null;
  statusId?: number;
  sprintId?: number | null;
  phaseId?: number | null;
  labelIds?: number[];
  external?: boolean;
  dueDate?: string | null;
}

export interface CommentDto {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}