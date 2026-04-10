import api from './client';
import type { ApiResponse, AuthResponse } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),

  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: string;
  }) => api.post<ApiResponse<AuthResponse>>('/auth/register', data),
};
