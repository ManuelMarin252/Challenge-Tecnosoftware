import { Test, TestingModule } from '@nestjs/testing';
import { AuditListener } from './audit.listener';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryMovement } from '../../../database/entities/inventory-movement.entity';
import { StockReplenishedEvent } from '../events/stock-replenished.event';
import { ProductSoldEvent } from '../events/product-sold.event';

// Mock entities
jest.mock('../../../database/entities/inventory-movement.entity', () => ({
  InventoryMovement: class InventoryMovement {},
  InventoryMovementType: { IN: 'IN', OUT: 'OUT' },
}));

describe('AuditListener', () => {
  let listener: AuditListener;

  const mockMovementRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditListener,
        {
          provide: getRepositoryToken(InventoryMovement),
          useValue: mockMovementRepository,
        },
      ],
    }).compile();

    listener = module.get<AuditListener>(AuditListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleStockReplenished', () => {
    it('should save an IN movement', async () => {
      const event = new StockReplenishedEvent(1, 10, 99, 'Restock');
      mockMovementRepository.create.mockReturnValue({ ...event, type: 'IN' });
      mockMovementRepository.save.mockResolvedValue({
        id: 1,
        ...event,
        type: 'IN',
      });

      await listener.handleStockReplenished(event);

      expect(mockMovementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 1,
          quantity: 10,
          type: 'IN',
          reason: 'Restock',
          userId: 99,
        }),
      );
      expect(mockMovementRepository.save).toHaveBeenCalled();
    });
  });

  describe('handleProductSold', () => {
    it('should save an OUT movement', async () => {
      const event = new ProductSoldEvent(1, 2, 99, 500);
      mockMovementRepository.create.mockReturnValue({ ...event, type: 'OUT' });
      mockMovementRepository.save.mockResolvedValue({
        id: 2,
        ...event,
        type: 'OUT',
      });

      await listener.handleProductSold(event);

      expect(mockMovementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 1,
          quantity: 2,
          type: 'OUT',
          reason: expect.stringContaining('Sale'),
          userId: 99,
        }),
      );
      expect(mockMovementRepository.save).toHaveBeenCalled();
    });
  });
});
