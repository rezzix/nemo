export interface ProjectExpenseDto {
  id: number;
  projectId: number;
  category: string;
  amount: string;
  description: string | null;
  expenseDate: string;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectExpenseRequest {
  category: string;
  amount: string;
  description?: string;
  expenseDate: string;
}

export interface UpdateProjectExpenseRequest {
  category?: string;
  amount?: string;
  description?: string | null;
  expenseDate?: string;
}