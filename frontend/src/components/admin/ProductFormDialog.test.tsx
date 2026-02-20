import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductFormDialog } from '../../components/admin/ProductFormDialog';
import { renderWithClient } from '../../test/utils';
import { vi } from 'vitest';
import * as CategoryServiceModule from '../../services/category.service';
import type { Product } from '../../types/api';

// Mock categoryService
vi.spyOn(CategoryServiceModule.categoryService, 'findAll').mockResolvedValue([
  { id: 1, name: 'Computers' },
  { id: 2, name: 'Phones' },
]);

// Mock ProductService
import * as ProductServiceModule from '../../services/product.service';
vi.spyOn(ProductServiceModule.productService, 'create').mockResolvedValue({} as unknown as Product);
vi.spyOn(ProductServiceModule.productService, 'update').mockResolvedValue({} as unknown as Product);

describe('ProductFormDialog', () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(CategoryServiceModule.categoryService, 'findAll').mockResolvedValue([
      { id: 1, name: 'Computers' },
      { id: 2, name: 'Phones' },
    ]);
  });

  it('should render correct title for creation', async () => {
    renderWithClient(
      <ProductFormDialog open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText('Crear Nuevo Producto')).toBeInTheDocument();
  });

  it('should render correct title for editing', async () => {
    const product = {
      id: 1,
      title: 'Test Product',
      code: 'TEST-001',
      categoryId: 1,
      isActive: true,
      description: 'Test Description',
      variationType: 'NONE',
      merchantId: 1,
      createdAt: '',
      updatedAt: '',
    };

    renderWithClient(
      <ProductFormDialog open={true} onOpenChange={onOpenChange} productToEdit={product} />
    );

    expect(screen.getByText('Editar Producto')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    renderWithClient(
      <ProductFormDialog open={true} onOpenChange={onOpenChange} />
    );

    const submitButton = screen.getByRole('button', { name: /Crear Producto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El título es requerido')).toBeInTheDocument();
      expect(screen.getByText('El código es requerido')).toBeInTheDocument();
      expect(screen.getByText('La categoría es requerida')).toBeInTheDocument();
    });
  });
});
