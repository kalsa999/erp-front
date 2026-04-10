import api from './client';
import type { ApiResponse, Expense, ExpenseCategory, MonthlyProfit } from '../types';

export const financeApi = {
  createExpense: (data: {
    title: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: string;
    notes?: string;
  }) => api.post<ApiResponse<Expense>>('/finance/expenses', data),

  getExpenses: (params?: {
    category?: ExpenseCategory;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<Expense[]>>('/finance/expenses', { params }),

  getRevenue: (params?: { period?: 'daily' | 'weekly' | 'monthly'; from?: string; to?: string }) =>
    api.get<ApiResponse<unknown>>('/finance/revenue', { params }),

  getMonthlyProfit: (year?: number) =>
    api.get<ApiResponse<MonthlyProfit[]>>('/finance/profit/monthly', { params: { year } }),

  getAnnualProfit: (year?: number) =>
    api.get<ApiResponse<unknown>>('/finance/profit/annual', { params: { year } }),
};
