export interface ProjectDto {
  id: number;
  name: string;
  key: string;
  description: string | null;
  instructions: string | null;
  programId: number | null;
  programName: string | null;
  managerId: number;
  managerName: string;
  companyId: number | null;
  companyName: string | null;
  stage: string | null;
  strategicScore: number | null;
  plannedValue: string | null;
  budget: string | null;
  budgetSpent: string | null;
  targetStartDate: string | null;
  targetEndDate: string | null;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
  instructions?: string;
  programId: number;
  managerId: number;
  companyId?: number | null;
  memberIds?: number[];
  stage?: string;
  strategicScore?: number;
  plannedValue?: string;
  budget?: string;
  targetStartDate?: string;
  targetEndDate?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  instructions?: string;
  managerId?: number;
  stage?: string;
  strategicScore?: number | null;
  plannedValue?: string | null;
  budget?: string | null;
  budgetSpent?: string | null;
  targetStartDate?: string | null;
  targetEndDate?: string | null;
}

export interface MemberDto {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  score: number | null;
}

export interface LabelDto {
  id: number;
  name: string;
  color: string;
}

export interface LabelCreateRequest {
  name: string;
  color: string;
}

export interface BoardColumnDto {
  id: number;
  statusId: number;
  name: string;
  position: number;
  issueCount: number;
}

export interface BoardConfigDto {
  projectId: number;
  columns: BoardColumnDto[];
}

export interface BoardUpdateRequest {
  columns: { statusId: number; position: number }[];
}