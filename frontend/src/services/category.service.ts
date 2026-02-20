import { api } from '../lib/axios';
import type { ApiResponse, Category } from '../types/api';

export const categoryService = {
  async findAll(): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>('/category');
    return response.data.data;
  },

  async create(data: { id: number; name: string }): Promise<Category> {
    const response = await api.post<ApiResponse<Category>>('/category', data);
    return response.data.data;
  },

  async update(id: number, name: string): Promise<Category> {
    const response = await api.patch<ApiResponse<Category>>(`/category/${id}`, { name });
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/category/${id}`);
  },
};
