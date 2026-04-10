import api from './client';
import type { ApiResponse, DashboardOverview } from '../types';

export const dashboardApi = {
  getOverview: (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    from?: string;
    to?: string;
    categoryId?: string;
    orderType?: string;
    employeeId?: string;
  }) => api.get<ApiResponse<DashboardOverview>>('/dashboard/overview', { params }),

  getReport: (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    from?: string;
    to?: string;
  }) => api.get<ApiResponse<DashboardOverview>>('/dashboard/report', { params }),
};
