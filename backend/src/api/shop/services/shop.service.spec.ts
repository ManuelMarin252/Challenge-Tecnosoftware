import { Test, TestingModule } from '@nestjs/testing';
import { ShopService } from './shop.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { DataSource, QueryRunner } from 'typeorm';

describe('ShopService', () => {
  let service: ShopService;
  let inventoryService: InventoryService;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {},
    } as unknown as QueryRunner;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopService,
        {
          provide: InventoryService,
          useValue: {
            reduceStock: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<ShopService>(ShopService);
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('purchaseProducts', () => {
    it('should successfully purchase products and commit transaction', async () => {
      const userId = 1;
      const items = [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ];

      (inventoryService.reduceStock as jest.Mock).mockResolvedValue({
        id: 1,
        stock: 5,
      });

      const result = await service.purchaseProducts(userId, items);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(inventoryService.reduceStock).toHaveBeenCalledTimes(2);
      expect(inventoryService.reduceStock).toHaveBeenCalledWith(
        1,
        2,
        userId,
        0,
      );
      expect(inventoryService.reduceStock).toHaveBeenCalledWith(
        2,
        1,
        userId,
        0,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should rollback transaction if an error occurs', async () => {
      const userId = 1;
      const items = [{ productId: 1, quantity: 2 }];

      (inventoryService.reduceStock as jest.Mock).mockRejectedValue(
        new Error('Insufficient stock'),
      );

      await expect(service.purchaseProducts(userId, items)).rejects.toThrow(
        'Insufficient stock',
      );

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(inventoryService.reduceStock).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
