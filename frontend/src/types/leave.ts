export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequestDto {
  id: number;
  userId: number;
  userName: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  reason: string | null;
  approverId: number | null;
  approverName: string | null;
  approverComment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequest {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface LeaveActionRequest {
  comment?: string;
}