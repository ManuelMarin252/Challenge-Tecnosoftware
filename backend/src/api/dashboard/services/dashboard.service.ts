import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../../../database/entities/inventory.entity';
import { InventoryMovement } from '../../../database/entities/inventory-movement.entity';
import { Product } from '../../../database/entities/product.entity';
import { User, RoleEnum } from '../../../database/entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryMovement)
    private movementRepository: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getStats(user: User) {
    const roles = user.roles.map((r) => r.name.toLowerCase());
    const isAdmin = roles.includes(RoleEnum.ADMIN);
    const isMerchant = roles.includes(RoleEnum.MERCHANT);

    // Total Products
    let productCount = 0;
    if (isAdmin || isMerchant) {
      // Merchants also see global active products now
      productCount = await this.productRepository.count({
        where: isAdmin ? {} : { isActive: true },
      });
    } else {
      productCount = await this.productRepository.count({
        where: { isActive: true },
      });
    }

    // Common query builder for movements
    const getMovementsQuery = (type: 'IN' | 'OUT') => {
      const query = this.movementRepository
        .createQueryBuilder('movement')
        .leftJoin('movement.product', 'product')
        .where('movement.type = :type', { type });

      if (!isAdmin && !isMerchant) {
        // Only Customers are restricted to their own movements
        query.andWhere('movement.userId = :userId', { userId: user.id });
      }
      return query;
    };

    // Sales Stats
    const salesStats = await getMovementsQuery('OUT')
      .select('COUNT(movement.id)', 'totalOrders')
      .addSelect('SUM(movement.quantity)', 'totalVentas')
      .getRawOne();

    const totalOrders = parseInt(salesStats.totalOrders, 10) || 0;
    const totalVentas = parseInt(salesStats.totalVentas, 10) || 0;

    // Movement History logic for charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const getDailyData = async (type: 'IN' | 'OUT') => {
      const raw = await getMovementsQuery(type)
        .andWhere('movement.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
        .select("DATE_TRUNC('day', movement.createdAt)", 'date')
        .addSelect('SUM(movement.quantity)', 'count')
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany();

      return raw.map((d) => ({
        date: new Date(d.date).toLocaleDateString(),
        count: parseInt(d.count, 10) || 0,
      }));
    };

    const salesData = await getDailyData('OUT');
    const purchaseData = await getDailyData('IN');

    return {
      productCount,
      totalMovements: totalOrders, // Backward compatibility
      totalVentas,
      totalOrders,
      salesData,
      purchaseData,
      role: roles,
    };
  }

  async getLowStock(user: User) {
    const roles = user.roles.map((r) => r.name.toLowerCase());
    const isAdmin = roles.includes(RoleEnum.ADMIN);
    const isMerchant = roles.includes(RoleEnum.MERCHANT);

    if (!isAdmin && !isMerchant) {
      return [];
    }

    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.stock <= inventory.minStock')
      .andWhere('product.isActive = :isActive', { isActive: true });

    return query.getMany();
  }

  async getHistory(user: User) {
    const roles = user.roles.map((r) => r.name.toLowerCase());
    const isAdmin = roles.includes(RoleEnum.ADMIN);
    const isMerchant = roles.includes(RoleEnum.MERCHANT);

    let query = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.user', 'user')
      .orderBy('movement.createdAt', 'DESC')
      .take(50); // Limit to last 50

    if (!isAdmin && !isMerchant) {
      query = query.where('movement.userId = :userId', { userId: user.id });
    }

    return query.getMany();
  }
}
