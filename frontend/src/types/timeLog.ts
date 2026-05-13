export interface TimeLogDto {
  id: number;
  hours: number;
  logDate: string;
  description: string | null;
  taskId: number | null;
  taskKey: string | null;
  taskTitle: string | null;
  presaleId: number | null;
  presaleName: string | null;
  userId: number;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeLogRequest {
  taskId?: number;
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