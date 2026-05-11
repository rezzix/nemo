export interface TimeLogDto {
  id: number;
  hours: number;
  logDate: string;
  description: string | null;
  issueId: number | null;
  issueKey: string | null;
  issueTitle: string | null;
  presaleId: number | null;
  presaleName: string | null;
  userId: number;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeLogRequest {
  issueId?: number;
  presaleId?: number;
  hours: number;
  logDate: string;
  description?: string;
}

export interface UpdateTimeLogRequest {
  hours?: number;
  logDate?: string;
  description?: string;
}