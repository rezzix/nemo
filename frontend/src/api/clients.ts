import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from './client';
import type { PaginatedResponse, ClientDto, CreateClientRequest, UpdateClientRequest, ClientContactDto, CreateClientContactRequest, UpdateClientContactRequest } from '@/types';

export async function listClients(params?: Record<string, string | number>): Promise<PaginatedResponse<ClientDto>> {
  return apiGetPaginated<ClientDto>('/clients', params);
}

export async function getClient(id: number): Promise<ClientDto> {
  return apiGet<ClientDto>(`/clients/${id}`);
}

export async function createClient(request: CreateClientRequest): Promise<ClientDto> {
  return apiPost<ClientDto>('/clients', request);
}

export async function updateClient(id: number, request: UpdateClientRequest): Promise<ClientDto> {
  return apiPut<ClientDto>(`/clients/${id}`, request);
}

export async function deleteClient(id: number): Promise<void> {
  await apiDelete(`/clients/${id}`);
}

// Contacts
export async function getClientContacts(clientId: number): Promise<ClientContactDto[]> {
  return apiGet<ClientContactDto[]>(`/clients/${clientId}/contacts`);
}

export async function addClientContact(clientId: number, request: CreateClientContactRequest): Promise<ClientContactDto> {
  return apiPost<ClientContactDto>(`/clients/${clientId}/contacts`, request);
}

export async function updateClientContact(clientId: number, contactId: number, request: UpdateClientContactRequest): Promise<ClientContactDto> {
  return apiPut<ClientContactDto>(`/clients/${clientId}/contacts/${contactId}`, request);
}

export async function deleteClientContact(clientId: number, contactId: number): Promise<void> {
  await apiDelete(`/clients/${clientId}/contacts/${contactId}`);
}