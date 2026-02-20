import axios from 'axios';
import type { AuthResponse, ApiResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authService = {
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await axios.post<ApiResponse<AuthResponse>>(`${API_URL}/api/auth/login`, credentials);
    console.log('AuthService raw response:', response.data);
    return response.data.data;
  },
};
