export type PreSaleStage = 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

export interface PreSaleDto {
  id: number;
  name: string;
  key: string;
  description: string | null;
  stage: PreSaleStage;
  clientId: number | null;
  clientName: string | null;
  clientContactId: number | null;
  clientContactName: string | null;
  estimatedValue: string | null;
  probability: number | null;
  expectedCloseDate: string | null;
  lostReason: string | null;
  managerId: number;
  managerName: string;
  companyId: number | null;
  companyName: string | null;
  programId: number | null;
  programName: string | null;
  convertedProjectId: number | null;
  convertedProjectName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePreSaleRequest {
  name: string;
  key: string;
  description?: string;
  stage?: string;
  clientId?: number;
  clientContactId?: number;
  estimatedValue?: string;
  probability?: number;
  expectedCloseDate?: string;
  managerId: number;
  companyId?: number | null;
  programId?: number;
}

export interface UpdatePreSaleRequest {
  name?: string;
  description?: string;
  stage?: string;
  clientId?: number | null;
  clientContactId?: number | null;
  estimatedValue?: string | null;
  probability?: number | null;
  expectedCloseDate?: string | null;
  lostReason?: string | null;
  managerId?: number;
  programId?: number | null;
}

export interface ConvertPreSaleRequest {
  projectName: string;
  projectKey: string;
  programId: number;
  managerId: number;
  description?: string;
  budget?: string;
  targetStartDate?: string;
  targetEndDate?: string;
}

export interface CostSummaryDto {
  totalHours: number;
  totalCost: number;
  estimatedValue: number;
  margin: number;
  marginPercent: number;
  byUser: UserCostEntry[];
}

export interface UserCostEntry {
  userId: number;
  userName: string;
  hours: number;
  hourlyRate: number;
  cost: number;
}