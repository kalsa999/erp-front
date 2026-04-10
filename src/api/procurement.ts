import api from './client';
import type { ApiResponse, Supplier, SupplierOrder, SupplierOrderStatus } from '../types';

export const procurementApi = {
  createSupplier: (data: { name: string; email?: string; phone?: string; address?: string }) =>
    api.post<ApiResponse<Supplier>>('/suppliers', data),

  getSuppliers: () => api.get<ApiResponse<Supplier[]>>('/suppliers'),

  createOrder: (data: {
    supplierId: string;
    items: { ingredientId: string; quantity: number; unitCost: number }[];
    notes?: string;
  }) => api.post<ApiResponse<SupplierOrder>>('/supplier-orders', data),

  getOrders: () => api.get<ApiResponse<SupplierOrder[]>>('/supplier-orders'),

  updateOrderStatus: (supplierOrderId: string, status: SupplierOrderStatus) =>
    api.patch<ApiResponse<SupplierOrder>>(`/supplier-orders/${supplierOrderId}/status`, { status }),

  receiveOrder: (supplierOrderId: string) =>
    api.patch<ApiResponse<SupplierOrder>>(`/supplier-orders/${supplierOrderId}/receive`),
};
