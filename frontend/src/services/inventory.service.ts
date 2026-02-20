import { api } from '../lib/axios';
import type { InventoryItem, InventoryMovement, ApiResponse } from '../types/api';

export const inventoryService = {
  async findAll(includeInactive: boolean = false): Promise<InventoryItem[]> {
    const response = await api.get<ApiResponse<InventoryItem[]>>('/inventory', {
      params: { includeInactive }
    });
    return response.data.data;
  },

  async replenish(productId: number, quantity: number, reason: string): Promise<void> {
    await api.patch(`/inventory/${productId}/replenish`, { quantity, reason });
  },

  async getHistory(productId: number): Promise<InventoryMovement[]> {
    const response = await api.get<ApiResponse<InventoryMovement[]>>(`/inventory/${productId}/history`);
    return response.data.data;
  }
};
