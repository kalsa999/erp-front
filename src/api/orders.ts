import api from './client';
import type { ApiResponse, Order, Cart, OrderStatus, OrderType } from '../types';

export const ordersApi = {
  getCart: () => api.get<ApiResponse<Cart>>('/orders/cart'),

  addToCart: (menuItemId: string, quantity: number) =>
    api.post<ApiResponse<Cart>>('/orders/cart/items', { menuItemId, quantity }),

  clearCart: () => api.post<ApiResponse<void>>('/orders/cart/clear'),

  placeOrder: (data: {
    orderType: OrderType;
    tableId?: string;
    tableNumber?: number;
    notes?: string;
  }) => api.post<ApiResponse<Order>>('/orders', data),

  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Order[]>>('/orders/history', { params }),

  getOrder: (orderId: string) => api.get<ApiResponse<Order>>(`/orders/${orderId}`),

  getTracking: (orderId: string) =>
    api.get<ApiResponse<{ status: OrderStatus; updatedAt: string }>>(`/orders/${orderId}/tracking`),

  updateStatus: (orderId: string, status: OrderStatus) =>
    api.patch<ApiResponse<Order>>(`/orders/${orderId}/status`, { status }),

  updateItem: (orderId: string, orderItemId: string, quantity: number) =>
    api.patch<ApiResponse<Order>>(`/orders/${orderId}/items/${orderItemId}`, { quantity }),

  removeItem: (orderId: string, orderItemId: string, removeAll?: boolean) =>
    api.delete<ApiResponse<Order>>(`/orders/${orderId}/items/${orderItemId}`, {
      data: { removeAll },
    }),

  // backoffice: list all orders  (no dedicated endpoint; reuse history for staff)
  // The backend returns only own orders for CLIENT via /orders/history
  // For staff we query with status filter
};
