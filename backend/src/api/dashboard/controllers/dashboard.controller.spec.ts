import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../controllers/dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { User, RoleEnum } from '../../../database/entities/user.entity';
import { AuthGuard } from '../../auth/guards/auth.guard';

describe('DashboardController', () => {
  let controller: DashboardController;

  const mockDashboardService = {
    getStats: jest.fn(),
    getLowStock: jest.fn(),
    getHistory: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    roles: [{ name: RoleEnum.ADMIN }],
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return stats from service', async () => {
      const result = { productCount: 10, totalMovements: 5, role: ['ADMIN'] };
      mockDashboardService.getStats.mockResolvedValue(result);

      expect(await controller.getStats({ user: mockUser })).toBe(result);
      expect(mockDashboardService.getStats).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getLowStock', () => {
    it('should return low stock items from service', async () => {
      const result = [{ id: 1, stock: 2, minStock: 5 }];
      mockDashboardService.getLowStock.mockResolvedValue(result);

      expect(await controller.getLowStock({ user: mockUser })).toBe(result);
      expect(mockDashboardService.getLowStock).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getHistory', () => {
    it('should return history from service', async () => {
      const result = [{ id: 1, type: 'IN' }];
      mockDashboardService.getHistory.mockResolvedValue(result);

      expect(await controller.getHistory({ user: mockUser })).toBe(result);
      expect(mockDashboardService.getHistory).toHaveBeenCalledWith(mockUser);
    });
  });
});
