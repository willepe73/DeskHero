export interface ConsultancyCompany {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  type: 'intercompany' | 'end_client';
  billing_address?: string;
}

export interface ContractSummary {
  id: string;
  name: string;
  purchase_rate: number;
  status: string;
  start_date: string;
  end_date: string;
}

export interface AssignmentSummary {
  id: string;
  timesheet_code: string;
  client_tariff: number;
  tariff_type: string;
  status: string;
  start_date: string;
  end_date: string;
}

export interface FreelanceProfile {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  fixed: boolean;
  status: 'active' | 'inactive';
  contracts?: ContractSummary[];
}

export interface EmployeeProfile {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  cronos_cost_price_220d: number;
  cronos_cost_price_180d: number;
  status: 'active' | 'inactive';
  assignments?: AssignmentSummary[];
}

export interface Contract {
  id: string;
  name: string;
  consultancy_company_id: string;
  freelance_id: string;
  purchase_rate: number;
  start_date: string;
  end_date: string;
  pdf_blob_storage_id?: string;
  remarks?: string;
  status: 'active' | 'terminated';
  assignments?: Assignment[];
}

export interface Assignment {
  id: string;
  contract_id?: string;
  employee_id?: string;
  client_id: string;
  end_client_id: string;
  timesheet_code: string;
  start_date: string;
  end_date: string;
  client_tariff: number;
  end_tariff?: number;
  tariff_type: 'percentage' | '50_50' | 'end_tariff';
  remarks?: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface AuthUser {
  sub: string;
  role: 'admin' | 'managing_partner';
  company_ids: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface DashboardMetrics {
  active_freelancers: number;
  active_employees: number;
  upcoming_expirations: number;
  recent_contracts: Contract[];
  expiring_assignments: Assignment[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export type ContractStatus = 'active' | 'terminated';
export type ClientType = 'intercompany' | 'end_client';
export type AssignmentStatus = 'active' | 'completed' | 'cancelled';
export type TariffType = 'percentage' | '50_50' | 'end_tariff';
