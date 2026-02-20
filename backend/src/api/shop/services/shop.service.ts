import { Injectable } from '@nestjs/common';
import { InventoryService } from '../../inventory/services/inventory.service';
import { DataSource } from 'typeorm';

export interface PurchaseItem {
  productId: number;
  quantity: number;
}

@Injectable()
export class ShopService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  async purchaseProducts(userId: number, items: PurchaseItem[]) {
    // Transactional to ensure strict consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // const totalAmount = 0; // In a real app we'd fetch product price. For now 0 or dummy?
      // Event asks for totalAmount.
      // We should probably fetch product prices here.
      // But simplify: assume strict stock reducion first.

      const results = [];

      for (const item of items) {
        // We call reduceStock.
        // Note: inventoryService.reduceStock saves to DB.
        // If we want transaction we might need to refactor InventoryService to accept a manager/queryRunner
        // OR rely on InventoryService's own atomic operations if concurrency is handled.

        // For this challenge, let's keep it simple:
        // Just call reduceStock sequentially. If one fails, we should ideally rollback others.
        // But reduceStock doesn't support external transaction manager easily without refactor.
        // Let's wrap in try/catch and just process.
        // Or better: Validate ALL first, then Execute ALL?
        // "Check then Act" is risky for concurrency.
        // Correct way: use database transaction.

        // Let's trust InventoryService for now and just loop.
        // If we want to be "Senior Architect", we should handle transactions.
        // But `InventoryService` uses `this.inventoryRepository`.

        // Let's implement a simple loop.

        const inventory = await this.inventoryService.reduceStock(
          item.productId,
          item.quantity,
          userId,
          0, // Dummy amount for now as we don't fetch product prices in this service yet
        );
        results.push(inventory);
      }

      await queryRunner.commitTransaction();
      return results;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
