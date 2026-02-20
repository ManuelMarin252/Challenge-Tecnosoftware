import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import { renderWithClient } from '../../test/utils';
import * as DashboardServiceModule from '../../services/dashboard.service';
import * as AuthContextModule from '../../context/auth-context';
import { RoleEnum } from '../../types/api';

// Mock child components to simplify testing the container logic
vi.mock('./AdminDashboard', () => ({
  AdminDashboard: () => <div data-testid="admin-dashboard">Admin Dashboard</div>
}));
vi.mock('./MerchantDashboard', () => ({
  MerchantDashboard: () => <div data-testid="merchant-dashboard">Merchant Dashboard</div>
}));
vi.mock('./CustomerDashboard', () => ({
  CustomerDashboard: () => <div data-testid="customer-dashboard">Customer Dashboard</div>
}));
// Mock EventSource for SSE
class MockEventSource {
  onmessage = null;
  onerror = null;
  close = vi.fn();
  url: string;
  constructor(url: string) {
    this.url = url;
  }
}
(globalThis as unknown as { EventSource: unknown }).EventSource = MockEventSource;

describe('Dashboard Container', () => {
    const mockStats = { 
        productCount: 10, 
        totalMovements: 5, 
        totalVentas: 3,
        totalOrders: 2,
        salesData: [],
        purchaseData: [],
        role: ['ADMIN'] 
    };
    
    beforeEach(() => {
        vi.spyOn(DashboardServiceModule.dashboardService, 'getStats').mockResolvedValue(mockStats);
        vi.spyOn(DashboardServiceModule.dashboardService, 'getLowStock').mockResolvedValue([]);
        vi.spyOn(DashboardServiceModule.dashboardService, 'getHistory').mockResolvedValue([]);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render AdminDashboard for admin user', async () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: { id: 1, email: 'admin@test.com', roles: [{ name: RoleEnum.ADMIN }] },
            isAuthenticated: true,
        } as unknown as AuthContextModule.AuthContextType);

        renderWithClient(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
        });
    });

    it('should render MerchantDashboard for merchant user', async () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: { id: 2, email: 'merchant@test.com', roles: [{ name: RoleEnum.MERCHANT }] },
            isAuthenticated: true,
        } as unknown as AuthContextModule.AuthContextType);

        renderWithClient(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByTestId('merchant-dashboard')).toBeInTheDocument();
        });
    });

    it('should render CustomerDashboard for customer user', async () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            user: { id: 3, email: 'customer@test.com', roles: [{ name: RoleEnum.CUSTOMER }] },
            isAuthenticated: true,
        } as unknown as AuthContextModule.AuthContextType);

        renderWithClient(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByTestId('customer-dashboard')).toBeInTheDocument();
        });
    });
});
