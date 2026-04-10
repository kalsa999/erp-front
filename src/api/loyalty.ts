import api from './client';
import type { ApiResponse, LoyaltyAccount, LoyaltyTransaction } from '../types';

export const loyaltyApi = {
  getMyAccount: () =>
    api.get<ApiResponse<{ account: LoyaltyAccount; transactions: LoyaltyTransaction[] }>>('/loyalty/me'),

  redeem: (quantity: number) =>
    api.post<ApiResponse<unknown>>('/loyalty/me/redeem', { quantity }),

  adjust: (data: { userId: string; pointsDelta: number; reason?: string }) =>
    api.post<ApiResponse<unknown>>('/loyalty/adjust', data),
};
