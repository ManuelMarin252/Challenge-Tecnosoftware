import { api } from '../lib/axios';
import type { ApiResponse, Role } from '../types/api';

export const roleService = {
  async getRoles(): Promise<Role[]> {
    const response = await api.get<ApiResponse<Role[]>>('/role');
    return response.data.data;
  },
};
