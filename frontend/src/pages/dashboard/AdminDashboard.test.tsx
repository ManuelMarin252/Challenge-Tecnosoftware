import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminDashboard } from './AdminDashboard';
import { renderWithClient } from '../../test/utils';
import type { InventoryItem, InventoryMovement } from '../../types/api';

// Mock Recharts to avoid rendering complex SVG in tests
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
    BarChart: () => <div data-testid="bar-chart">BarChart</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
}));

describe('AdminDashboard Component', () => {
    const mockStats = { 
        productCount: 100, 
        totalMovements: 50, 
        totalVentas: 30,
        totalOrders: 20,
        salesData: [],
        purchaseData: [],
        role: ['ADMIN'] 
    };
    const mockLowStock = [
        { id: 1, stock: 2, minStock: 5, product: { title: 'Low Item' } } as unknown as InventoryItem
    ];
    const mockHistory = [
        { id: 1, type: 'IN', quantity: 10, createdAt: new Date().toISOString(), product: { title: 'Item 1' }, user: { email: 'user@test.com' } } as unknown as InventoryMovement
    ];

    it('should render statistics cards', () => {
        renderWithClient(<AdminDashboard stats={mockStats} lowStock={[]} history={[]} />);
        
        expect(screen.getByText('Global Products')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Total Ventas (Unidades)')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('should render low stock table with items', () => {
        renderWithClient(<AdminDashboard stats={mockStats} lowStock={mockLowStock} history={[]} />);
        
        expect(screen.getByText('Productos con Stock Bajo')).toBeInTheDocument();
        expect(screen.getByText('Low Item')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Stock value
    });

    it('should render history table', () => {
        renderWithClient(<AdminDashboard stats={mockStats} lowStock={[]} history={mockHistory} />);
        
        expect(screen.getByText('Historial Global de Movimientos')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('IN')).toBeInTheDocument();
        expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });
});
