import axios from 'axios';
import type { ApiResponse, PaginatedResponse } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().sessionExpired();
    }
    return Promise.reject(error);
  },
);

export async function apiGet<T>(url: string, params?: Record<string, string | number>): Promise<T> {
  const res = await client.get<ApiResponse<T>>(url, { params });
  return res.data.data;
}

export async function apiGetPaginated<T>(url: string, params?: Record<string, string | number>): Promise<PaginatedResponse<T>> {
  const res = await client.get<PaginatedResponse<T>>(url, { params });
  return res.data;
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const res = await client.post<ApiResponse<T>>(url, data);
  return res.data.data;
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const res = await client.put<ApiResponse<T>>(url, data);
  return res.data.data;
}

export async function apiDelete(url: string): Promise<void> {
  await client.delete(url);
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  const res = await client.patch<ApiResponse<T>>(url, data);
  return res.data.data;
}

export function extractValidationErrors(err: unknown): Record<string, string> {
  if (axios.isAxiosError(err) && err.response?.status === 422) {
    const errors = (err.response.data as { errors?: Array<{ field: string; message: string }> }).errors;
    if (errors) {
      const result: Record<string, string> = {};
      for (const e of errors) {
        result[e.field] = e.message;
      }
      return result;
    }
  }
  return {};
}

export default client;