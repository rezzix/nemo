export interface ProjectDto {
  id: number;
  name: string;
  key: string;
  description: string | null;
  programId: number | null;
  programName: string | null;
  managerId: number;
  managerName: string;
  companyId: number | null;
  companyName: string | null;
  clientId: number | null;
  clientName: string | null;
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
  programId: number;
  managerId: number;
  companyId?: number | null;
  clientId?: number | null;
  memberIds?: number[];
  stage?: string;
  strategicScore?: number;
  budget?: string;
  targetStartDate?: string;
  targetEndDate?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  managerId?: number;
  stage?: string;
  strategicScore?: number | null;
  budget?: string | null;
  targetStartDate?: string | null;
  targetEndDate?: string | null;
  clientId?: number | null;
}

export interface MemberDto {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  score: number | null;
  allocation: number;
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
  taskCount: number;
}

export interface BoardConfigDto {
  projectId: number;
  columns: BoardColumnDto[];
}

export interface BoardUpdateRequest {
  columns: { statusId: number; position: number }[];
}

export interface InstructionDto {
  id: number;
  projectId: number;
  authorId: number;
  authorName: string;
  content: string;
  important: boolean;
  visibleFrom: string | null;
  visibleTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstructionRequest {
  content: string;
  important?: boolean;
  visibleFrom?: string;
  visibleTo?: string;
}

export interface UpdateInstructionRequest {
  content?: string;
  important?: boolean;
  visibleFrom?: string | null;
  visibleTo?: string | null;
}

export interface NoteDto {
  id: number;
  projectId: number;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  content: string;
  pinned?: boolean;
}

export interface UpdateNoteRequest {
  content?: string;
  pinned?: boolean;
}