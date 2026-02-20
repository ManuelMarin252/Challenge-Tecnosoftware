import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../../../database/entities/category.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CategoryService', () => {
  let service: CategoryService;
  // let repository: Repository<Category>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    // repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto = { id: 1, name: 'Test' };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockResolvedValue(dto);

      const result = await service.create(dto);
      expect(result).toEqual(dto);
    });

    it('should throw ConflictException if exists', async () => {
      const dto = { id: 1, name: 'Test' };
      mockRepository.findOne.mockResolvedValue(dto);
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const category = { id: 1, name: 'Old' };
      mockRepository.findOne.mockResolvedValue(category);
      mockRepository.save.mockResolvedValue({ id: 1, name: 'New' });

      const result = await service.update(1, 'New');
      expect(result.name).toBe('New');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.update(1, 'New')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      const result = await service.delete(1);
      expect(result).toBeUndefined();
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.delete(1)).rejects.toThrow(NotFoundException);
    });
  });
});
