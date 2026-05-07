export interface HolidayDto {
  id: number;
  date: string;
  name: string;
  companyId: number | null;
  companyName: string | null;
}

export interface CreateHolidayRequest {
  date: string;
  name: string;
  companyId?: number | null;
}

export interface UpdateHolidayRequest {
  date?: string;
  name?: string;
  companyId?: number | null;
}