import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from '../../database/entities/inventory.entity';
import { InventoryMovement } from '../../database/entities/inventory-movement.entity';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryService } from './services/inventory.service';
import { StockListener } from './listeners/stock.listener';
import { AuditListener } from './listeners/audit.listener';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, InventoryMovement]),
    UserModule,
    AuthModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, StockListener, AuditListener],
  exports: [InventoryService],
})
export class InventoryModule {}
