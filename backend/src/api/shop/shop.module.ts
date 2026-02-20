import { Module } from '@nestjs/common';
import { ShopService } from './services/shop.service';
import { ShopController } from './controllers/shop.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [InventoryModule, UserModule, AuthModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
