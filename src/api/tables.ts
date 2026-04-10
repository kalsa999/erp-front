import api from './client';
import type { ApiResponse, DiningTable, TableStatus } from '../types';

export const tablesApi = {
  create: (data: { code: string; seats: number; assignedWaiterId?: string }) =>
    api.post<ApiResponse<DiningTable>>('/tables', data),

  getAll: () => api.get<ApiResponse<DiningTable[]>>('/tables'),

  updateStatus: (tableId: string, status: TableStatus) =>
    api.patch<ApiResponse<DiningTable>>(`/tables/${tableId}/status`, { status }),

  assignWaiter: (tableId: string, waiterId?: string) =>
    api.patch<ApiResponse<DiningTable>>(`/tables/${tableId}/assign-waiter`, { waiterId }),
};
