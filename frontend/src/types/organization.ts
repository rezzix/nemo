export interface OrganizationConfig {
  id: number;
  name: string;
  address: string | null;
  website: string | null;
  logo: string | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicConfigResponse {
  organization: OrganizationConfig | null;
  mode: string;
  version: string;
  build: string;
  currency: string;
}