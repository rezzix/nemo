export interface ClientDto {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  notes: string | null;
  companyId: number | null;
  companyName: string | null;
  contacts: ClientContactDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientContactDto {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
}

export interface CreateClientRequest {
  name: string;
  industry?: string;
  website?: string;
  notes?: string;
  companyId?: number | null;
  contacts?: CreateClientContactRequest[];
}

export interface UpdateClientRequest {
  name?: string;
  industry?: string;
  website?: string;
  notes?: string;
  companyId?: number | null;
  clearCompany?: boolean;
}

export interface CreateClientContactRequest {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface UpdateClientContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}