import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Body,
  Req,
  Query,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { UpdateStockDto } from '../dto/update-stock.dto';
import { Auth } from '../../auth/guards/auth.decorator';
import { RoleIds } from '../../role/enum/role.enum';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getAllInventory(@Query('includeInactive') includeInactive?: string) {
    return this.inventoryService.findAll(includeInactive === 'true');
  }

  @Get(':productId')
  async getInventory(@Param('productId', ParseIntPipe) productId: number) {
    return this.inventoryService.findOneByProduct(productId);
  }

  @Patch(':productId')
  async updateStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: UpdateStockDto,
  ) {
    return this.inventoryService.updateStock(productId, body.change);
  }
  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Patch(':productId/replenish')
  async replenishStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: { quantity: number; reason: string },
    @Req() req: any,
  ) {
    return this.inventoryService.replenishStock(
      productId,
      body.quantity,
      body.reason,
      req.user.id,
    );
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Get(':productId/history')
  async getHistory(@Param('productId', ParseIntPipe) productId: number) {
    return this.inventoryService.getHistory(productId);
  }
}
