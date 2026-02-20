import { api } from '../lib/axios';
import { type ApiResponse, type Product } from '../types/api';

export interface CreateProductDto {
  categoryId: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductDetailsDto {
  title: string;
  code: string;
  variationType: string;
  details: Record<string, unknown>;
  about: string[];
  description: string;
}

export const productService = {
  async getAll(includeInactive: boolean = false, includeDeleted: boolean = false): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/product', {
      params: { includeInactive, includeDeleted },
    });
    return response.data.data;
  },

  async getById(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/product/${id}`);
    return response.data.data;
  },

  async create(data: CreateProductDto): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/product/create', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    const response = await api.patch<ApiResponse<Product>>(`/product/${id}`, data);
    return response.data.data;
  },

  async addDetails(id: number, data: ProductDetailsDto): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>(`/product/${id}/details`, data);
    return response.data.data;
  },

  async activate(id: number): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>(`/product/${id}/activate`);
    return response.data.data;
  },

  async deactivate(id: number): Promise<void> {
    await api.post(`/product/${id}/deactivate`);
  },

  async delete(id: number): Promise<void> {
    await api.delete<ApiResponse<void>>(`/product/${id}`);
  },

  async restore(id: number): Promise<void> {
    await api.post(`/product/${id}/restore`);
  },
};
