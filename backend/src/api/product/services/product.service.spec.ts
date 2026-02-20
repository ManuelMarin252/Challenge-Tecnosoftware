import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { successObject } from 'src/common/helper/sucess-response.interceptor';
import {
  Categories,
  Category,
  CategoryIds,
} from 'src/database/entities/category.entity';
import { Product, VariationTypes } from 'src/database/entities/product.entity';
import { errorMessages } from 'src/errors/custom';
import { EntityManager } from 'typeorm';
import { ProductDetailsDto } from '../dto/product.dto';
import { ComputerDetails } from '../dto/productDetails/computer.details';
import { ProductService } from './product.service';

// Fully mock the entities to prevent loading their relationships
jest.mock('src/database/entities/product.entity', () => ({
  Product: class Product {
    isActive: boolean;
    title: string;
    category: any;
  },
  VariationTypes: { NONE: 'NONE' },
}));

jest.mock('src/database/entities/category.entity', () => ({
  Category: class Category {},
  Categories: { Computers: 'Computers' },
  CategoryIds: { Computers: 1 },
}));

jest.mock('src/database/entities/user.entity', () => ({
  User: class User {},
}));

// Also mock relative paths just in case
jest.mock('../../../database/entities/product.entity', () => ({
  Product: class Product {
    isActive: boolean;
    title: string;
    category: any;
  },
  VariationTypes: { NONE: 'NONE' },
}));

jest.mock('../../../database/entities/category.entity', () => ({
  Category: class Category {},
  Categories: { Computers: 'Computers' },
  CategoryIds: { Computers: 1 },
}));

jest.mock('../../../database/entities/user.entity', () => ({
  User: class User {},
}));

describe('ProductService', () => {
  let service: ProductService;
  let fakeEntityManager: Partial<EntityManager>;
  const computersCategory = {
    id: CategoryIds.Computers,
    name: Categories.Computers,
  } as Category;

  const testProduct = {
    id: 1,
    title: 'test title',
    category: computersCategory,
    merchantId: 1,
  } as Product;

  const computerDetails: ComputerDetails = {
    category: Categories.Computers,
    capacity: 2,
    capacityUnit: 'TB',
    capacityType: 'HD',
    brand: 'Dell',
    series: 'XPS',
  };

  const productDetails: ProductDetailsDto = {
    details: computerDetails,
    about: ['about 1'],
    description: 'test description',
    code: 'test UPC code',
    title: 'test title',
    variationType: VariationTypes.NONE,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Create a robust mock that supports chaining by default
    const mockQueryBuilder: any = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1, raw: [] }),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    fakeEntityManager = {
      findOne: jest.fn().mockResolvedValue(computersCategory),
      find: jest.fn(),
      save: jest.fn().mockImplementation((data) => data),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn().mockResolvedValue(testProduct),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getEntityManagerToken(),
          useValue: fakeEntityManager,
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);

    // Mock validate method of the service if it's public, OR mock module.
    // Since validate is a method on the service in the analysis above (lines 105-115),
    // we can spy on it!
    jest.spyOn(service, 'validate').mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProduct: get product by id', () => {
    it('should throw not found product', async () => {
      fakeEntityManager.findOne = jest.fn().mockResolvedValue(null);
      const result = service.getProduct(1);

      expect(fakeEntityManager.findOne).toBeCalled();
      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should success', async () => {
      fakeEntityManager.findOne = jest.fn().mockResolvedValue(testProduct);
      const result = await service.getProduct(1);
      expect(fakeEntityManager.findOne).toBeCalled();
      expect(result.id).toBe(testProduct.id);
    });
  });

  describe('createProduct: create initial inActive product', () => {
    it('should throw not found category', async () => {
      fakeEntityManager.findOne = jest.fn().mockResolvedValue(null);
      const result = service.createProduct(
        {
          categoryId: 1,
          title: 'test title',
          code: 'test-code',
          description: 'test description',
        },
        1,
      );

      expect(fakeEntityManager.findOne).toBeCalled();
      expect(result).rejects.toThrowError(
        errorMessages.category.notFound.message,
      );
    });

    it('should success', async () => {
      const result = await service.createProduct(
        {
          categoryId: 1,
          title: 'test title',
          code: 'test-code',
          description: 'test description',
        },
        1,
      );

      expect(fakeEntityManager.findOne).toBeCalled();
      expect(fakeEntityManager.create).toBeCalled();
      expect(result.id).toBe(testProduct.id);
    });
  });

  describe('addProductDetails: add product details by updating exising product', () => {
    it('should throw not found product', async () => {
      const qbMock: any = fakeEntityManager.createQueryBuilder();
      qbMock.execute.mockResolvedValueOnce({ affected: 0, raw: [] });

      const result = service.addProductDetails(1, productDetails, 1);

      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should success', async () => {
      const qbMock: any = fakeEntityManager.createQueryBuilder();
      qbMock.execute.mockResolvedValueOnce({ affected: 1, raw: [testProduct] });

      const result = await service.addProductDetails(1, productDetails, 1);

      expect(fakeEntityManager.createQueryBuilder).toBeCalled();
      expect(qbMock.update).toBeCalled();
      expect(result.id).toBe(testProduct.id);
    });
  });

  describe('activateProduct: activate Product if its info is fulfilled', () => {
    it('should throw not found product', async () => {
      // Mock validate to throw NotFoundException as if product wasn't found
      jest
        .spyOn(service, 'validate')
        .mockRejectedValueOnce(
          new NotFoundException(errorMessages.product.notFound),
        );

      const result = service.activateProduct(1, 1);

      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should throw error if product not fulfilled', async () => {
      // Mock validate to return errors
      jest
        .spyOn(service, 'validate')
        .mockResolvedValueOnce([
          { constraints: { isNotEmpty: 'error' } },
        ] as any);

      const result = service.activateProduct(1, 1);

      expect(result).rejects.toThrowError(
        errorMessages.product.notFulfilled.message,
      );
    });

    it('should success', async () => {
      const returnedActiveProduct = {
        id: 1,
        isActive: true,
      };

      // validate is already mocked to return [] in beforeEach

      const qbMock: any = fakeEntityManager.createQueryBuilder();
      qbMock.execute.mockResolvedValueOnce({
        affected: 1,
        raw: [returnedActiveProduct],
      });

      const result = await service.activateProduct(1, 1);

      expect(fakeEntityManager.createQueryBuilder).toBeCalled();
      expect(qbMock.update).toBeCalled();
      expect(result.id).toBe(returnedActiveProduct.id);
      expect(result.isActive).toBe(true);
    });
  });

  describe('deleteProduct: delete product by id', () => {
    it('should throw not found product', async () => {
      // Mock softDelete to return affected: 0
      fakeEntityManager.softDelete = jest
        .fn()
        .mockResolvedValue({ affected: 0, raw: [] });

      const result = service.deleteProduct(1, 1);

      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should success', async () => {
      // Mock softDelete to return affected: 1
      fakeEntityManager.softDelete = jest
        .fn()
        .mockResolvedValue({ affected: 1, raw: [] });

      const result = await service.deleteProduct(1, 1);

      expect(fakeEntityManager.softDelete).toBeCalledWith(Product, {
        id: 1,
        merchantId: 1,
      });
      expect(result.message).toBe(successObject.message);
    });
  });

  describe('restoreProduct: restore product by id', () => {
    it('should throw not found product', async () => {
      fakeEntityManager.restore = jest
        .fn()
        .mockResolvedValue({ affected: 0, raw: [] });

      const result = service.restoreProduct(1, 1);

      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should success', async () => {
      fakeEntityManager.restore = jest
        .fn()
        .mockResolvedValue({ affected: 1, raw: [] });

      const result = await service.restoreProduct(1, 1);

      expect(fakeEntityManager.restore).toBeCalledWith(Product, {
        id: 1,
        merchantId: 1,
      });
      expect(result.message).toBe(successObject.message);
    });
  });

  describe('deactivateProduct: deactivate product by id', () => {
    it('should throw not found product', async () => {
      const qbMock: any = fakeEntityManager.createQueryBuilder();
      qbMock.execute.mockResolvedValueOnce({ affected: 0, raw: [] });

      const result = service.deactivateProduct(1, 1);

      expect(result).rejects.toThrowError(
        errorMessages.product.notFound.message,
      );
    });

    it('should success', async () => {
      const qbMock: any = fakeEntityManager.createQueryBuilder();
      qbMock.execute.mockResolvedValueOnce({ affected: 1, raw: [] });

      const result = await service.deactivateProduct(1, 1);

      expect(fakeEntityManager.createQueryBuilder).toBeCalled();
      expect(qbMock.update).toBeCalled();
      expect(qbMock.set).toHaveBeenCalledWith({ isActive: false });
      expect(result.message).toBe(successObject.message);
    });
  });

  describe('findAll: get all products', () => {
    it('should return active products only by default', async () => {
      const qbMock: any = fakeEntityManager.createQueryBuilder();
      qbMock.getMany.mockResolvedValue([testProduct]);

      const result = await service.findAll();

      expect(fakeEntityManager.createQueryBuilder).toBeCalled();
      expect(qbMock.where).toHaveBeenCalledWith(
        'product.isActive = :isActive',
        { isActive: true },
      );
      expect(result).toEqual([testProduct]);
    });

    it('should return all products when includeInactive is true', async () => {
      const qbMock: any = fakeEntityManager.createQueryBuilder();
      qbMock.getMany.mockResolvedValue([testProduct]);

      const result = await service.findAll(true);

      expect(fakeEntityManager.createQueryBuilder).toBeCalled();
      // Only verifying that we DON'T filter by active is basic,
      // strict check: where IS NOT called with isActive=true
      expect(qbMock.where).not.toHaveBeenCalledWith(
        'product.isActive = :isActive',
        { isActive: true },
      );
      expect(result).toEqual([testProduct]);
    });

    it('should include deleted products when includeDeleted is true', async () => {
      const qbMock: any = fakeEntityManager.createQueryBuilder();
      qbMock.getMany.mockResolvedValue([testProduct]);
      qbMock.withDeleted = jest.fn().mockReturnThis();

      const result = await service.findAll(true, true);

      expect(fakeEntityManager.createQueryBuilder).toBeCalled();
      expect(qbMock.withDeleted).toHaveBeenCalled();
      expect(result).toEqual([testProduct]);
    });
  });
});
