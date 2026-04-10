import api from './client';
import type { ApiResponse, ClientAddress, ClientPreference, MenuItem } from '../types';

export const clientsApi = {
  getAddresses: () => api.get<ApiResponse<ClientAddress[]>>('/clients/me/addresses'),

  createAddress: (data: {
    label: string;
    addressLine: string;
    city: string;
    postalCode?: string;
    isDefault?: boolean;
  }) => api.post<ApiResponse<ClientAddress>>('/clients/me/addresses', data),

  setDefaultAddress: (addressId: string) =>
    api.patch<ApiResponse<ClientAddress>>(`/clients/me/addresses/${addressId}/default`),

  deleteAddress: (addressId: string) =>
    api.delete(`/clients/me/addresses/${addressId}`),

  getPreferences: () => api.get<ApiResponse<ClientPreference>>('/clients/me/preferences'),

  updatePreferences: (data: Partial<ClientPreference>) =>
    api.patch<ApiResponse<ClientPreference>>('/clients/me/preferences', data),

  getFavorites: () => api.get<ApiResponse<MenuItem[]>>('/clients/me/favorites'),

  addFavorite: (menuItemId: string) =>
    api.post<ApiResponse<unknown>>('/clients/me/favorites', { menuItemId }),

  removeFavorite: (menuItemId: string) =>
    api.delete(`/clients/me/favorites/${menuItemId}`),

  getInvoices: () => api.get<ApiResponse<unknown[]>>('/clients/me/invoices'),

  getSummary: () => api.get<ApiResponse<unknown>>('/clients/me/summary'),
};
