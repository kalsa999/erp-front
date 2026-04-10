import api from './client';
import type { ApiResponse, Review } from '../types';

export const reviewsApi = {
  getForMenuItem: (menuItemId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Review[]>>(`/reviews/menu/${menuItemId}`, { params }),

  getMine: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Review[]>>('/reviews/me', { params }),

  create: (data: {
    orderId: string;
    orderItemId: string;
    menuItemId: string;
    rating: number;
    comment?: string;
  }) => api.post<ApiResponse<Review>>('/reviews', data),
};
