import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getToken, removeToken } from './auth';
import type {
  ConsultancyCompany,
  Client,
  FreelanceProfile,
  EmployeeProfile,
  Contract,
  Assignment,
  LoginRequest,
  LoginResponse,
  DashboardMetrics,
  PaginatedResponse,
} from './types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);
    const res = await apiClient.post<LoginResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const res = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
    return res.data;
  },
};

// ─── Companies ───────────────────────────────────────────────────────────────

export const companiesApi = {
  list: async (params?: {
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<ConsultancyCompany>> => {
    const res = await apiClient.get<PaginatedResponse<ConsultancyCompany>>(
      '/companies',
      { params }
    );
    return res.data;
  },

  get: async (id: string): Promise<ConsultancyCompany> => {
    const res = await apiClient.get<ConsultancyCompany>(`/companies/${id}`);
    return res.data;
  },

  create: async (
    data: Omit<ConsultancyCompany, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ConsultancyCompany> => {
    const res = await apiClient.post<ConsultancyCompany>('/companies', data);
    return res.data;
  },

  update: async (
    id: string,
    data: Partial<Omit<ConsultancyCompany, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ConsultancyCompany> => {
    const res = await apiClient.put<ConsultancyCompany>(
      `/companies/${id}`,
      data
    );
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },
};

// ─── Freelancers ─────────────────────────────────────────────────────────────

export const freelancersApi = {
  list: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<FreelanceProfile>> => {
    const res = await apiClient.get<PaginatedResponse<FreelanceProfile>>(
      '/freelancers',
      { params }
    );
    return res.data;
  },

  get: async (id: string): Promise<FreelanceProfile> => {
    const res = await apiClient.get<FreelanceProfile>(`/freelancers/${id}`);
    return res.data;
  },

  create: async (
    data: Omit<FreelanceProfile, 'id' | 'contracts'>
  ): Promise<FreelanceProfile> => {
    const res = await apiClient.post<FreelanceProfile>('/freelancers', data);
    return res.data;
  },

  update: async (
    id: string,
    data: Partial<Omit<FreelanceProfile, 'id' | 'contracts'>>
  ): Promise<FreelanceProfile> => {
    const res = await apiClient.put<FreelanceProfile>(
      `/freelancers/${id}`,
      data
    );
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/freelancers/${id}`);
  },
};

// ─── Employees ───────────────────────────────────────────────────────────────

export const employeesApi = {
  list: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<EmployeeProfile>> => {
    const res = await apiClient.get<PaginatedResponse<EmployeeProfile>>(
      '/employees',
      { params }
    );
    return res.data;
  },

  get: async (id: string): Promise<EmployeeProfile> => {
    const res = await apiClient.get<EmployeeProfile>(`/employees/${id}`);
    return res.data;
  },

  create: async (
    data: Omit<EmployeeProfile, 'id'>
  ): Promise<EmployeeProfile> => {
    const res = await apiClient.post<EmployeeProfile>('/employees', data);
    return res.data;
  },

  update: async (
    id: string,
    data: Partial<Omit<EmployeeProfile, 'id'>>
  ): Promise<EmployeeProfile> => {
    const res = await apiClient.put<EmployeeProfile>(
      `/employees/${id}`,
      data
    );
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },
};

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clientsApi = {
  list: async (params?: {
    search?: string;
    type?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Client>> => {
    const res = await apiClient.get<PaginatedResponse<Client>>('/clients', {
      params,
    });
    return res.data;
  },

  get: async (id: string): Promise<Client> => {
    const res = await apiClient.get<Client>(`/clients/${id}`);
    return res.data;
  },

  create: async (data: Omit<Client, 'id'>): Promise<Client> => {
    const res = await apiClient.post<Client>('/clients', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Omit<Client, 'id'>>): Promise<Client> => {
    const res = await apiClient.put<Client>(`/clients/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
  },
};

// ─── Contracts ───────────────────────────────────────────────────────────────

export const contractsApi = {
  list: async (params?: {
    search?: string;
    company_id?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Contract>> => {
    const res = await apiClient.get<PaginatedResponse<Contract>>('/contracts', {
      params,
    });
    return res.data;
  },

  get: async (id: string): Promise<Contract> => {
    const res = await apiClient.get<Contract>(`/contracts/${id}`);
    return res.data;
  },

  create: async (
    data: Omit<Contract, 'id' | 'assignments'>
  ): Promise<Contract> => {
    const res = await apiClient.post<Contract>('/contracts', data);
    return res.data;
  },

  update: async (
    id: string,
    data: Partial<Omit<Contract, 'id' | 'assignments'>>
  ): Promise<Contract> => {
    const res = await apiClient.put<Contract>(`/contracts/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contracts/${id}`);
  },

  uploadPdf: async (id: string, file: File): Promise<Contract> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<Contract>(
      `/contracts/${id}/upload-pdf`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  downloadPdf: async (id: string): Promise<Blob> => {
    const res = await apiClient.get(`/contracts/${id}/download-pdf`, {
      responseType: 'blob',
    });
    return res.data;
  },
};

// ─── Assignments ─────────────────────────────────────────────────────────────

export const assignmentsApi = {
  list: async (params?: {
    search?: string;
    timesheet_code?: string;
    contract_id?: string;
    employee_id?: string;
    client_id?: string;
    end_client_id?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Assignment>> => {
    const res = await apiClient.get<PaginatedResponse<Assignment>>(
      '/assignments',
      { params }
    );
    return res.data;
  },

  get: async (id: string): Promise<Assignment> => {
    const res = await apiClient.get<Assignment>(`/assignments/${id}`);
    return res.data;
  },

  create: async (
    data: Omit<Assignment, 'id'>
  ): Promise<Assignment> => {
    const res = await apiClient.post<Assignment>('/assignments', data);
    return res.data;
  },

  update: async (
    id: string,
    data: Partial<Omit<Assignment, 'id'>>
  ): Promise<Assignment> => {
    const res = await apiClient.put<Assignment>(`/assignments/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/assignments/${id}`);
  },
};

// ─── Error helpers ────────────────────────────────────────────────────────────

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    if (data?.detail) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) {
        return data.detail.map((e: { msg: string }) => e.msg).join(', ');
      }
    }
    if (data?.message) return data.message;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
