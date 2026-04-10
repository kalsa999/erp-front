import api from './client';
import type { ApiResponse, Reservation, ReservationStatus } from '../types';

export const reservationsApi = {
  create: (data: {
    tableId: string;
    guestCount: number;
    startAt: string;
    endAt: string;
    notes?: string;
  }) => api.post<ApiResponse<Reservation>>('/reservations', data),

  getMine: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Reservation[]>>('/reservations/me', { params }),

  getAvailability: (params: { startAt: string; endAt: string; guestCount: number }) =>
    api.get<ApiResponse<unknown[]>>('/reservations/availability', { params }),

  getAll: (params?: {
    page?: number;
    limit?: number;
    tableId?: string;
    status?: ReservationStatus;
    from?: string;
    to?: string;
  }) => api.get<ApiResponse<Reservation[]>>('/reservations', { params }),

  update: (
    reservationId: string,
    data: { tableId?: string; guestCount?: number; startAt?: string; endAt?: string; notes?: string },
  ) => api.patch<ApiResponse<Reservation>>(`/reservations/${reservationId}`, data),

  cancel: (reservationId: string) =>
    api.patch<ApiResponse<Reservation>>(`/reservations/${reservationId}/cancel`),

  updateStatus: (reservationId: string, status: ReservationStatus) =>
    api.patch<ApiResponse<Reservation>>(`/reservations/${reservationId}/status`, { status }),
};
