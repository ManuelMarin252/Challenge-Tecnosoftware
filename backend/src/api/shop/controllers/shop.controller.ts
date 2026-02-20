import { Controller, Post, Body, Req } from '@nestjs/common';
import { ShopService, PurchaseItem } from '../services/shop.service';
import { Auth } from '../../auth/guards/auth.decorator';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Auth() // Any authenticated user (Customers included)
  @Post('purchase')
  async purchase(@Req() req: any, @Body() body: { items: PurchaseItem[] }) {
    return this.shopService.purchaseProducts(req.user.id, body.items);
  }
}
