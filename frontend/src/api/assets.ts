import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { LocationDto, AssetDto, CreateLocationRequest, UpdateLocationRequest, CreateAssetRequest, UpdateAssetRequest, AssignAssetRequest } from '@/types';

// ─── Locations ───

export function listLocations(companyId?: number): Promise<LocationDto[]> {
  const params: Record<string, string> = {};
  if (companyId != null) params.companyId = String(companyId);
  return apiGet<LocationDto[]>('/locations', params);
}

export function getLocationTree(companyId?: number): Promise<LocationDto[]> {
  const params: Record<string, string> = {};
  if (companyId != null) params.companyId = String(companyId);
  return apiGet<LocationDto[]>('/locations/tree', params);
}

export function getLocation(id: number): Promise<LocationDto> {
  return apiGet<LocationDto>(`/locations/${id}`);
}

export function createLocation(request: CreateLocationRequest): Promise<LocationDto> {
  return apiPost<LocationDto>('/locations', request);
}

export function updateLocation(id: number, request: UpdateLocationRequest): Promise<LocationDto> {
  return apiPut<LocationDto>(`/locations/${id}`, request);
}

export function deleteLocation(id: number): Promise<void> {
  return apiDelete(`/locations/${id}`);
}

// ─── Assets ───

export function listAssets(params?: { companyId?: number; type?: string; status?: string; locationId?: number; userId?: number }): Promise<AssetDto[]> {
  const query: Record<string, string> = {};
  if (params?.companyId != null) query.companyId = String(params.companyId);
  if (params?.type) query.type = params.type;
  if (params?.status) query.status = params.status;
  if (params?.locationId != null) query.locationId = String(params.locationId);
  if (params?.userId != null) query.userId = String(params.userId);
  return apiGet<AssetDto[]>('/assets', query);
}

export function getAsset(id: number): Promise<AssetDto> {
  return apiGet<AssetDto>(`/assets/${id}`);
}

export function createAsset(request: CreateAssetRequest): Promise<AssetDto> {
  return apiPost<AssetDto>('/assets', request);
}

export function updateAsset(id: number, request: UpdateAssetRequest): Promise<AssetDto> {
  return apiPut<AssetDto>(`/assets/${id}`, request);
}

export function assignAsset(id: number, request: AssignAssetRequest): Promise<AssetDto> {
  return apiPut<AssetDto>(`/assets/${id}/assign`, request);
}

export function unassignAsset(id: number): Promise<AssetDto> {
  return apiPut<AssetDto>(`/assets/${id}/unassign`, {});
}

export function deleteAsset(id: number): Promise<void> {
  return apiDelete(`/assets/${id}`);
}