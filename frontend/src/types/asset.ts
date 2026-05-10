export type AssetType = 'COMPUTER' | 'SERVER' | 'MOBILE' | 'VEHICLE' | 'MICROWAVE' | 'OTHER';
export type AssetStatus = 'IN_STOCK' | 'IN_USE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';

export interface LocationDto {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  parentName: string | null;
  companyId: number | null;
  companyName: string | null;
  order: number | null;
  active: boolean;
  assetCount: number;
  children: LocationDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetDto {
  id: number;
  name: string;
  description: string | null;
  type: AssetType;
  identifier: string | null;
  status: AssetStatus;
  locationId: number | null;
  locationName: string | null;
  userId: number | null;
  userName: string | null;
  companyId: number | null;
  companyName: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationRequest {
  name: string;
  description?: string;
  parentId?: number | null;
  companyId?: number | null;
  order?: number;
}

export interface UpdateLocationRequest {
  name?: string;
  description?: string;
  parentId?: number | null;
  order?: number;
  active?: boolean;
}

export interface CreateAssetRequest {
  name: string;
  description?: string;
  type: AssetType;
  identifier?: string;
  status?: AssetStatus;
  locationId?: number | null;
  userId?: number | null;
  companyId?: number | null;
  purchaseDate?: string;
  purchaseCost?: number;
  notes?: string;
}

export interface UpdateAssetRequest {
  name?: string;
  description?: string;
  type?: AssetType;
  identifier?: string;
  status?: AssetStatus;
  locationId?: number | null;
  companyId?: number | null;
  purchaseDate?: string;
  purchaseCost?: number;
  notes?: string;
}

export interface AssignAssetRequest {
  userId: number;
}