export interface ProgramDto {
  id: number;
  name: string;
  key: string;
  description: string | null;
  managerId: number;
  managerName: string;
  companyId: number | null;
  companyName: string | null;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramRequest {
  name: string;
  key: string;
  description?: string;
  managerId: number;
  companyId?: number | null;
}

export interface UpdateProgramRequest {
  name?: string;
  description?: string;
  managerId?: number;
}

export interface ProgramEvmMetrics {
  programId: number;
  programName: string | null;
  totalProjects: number;
  totalTasks: number;
  totalCompleted: number;
  completionPct: number;
  totalBudget: number;
  totalPlannedValue: number;
  totalEarnedValue: number;
  totalActualCost: number;
  totalLaborCost: number;
  totalExpenseCost: number;
  pvToday: number;
  costVariance: number;
  scheduleVariance: number;
  cpi: number | null;
  spi: number | null;
  totalOpenRisks: number;
  totalMitigatingRisks: number;
}