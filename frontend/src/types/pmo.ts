export interface RaidItemDto {
  id: number;
  projectId: number;
  projectName: string;
  type: 'RISK' | 'ASSUMPTION' | 'ISSUE' | 'DEPENDENCY';
  title: string;
  description: string | null;
  status: 'OPEN' | 'MITIGATING' | 'RESOLVED' | 'CLOSED';
  probability: number | null;
  impact: number | null;
  riskScore: number;
  mitigationPlan: string | null;
  dependsOnProjectId: number | null;
  ownerId: number | null;
  ownerName: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRaidItemRequest {
  projectId: number;
  type: 'RISK' | 'ASSUMPTION' | 'ISSUE' | 'DEPENDENCY';
  title: string;
  description?: string;
  status?: 'OPEN' | 'MITIGATING' | 'RESOLVED' | 'CLOSED';
  probability?: number | null;
  impact?: number | null;
  mitigationPlan?: string | null;
  dependsOnProjectId?: number | null;
  ownerId?: number | null;
  dueDate?: string | null;
}

export interface UpdateRaidItemRequest {
  type?: 'RISK' | 'ASSUMPTION' | 'ISSUE' | 'DEPENDENCY';
  title?: string;
  description?: string | null;
  status?: 'OPEN' | 'MITIGATING' | 'RESOLVED' | 'CLOSED';
  probability?: number | null;
  impact?: number | null;
  mitigationPlan?: string | null;
  dependsOnProjectId?: number | null;
  ownerId?: number | null;
  dueDate?: string | null;
}

export interface EvmMetrics {
  projectId: number;
  projectName: string;
  totalIssues: number;
  completedIssues: number;
  completionPct: number;
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  pvToday: number;
  costVariance: number;
  scheduleVariance: number;
  cpi: number;
  spi: number;
  budget: number;
  laborCost: number;
  stage: string | null;
  strategicScore: number | null;
  targetStartDate: string | null;
  targetEndDate: string | null;
  openRisks: number;
  mitigatingRisks: number;
  maxRiskScore: number;
  avgRiskScore: number;
  derivedPlannedValue: number;
  totalPaid: number;
}

export interface PortfolioSummary {
  totalProjects: number;
  totalIssues: number;
  totalCompleted: number;
  totalPlannedValue: number;
  totalEarnedValue: number;
  totalActualCost: number;
  totalBudget: number;
  totalBudgetSpent: number;
  portfolioCv: number;
  portfolioSv: number;
  totalOpenRisks: number;
  totalMitigatingRisks: number;
  stageDistribution: Record<string, number>;
}

export interface CompanyPortfolioSummary {
  companyId: number | null;
  companyName: string;
  companyKey: string;
  totalProjects: number;
  totalIssues: number;
  totalCompleted: number;
  totalBudget: number;
  totalBudgetSpent: number;
  totalOpenRisks: number;
  totalMitigatingRisks: number;
  stageDistribution: Record<string, number>;
}

export interface PhaseTimelineEntry {
  phaseId: number;
  phaseName: string;
  startDate: string | null;
  endDate: string | null;
  totalDeliverables: number;
  completedDeliverables: number;
}

export interface ProjectTimelineEntry {
  projectId: number;
  projectKey: string;
  projectName: string;
  companyName: string | null;
  stage: string | null;
  targetStartDate: string | null;
  targetEndDate: string | null;
  completionPct: number;
  phases: PhaseTimelineEntry[];
}

export interface UserRateDto {
  id: number;
  userId: number;
  username: string;
  hourlyRate: number;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}