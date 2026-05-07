import client from './client';
import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from './client';
import type { TimeLogDto, CreateTimeLogRequest, UpdateTimeLogRequest } from '@/types';

export async function listTimeLogs(params?: Record<string, string | number>): Promise<TimeLogDto[]> {
  const res = await apiGetPaginated<TimeLogDto>('/time-logs', { size: 100, ...params });
  return res.data;
}

export async function createTimeLog(request: CreateTimeLogRequest): Promise<TimeLogDto> {
  return apiPost<TimeLogDto>('/time-logs', request);
}

export async function updateTimeLog(id: number, request: UpdateTimeLogRequest): Promise<TimeLogDto> {
  return apiPut<TimeLogDto>(`/time-logs/${id}`, request);
}

export async function deleteTimeLog(id: number): Promise<void> {
  await apiDelete(`/time-logs/${id}`);
}

export async function getWeeklyTimesheet(userId: number, weekStart: string): Promise<{
  userId: number;
  weekStart: string;
  weekEnd: string;
  days: Record<string, TimeLogDto[]>;
}> {
  const res = await client.get('/timesheets/weekly', { params: { userId, weekStart } });
  return res.data.data;
}

export async function getDailyTimesheet(userId: number, date: string): Promise<{
  userId: number;
  date: string;
  entries: TimeLogDto[];
}> {
  const res = await client.get('/timesheets/daily', { params: { userId, date } });
  return res.data.data;
}

export async function getTimeByProject(startDate: string, endDate: string, projectId?: number): Promise<{ projectId: number; totalHours: number }[]> {
  const params: Record<string, string | number> = { startDate, endDate };
  if (projectId) params.projectId = projectId;
  return apiGet('/reports/time-by-project', params);
}

export async function getTimeByUser(startDate: string, endDate: string, projectId?: number, userId?: number): Promise<{ userId: number; totalHours: number }[]> {
  const params: Record<string, string | number> = { startDate, endDate };
  if (projectId) params.projectId = projectId;
  if (userId) params.userId = userId;
  return apiGet('/reports/time-by-user', params);
}

export async function getTimeByIssue(startDate: string, endDate: string, projectId: number, assigneeId?: number): Promise<{ issueId: number; totalHours: number }[]> {
  const params: Record<string, string | number> = { startDate, endDate, projectId };
  if (assigneeId) params.assigneeId = assigneeId;
  return apiGet('/reports/time-by-issue', params);
}

export interface AttendanceData {
  totalWorkDays: number;
  totalInternalUsers: number;
  userAttendance: {
    userId: number;
    daysWorked: number;
    absentDays: number;
    totalHours: number;
    avgDailyHours: number;
    attendanceRate: number;
  }[];
  dailySummary: {
    date: string;
    usersPresent: number;
  }[];
}

export async function getAttendanceReport(startDate: string, endDate: string): Promise<AttendanceData> {
  return apiGet('/reports/attendance', { startDate, endDate });
}

export interface HeadcountData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: { role: string; count: number }[];
  byDepartment: { department: string; count: number }[];
  byCompany: { company: string; count: number }[];
  byActiveStatus: { active: boolean; count: number }[];
}

export async function getHeadcountReport(): Promise<HeadcountData> {
  return apiGet('/reports/headcount');
}