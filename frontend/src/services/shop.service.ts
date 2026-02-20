
import { api } from '../lib/axios';
import type { InventoryItem, PurchaseItem, ApiResponse } from '../types/api';

export const shopService = {
  async getProducts(): Promise<InventoryItem[]> {
    const response = await api.get<ApiResponse<InventoryItem[]>>('/inventory');
    return response.data.data;
  },

  async purchase(items: PurchaseItem[]): Promise<void> {
    await api.post('/shop/purchase', { items });
  }
};
