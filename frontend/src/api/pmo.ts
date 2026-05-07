import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { RaidItemDto, CreateRaidItemRequest, UpdateRaidItemRequest, EvmMetrics, PortfolioSummary, CompanyPortfolioSummary, ProjectTimelineEntry } from '@/types';

export function listRaidItems(projectId: number, type?: string): Promise<RaidItemDto[]> {
  const params = type ? `?type=${type}` : '';
  return apiGet(`/projects/${projectId}/raid${params}`);
}

export function getRaidItem(projectId: number, id: number): Promise<RaidItemDto> {
  return apiGet(`/projects/${projectId}/raid/${id}`);
}

export function createRaidItem(projectId: number, data: CreateRaidItemRequest): Promise<RaidItemDto> {
  return apiPost(`/projects/${projectId}/raid`, data);
}

export function updateRaidItem(projectId: number, id: number, data: UpdateRaidItemRequest): Promise<RaidItemDto> {
  return apiPut(`/projects/${projectId}/raid/${id}`, data);
}

export function deleteRaidItem(projectId: number, id: number): Promise<void> {
  return apiDelete(`/projects/${projectId}/raid/${id}`);
}

export function getEvmMetrics(projectId: number): Promise<EvmMetrics> {
  return apiGet(`/pmo/evm/${projectId}`);
}

export function getPortfolioSummary(): Promise<PortfolioSummary> {
  return apiGet('/pmo/portfolio');
}

export function listPortfolioRaidItems(type?: string): Promise<RaidItemDto[]> {
  const params = type ? `?type=${type}` : '';
  return apiGet(`/pmo/raid${params}`);
}

export function getPortfolioByCompany(): Promise<CompanyPortfolioSummary[]> {
  return apiGet('/pmo/portfolio/by-company');
}

export function getPortfolioTimeline(): Promise<ProjectTimelineEntry[]> {
  return apiGet('/pmo/portfolio/timeline');
}