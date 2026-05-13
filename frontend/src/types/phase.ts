export interface PhaseDto {
  id: number;
  name: string;
  description: string | null;
  projectId: number;
  startDate: string | null;
  endDate: string | null;
  position: number;
  status: string;
  deliverableCount: number;
  plannedAmount: string | null;
  totalPaid: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhaseRequest {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  plannedAmount?: string;
  status?: string;
}

export interface UpdatePhaseRequest {
  name?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  position?: number;
  plannedAmount?: string | null;
  status?: string;
}

export interface PhasePaymentDto {
  id: number;
  phaseId: number;
  amount: string;
  paymentDate: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhasePaymentRequest {
  amount: string;
  paymentDate?: string;
  reference?: string;
  notes?: string;
}

export interface UpdatePhasePaymentRequest {
  amount?: string;
  paymentDate?: string | null;
  reference?: string | null;
  notes?: string | null;
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