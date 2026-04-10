import api from './client';
import type { ApiResponse, Ingredient, InventoryItem, StockMovement, StockMovementType } from '../types';

export const inventoryApi = {
  createIngredient: (data: {
    name: string;
    unit: string;
    minStockLevel: number;
    initialStock: number;
  }) => api.post<ApiResponse<Ingredient>>('/inventory/ingredients', data),

  addMovement: (data: {
    ingredientId: string;
    type: StockMovementType;
    quantity: number;
    reason?: string;
  }) => api.post<ApiResponse<StockMovement>>('/inventory/movements', data),

  getInventory: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<InventoryItem[]>>('/inventory', { params }),

  getLowStock: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<InventoryItem[]>>('/inventory/alerts/low-stock', { params }),

  getMovements: (params?: {
    ingredientId?: string;
    type?: StockMovementType;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<StockMovement[]>>('/inventory/movements/history', { params }),

  deleteIngredient: (ingredientId: string) =>
    api.delete(`/inventory/ingredients/${ingredientId}`),

  getIngredients: () => api.get<ApiResponse<Ingredient[]>>('/ingredients'),
};
