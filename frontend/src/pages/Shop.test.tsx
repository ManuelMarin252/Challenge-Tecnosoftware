/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Shop } from '../pages/Shop';
import { renderWithClient } from '../test/utils';
import { vi } from 'vitest';
import * as ShopServiceModule from '../services/shop.service';

// Mock Services
const mockInventory = [
  {
    id: 1,
    productId: 1,
    stock: 10,
    minStock: 5,
    product: {
      id: 1,
      title: 'Test Product',
      imageUrls: [],
      price: 100, // Assuming price exists in type or we mock it
      description: 'Desc',
      category: { name: 'Cat', id: 1, createdAt: '', updatedAt: '' },
      code: 'code',
      variationType: 'NONE',
      isActive: true,
      categoryId: 1,
      merchantId: 1,
      createdAt: '',
      updatedAt: '',
      details: {}
    }
  }
];

vi.spyOn(ShopServiceModule.shopService, 'getProducts').mockResolvedValue(mockInventory as unknown as any);
const purchaseSpy = vi.spyOn(ShopServiceModule.shopService, 'purchase').mockResolvedValue(undefined);

describe('Shop Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ShopServiceModule.shopService, 'getProducts').mockResolvedValue(mockInventory as unknown as any);
    vi.spyOn(ShopServiceModule.shopService, 'purchase').mockResolvedValue(undefined);
  });

  it('should render shop items', async () => {
    renderWithClient(<Shop />);

    await waitFor(() => {
        expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('10 en stock')).toBeInTheDocument();
    });
  });

  it('should handle quantity selection', async () => {
    // const user = userEvent.setup(); // Unused if we use fireEvent
    renderWithClient(<Shop />);

    await waitFor(() => {
        expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const input = await screen.findByRole('spinbutton', { name: /Cantidad/i });
    expect(input).toHaveValue(1);

    const plusBtn = screen.getByRole('button', { name: /Incrementar cantidad/i });
    
    fireEvent.click(plusBtn);
    
    await waitFor(() => {
        expect(input).toHaveValue(2);
    });
  });

  it('should call purchase with correct quantity', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    renderWithClient(<Shop />);

    await waitFor(() => {
        expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: /Comprar/i });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(purchaseSpy).toHaveBeenCalledWith([
        { productId: 1, quantity: 1 }
      ]);
    });
  });
});
