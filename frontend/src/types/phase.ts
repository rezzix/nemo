export interface PhaseDto {
  id: number;
  name: string;
  description: string | null;
  projectId: number;
  startDate: string | null;
  endDate: string | null;
  position: number;
  deliverableCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhaseRequest {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdatePhaseRequest {
  name?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  position?: number;
}

export interface DeliverableAttachmentDto {
  id: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface DeliverableDto {
  id: number;
  name: string;
  description: string | null;
  phaseId: number;
  phaseName: string;
  state: 'DRAFT' | 'DELIVERED' | 'VALIDATED';
  dueDate: string | null;
  attachments: DeliverableAttachmentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliverableRequest {
  name: string;
  description?: string;
  phaseId: number;
  dueDate?: string;
}

export interface UpdateDeliverableRequest {
  name?: string;
  description?: string | null;
  state?: 'DRAFT' | 'DELIVERED' | 'VALIDATED';
  dueDate?: string | null;
}