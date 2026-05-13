export interface TaskTypeDto {
  id: number;
  name: string;
}

export type TaskStatusCategory = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CLOSED';

export interface TaskStatusDto {
  id: number;
  name: string;
  category: TaskStatusCategory;
  isDefault: boolean;
}

export interface AuditLogDto {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  performedBy: number;
  createdAt: string;
}

export interface ActivityLogDto {
  id: number;
  username: string;
  method: string;
  path: string;
  status: number;
  ip: string;
  duration: number;
  createdAt: string;
}

export interface OrganizationUpdateRequest {
  name: string;
  address?: string;
  website?: string;
  logo?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: number | null;
  assignedProjectId?: number | null;
  jobTitle?: string;
  department?: string;
  phone?: string;
  hireDate?: string;
}

export interface AdminUpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  active?: boolean;
  companyId?: number | null;
  assignedProjectId?: number | null;
  jobTitle?: string;
  department?: string;
  phone?: string;
  hireDate?: string;
}

export interface CreateTaskTypeRequest {
  name: string;
}

export interface CreateTaskStatusRequest {
  name: string;
  category: TaskStatusCategory;
  isDefault: boolean;
}