import { api } from '../lib/axios';
import type { ApiResponse, User, CreateUserDto } from '../types/api';

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/user');
    return response.data.data;
  },

  async updateUserRoles(userId: number, roleIds: number[]): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/user/${userId}/roles`, { roleIds });
    return response.data.data;
  },

  async createUser(data: CreateUserDto): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/user/create', data);
    return response.data.data;
  },

  async resetPassword(userId: number, newPassword: string): Promise<void> {
    await api.patch(`/user/${userId}/reset-password`, { newPassword });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.patch('/user/profile/change-password', { oldPassword, newPassword });
  },
};
