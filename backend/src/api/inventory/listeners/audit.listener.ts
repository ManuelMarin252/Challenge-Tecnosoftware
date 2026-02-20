import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InventoryMovement,
  InventoryMovementType,
} from '../../../database/entities/inventory-movement.entity';
import { StockReplenishedEvent } from '../events/stock-replenished.event';
import { ProductSoldEvent } from '../events/product-sold.event';

@Injectable()
export class AuditListener {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
  ) {}

  @OnEvent('stock.replenished')
  async handleStockReplenished(payload: StockReplenishedEvent) {
    console.log(
      `[AuditListener] Recording replenishment for product ${payload.productId}`,
    );

    const movement = this.movementRepository.create({
      productId: payload.productId,
      quantity: payload.quantity,
      type: InventoryMovementType.IN,
      reason: payload.reason,
      userId: payload.userId,
    });

    await this.movementRepository.save(movement);
  }

  @OnEvent('product.sold')
  async handleProductSold(payload: ProductSoldEvent) {
    console.log(
      `[AuditListener] Recording sale for product ${payload.productId}`,
    );

    const movement = this.movementRepository.create({
      productId: payload.productId,
      quantity: payload.quantity,
      type: InventoryMovementType.OUT,
      reason: `Sale (Total: $${payload.totalAmount})`,
      userId: payload.userId,
    });

    await this.movementRepository.save(movement);
  }
}
