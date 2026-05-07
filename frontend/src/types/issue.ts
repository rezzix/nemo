import type { IssueStatusCategory } from './admin';

export type IssuePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface IssueDto {
  id: number;
  title: string;
  description: string | null;
  issueKey: string;
  statusId: number;
  statusName: string;
  statusCategory: IssueStatusCategory;
  priority: IssuePriority;
  typeId: number;
  typeName: string;
  projectId: number;
  projectKey: string;
  assigneeId: number | null;
  assigneeName: string | null;
  reporterId: number | null;
  reporterName: string | null;
  sprintId: number | null;
  position: number;
  external: boolean;
  labelIds: number[];
  labelNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  priority: string;
  typeId: number;
  assigneeId?: number | null;
  labelIds?: number[];
  external?: boolean;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  priority?: string;
  typeId?: number;
  assigneeId?: number | null;
  statusId?: number;
  sprintId?: number | null;
  labelIds?: number[];
  external?: boolean;
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