import api from './client';
import type { ApiResponse, Payment, DailyClosing, PaymentMethod } from '../types';

export const paymentsApi = {
  create: (data: {
    orderId: string;
    amount: number;
    method: PaymentMethod;
    transactionRef?: string;
  }) => api.post<ApiResponse<Payment>>('/payments', data),

  createMixed: (data: {
    orderId: string;
    payments: { method: PaymentMethod; amount: number; transactionRef?: string }[];
  }) => api.post<ApiResponse<Payment[]>>('/payments/mixed', data),

  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Payment[]>>('/payments', { params }),

  getMine: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Payment[]>>('/payments/me', { params }),

  getForOrder: (orderId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Payment[]>>(`/payments/order/${orderId}`, { params }),

  getDailyClosing: (date?: string) =>
    api.get<ApiResponse<DailyClosing>>('/payments/closing/daily', { params: { date } }),

  closeDailyCash: (data: { date?: string; actualCash: number; notes?: string }) =>
    api.post<ApiResponse<DailyClosing>>('/payments/closing/daily', data),

  getTreasurySummary: (params?: { from?: string; to?: string }) =>
    api.get<ApiResponse<unknown>>('/payments/treasury/summary', { params }),
};
