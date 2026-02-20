import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StockUpdatedEvent } from '../events/stock-updated.event';
import { StockLowEvent } from '../events/stock-low.event';

@Injectable()
export class StockListener {
  private readonly logger = new Logger(StockListener.name);

  @OnEvent('product.stock.updated')
  handleStockUpdatedEvent(event: StockUpdatedEvent) {
    this.logger.log(
      `Stock updated for Product ${event.productId}: ${event.oldStock} -> ${event.newStock}`,
    );
  }

  @OnEvent('product.stock.low')
  handleStockLowEvent(event: StockLowEvent) {
    this.logger.warn(
      `LOW STOCK ALERT! Product ${event.productId} is at ${event.currentStock} (Min: ${event.minStock})`,
    );
  }
}
