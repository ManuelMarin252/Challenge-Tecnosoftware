import { api } from '../lib/axios';
import type { InventoryMovement, ApiResponse, InventoryItem } from '../types/api';

export interface DashboardStats {
  productCount: number;
  totalMovements: number;
  totalVentas: number;
  totalOrders: number;
  salesData: { date: string; count: number }[];
  purchaseData: { date: string; count: number }[];
  role: string[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data;
  },

  getLowStock: async (): Promise<InventoryItem[]> => {
    const response = await api.get<ApiResponse<InventoryItem[]>>('/dashboard/low-stock');
    return response.data.data;
  },

  getHistory: async (): Promise<InventoryMovement[]> => {
    const response = await api.get<ApiResponse<InventoryMovement[]>>('/dashboard/history');
    return response.data.data;
  }
};
