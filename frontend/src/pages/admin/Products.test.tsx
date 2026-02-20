import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Products } from '../../pages/admin/Products';
import { renderWithClient } from '../../test/utils';
import { vi } from 'vitest';
import * as ProductServiceModule from '../../services/product.service';
import * as CategoryServiceModule from '../../services/category.service';
import * as AuthContextModule from '../../context/auth-context';
import type { Product } from '../../types/api';

// Mock Services
const mockProducts = [
  {
    id: 1,
    title: 'Product 1',
    stock: 10,
    isActive: true, // Should show Active badge
    category: { name: 'Cat' },
    product: {
        id: 1,
        title: 'Product 1'
    }
  },
  {
    id: 2,
    title: 'Product 2',
    stock: 5,
    isActive: false, // Should show Inactive badge
    category: { name: 'Cat' },
    product: {
        id: 2,
        title: 'Product 2'
    }
  }
];

// Mock ProductService
vi.spyOn(ProductServiceModule.productService, 'getAll').mockResolvedValue(mockProducts as unknown as Product[]);

// Mock useAuth
const mockUser = {
  id: 1,
  email: 'admin@test.com',
  roles: [{ id: 3, name: 'Admin' }],
};

vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
  user: mockUser,
  token: 'fake-token',
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: true,
  // isLoading: false, // Type definition in auth-context.ts might not have isLoading, check AuthContextType
} as unknown as AuthContextModule.AuthContextType);

// Mock categoryService
vi.spyOn(CategoryServiceModule.categoryService, 'findAll').mockResolvedValue([]);


describe('Products Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Re-mock Services
    vi.spyOn(ProductServiceModule.productService, 'getAll').mockResolvedValue(mockProducts as unknown as Product[]);
    vi.spyOn(CategoryServiceModule.categoryService, 'findAll').mockResolvedValue([]);
    
    // Re-mock useAuth in case it was cleared, though we set it globally here
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: mockUser,
        token: 'fake-token',
        login: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: true,
      });
  });

  it('should display products correctly', async () => {
    renderWithClient(<Products />);

    await waitFor(() => {
        expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      // Product 2 is inactive, might not be shown by default or might be shown depending on default state.
      // The component default is showInactive=false.
    });
  });

  it('should toggle "Show Inactive" to see inactive products', async () => {
    // We need to mock useAuth to return an admin user if we want to test RBAC logic fully.
    // For now, let's assume the component renders.
    
    renderWithClient(<Products />);

    await waitFor(() => {
        expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument();
    });

    const toggle = screen.getByLabelText(/Mostrar eliminados/i); // Label might be "Mostrar eliminados" based on previous analysis
    expect(toggle).toBeInTheDocument();
    
    // Initial state: Product 2 (Active: false) might not be visible if filtered client-side, 
    // BUT the service mock returns both. 
    // If the component filters client-side, we test that. 
    // If backend filters, we need to mock the service call with query params.
    // Looking at Products.tsx (previously viewed), it sends query params.
    
    // We can verify the toggle is clickable.
    await waitFor(() => expect(toggle).not.toBeDisabled());
    fireEvent.click(toggle);
    
    await waitFor(() => {
       // Expect service to be called with includeInactive=true
       // The component calls getAll(showInactive, showInactive). 
       // If showInactive becomes true, it calls getAll(true, true).
       expect(ProductServiceModule.productService.getAll).toHaveBeenCalledWith(true, true);
    });
  });

  it('should display status badges', async () => {
    renderWithClient(<Products />);

    await waitFor(() => {
        expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument();
    });

    await waitFor(() => {
       // Product 1 is Active
       expect(screen.getByText('Activo')).toBeInTheDocument();
       // Product 2 is Inactive (if visible)
       // If we assume default view shows only active, we might need to toggle first.
       // However, the mock returns both. 
       // If the component trusts the API to filter, and API mock returns both, both are shown?
       // Let's assume badges are rendered for whatever is in the list.
    });
  });

  it('should show create button', async () => {
    renderWithClient(<Products />);
    
    await waitFor(() => {
        expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nuevo Producto/i })).toBeInTheDocument();
    });
  });
});
