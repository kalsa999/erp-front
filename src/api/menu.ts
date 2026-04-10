import api from './client';
import type { ApiResponse, Category, MenuItem, FormulaBundle } from '../types';

export const menuApi = {
  getItems: (params?: {
    availableOnly?: boolean;
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<MenuItem[]>>('/menu', { params }),

  getItem: (id: string) => api.get<ApiResponse<MenuItem>>(`/menu/items/${id}`),

  getCategories: () => api.get<ApiResponse<Category[]>>('/menu/categories'),

  getFormulas: (params?: { availableOnly?: boolean; page?: number; limit?: number }) =>
    api.get<ApiResponse<FormulaBundle[]>>('/menu/formulas', { params }),

  getRecipe: (id: string) => api.get<ApiResponse<unknown>>(`/menu/items/${id}/recipe`),

  getMargin: (id: string) => api.get<ApiResponse<unknown>>(`/menu/items/${id}/margin`),

  createCategory: (name: string) =>
    api.post<ApiResponse<Category>>('/menu/categories', { name }),

  createItem: (data: {
    name: string;
    description?: string;
    price: number;
    categoryId: string;
    isAvailable?: boolean;
  }) => api.post<ApiResponse<MenuItem>>('/menu/items', data),

  deleteItem: (id: string) => api.delete(`/menu/items/${id}`),

  createFormula: (data: {
    name: string;
    description?: string;
    price: number;
    isAvailable?: boolean;
    items: { menuItemId: string; quantity: number }[];
  }) => api.post<ApiResponse<FormulaBundle>>('/menu/formulas', data),

  uploadImage: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/menu/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
