import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../../../database/entities/inventory.entity';
import { InventoryMovement } from '../../../database/entities/inventory-movement.entity';

import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { ProductCreatedEvent } from '../../product/events/product-created.event';
import { StockUpdatedEvent } from '../events/stock-updated.event';
import { StockLowEvent } from '../events/stock-low.event';
import { StockChangedEvent } from '../events/stock-changed.event';
import { StockReplenishedEvent } from '../events/stock-replenished.event';
import { ProductSoldEvent } from '../events/product-sold.event';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findOneByProduct(productId: number): Promise<Inventory | null> {
    return this.inventoryRepository.findOne({ where: { productId } });
  }

  async findAll(includeInactive = false): Promise<Inventory[]> {
    const where: any = {};

    if (!includeInactive) {
      where.product = {
        isActive: true,
      };
    }

    return this.inventoryRepository.find({
      relations: ['product'],
      where,
    });
  }

  async createInventory(productId: number): Promise<Inventory> {
    const inventory = this.inventoryRepository.create({
      productId,
      stock: 0,
      minStock: 5,
    });
    return this.inventoryRepository.save(inventory);
  }

  @OnEvent('product.created')
  async handleProductCreatedEvent(payload: ProductCreatedEvent) {
    console.log(
      `[InventoryService] Creating inventory for product ${payload.productId}`,
    );
    await this.createInventory(payload.productId);
  }

  async setStock(productId: number, quantity: number): Promise<Inventory> {
    const inventory = await this.findOneByProduct(productId);
    if (!inventory) {
      return this.createAndSetStock(productId, quantity);
    }

    const oldStock = inventory.stock;
    inventory.stock = quantity;
    const updatedInventory = await this.inventoryRepository.save(inventory);

    this.eventEmitter.emit(
      'product.stock.updated',
      new StockUpdatedEvent(productId, oldStock, quantity),
    );

    this.checkStockLow(updatedInventory);

    return updatedInventory;
  }

  async updateStock(productId: number, change: number): Promise<Inventory> {
    const inventory = await this.findOneByProduct(productId);
    if (!inventory) {
      throw new NotFoundException(
        `Inventory for product ${productId} not found`,
      );
    }

    const oldStock = inventory.stock;
    const newStock = oldStock + change;

    if (newStock < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    inventory.stock = newStock;
    const updatedInventory = await this.inventoryRepository.save(inventory);

    this.eventEmitter.emit(
      'stock.changed',
      new StockChangedEvent(productId, newStock, oldStock),
    );

    this.checkStockLow(updatedInventory);

    return updatedInventory;
  }

  async replenishStock(
    productId: number,
    quantity: number,
    reason: string,
    userId: number,
  ): Promise<Inventory> {
    const inventory = await this.findOneByProduct(productId);
    if (!inventory) {
      // Ideally we should create it, but for now let's reuse createAndSetStock logic or just throw if product doesn't exist?
      // Business logic: Replenish implies adding to existing or initializing.
      return this.createAndSetStock(productId, quantity);
    }

    const oldStock = inventory.stock;
    const newStock = oldStock + quantity;

    inventory.stock = newStock;
    const updatedInventory = await this.inventoryRepository.save(inventory);

    this.eventEmitter.emit(
      'stock.replenished',
      new StockReplenishedEvent(productId, quantity, userId, reason),
    );

    // Also emit stock.changed for consistency if we want general listeners to react
    this.eventEmitter.emit(
      'stock.changed',
      new StockChangedEvent(productId, newStock, oldStock),
    );

    return updatedInventory;
  }

  async reduceStock(
    productId: number,
    quantity: number,
    userId: number,
    totalAmount: number,
  ): Promise<Inventory> {
    const inventory = await this.findOneByProduct(productId);
    if (!inventory) {
      throw new NotFoundException(
        `Inventory for product ${productId} not found`,
      );
    }

    if (inventory.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const oldStock = inventory.stock;
    const newStock = oldStock - quantity;

    inventory.stock = newStock;
    const updatedInventory = await this.inventoryRepository.save(inventory);

    this.eventEmitter.emit(
      'product.sold',
      new ProductSoldEvent(productId, quantity, userId, totalAmount),
    );

    this.eventEmitter.emit(
      'stock.changed',
      new StockChangedEvent(productId, newStock, oldStock),
    );

    this.checkStockLow(updatedInventory);

    return updatedInventory;
  }

  private checkStockLow(inventory: Inventory) {
    if (inventory.stock <= inventory.minStock) {
      this.eventEmitter.emit(
        'product.stock.low',
        new StockLowEvent(
          inventory.productId,
          inventory.stock,
          inventory.minStock,
        ),
      );
    }
  }

  private async createAndSetStock(
    productId: number,
    quantity: number,
  ): Promise<Inventory> {
    const inventory = this.inventoryRepository.create({
      productId,
      stock: quantity,
      minStock: 5,
    });
    const saved = await this.inventoryRepository.save(inventory);
    // Initial creation can be seen as replenished?
    // Let's keep it simple.
    return saved;
  }
  async getHistory(productId: number): Promise<InventoryMovement[]> {
    return this.movementRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }
}
