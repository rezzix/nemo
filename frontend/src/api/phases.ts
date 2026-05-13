import { apiGet, apiPost, apiPut, apiDelete } from './client';
import client from './client';
import type { PhaseDto, CreatePhaseRequest, UpdatePhaseRequest, PhasePaymentDto, CreatePhasePaymentRequest, UpdatePhasePaymentRequest, DeliverableDto, DeliverableAttachmentDto, CreateDeliverableRequest, UpdateDeliverableRequest } from '@/types';
import type { ApiResponse } from '@/types';

// Phases

export function listPhases(projectId: number, status?: string): Promise<PhaseDto[]> {
  const params = status ? `?status=${status}` : '';
  return apiGet(`/projects/${projectId}/phases${params}`);
}

export function listOpenPhases(projectId: number): Promise<PhaseDto[]> {
  return apiGet(`/projects/${projectId}/phases?status=OPEN`);
}

export function createPhase(projectId: number, data: CreatePhaseRequest): Promise<PhaseDto> {
  return apiPost(`/projects/${projectId}/phases`, data);
}

export function updatePhase(projectId: number, phaseId: number, data: UpdatePhaseRequest): Promise<PhaseDto> {
  return apiPut(`/projects/${projectId}/phases/${phaseId}`, data);
}

export function deletePhase(projectId: number, phaseId: number): Promise<void> {
  return apiDelete(`/projects/${projectId}/phases/${phaseId}`);
}

// Phase Payments

export function listPhasePayments(projectId: number, phaseId: number): Promise<PhasePaymentDto[]> {
  return apiGet(`/projects/${projectId}/phases/${phaseId}/payments`);
}

export function createPhasePayment(projectId: number, phaseId: number, data: CreatePhasePaymentRequest): Promise<PhasePaymentDto> {
  return apiPost(`/projects/${projectId}/phases/${phaseId}/payments`, data);
}

export function updatePhasePayment(projectId: number, phaseId: number, paymentId: number, data: UpdatePhasePaymentRequest): Promise<PhasePaymentDto> {
  return apiPut(`/projects/${projectId}/phases/${phaseId}/payments/${paymentId}`, data);
}

export function deletePhasePayment(projectId: number, phaseId: number, paymentId: number): Promise<void> {
  return apiDelete(`/projects/${projectId}/phases/${phaseId}/payments/${paymentId}`);
}

// Deliverables

export function listDeliverables(projectId: number, phaseId?: number): Promise<DeliverableDto[]> {
  const params = phaseId ? `?phaseId=${phaseId}` : '';
  return apiGet(`/projects/${projectId}/deliverables${params}`);
}

export function createDeliverable(projectId: number, data: CreateDeliverableRequest): Promise<DeliverableDto> {
  return apiPost(`/projects/${projectId}/deliverables`, data);
}

export function updateDeliverable(projectId: number, id: number, data: UpdateDeliverableRequest): Promise<DeliverableDto> {
  return apiPut(`/projects/${projectId}/deliverables/${id}`, data);
}

export function deleteDeliverable(projectId: number, id: number): Promise<void> {
  return apiDelete(`/projects/${projectId}/deliverables/${id}`);
}

// Deliverable Attachments

export async function uploadDeliverableAttachment(
  projectId: number, deliverableId: number, file: File
): Promise<DeliverableAttachmentDto> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await client.post<ApiResponse<DeliverableAttachmentDto>>(
    `/projects/${projectId}/deliverables/${deliverableId}/attachments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data.data;
}

export function deleteDeliverableAttachment(
  projectId: number, deliverableId: number, attachmentId: number
): Promise<void> {
  return apiDelete(`/projects/${projectId}/deliverables/${deliverableId}/attachments/${attachmentId}`);
}

export function getDeliverableAttachmentDownloadUrl(
  projectId: number, deliverableId: number, attachmentId: number
): string {
  return `/api/projects/${projectId}/deliverables/${deliverableId}/attachments/download/${attachmentId}`;
}