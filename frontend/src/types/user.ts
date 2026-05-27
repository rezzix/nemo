export type UserRole = 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'EXECUTIVE' | 'EXTERNAL' | 'HR';

export interface UserDto {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: number | null;
  companyName: string | null;
  assignedProjectId: number | null;
  assignedProjectName: string | null;
  jobTitle: string | null;
  department: string | null;
  phone: string | null;
  hireDate: string | null;
  weeklyCapacity: number;
  avatarUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  captcha?: string;
}

export interface DevUserDto {
  username: string;
  displayName: string;
  role: string;
  company: string | null;
}

export interface UpdateProfileRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AllocationSummaryDto {
  userId: number;
  totalAllocation: number;
  projects: { projectId: number; projectName: string; allocation: number }[];
}