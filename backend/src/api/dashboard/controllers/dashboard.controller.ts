import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Request() req) {
    return this.dashboardService.getStats(req.user);
  }

  @Get('low-stock')
  async getLowStock(@Request() req) {
    return this.dashboardService.getLowStock(req.user);
  }

  @Get('history')
  async getHistory(@Request() req) {
    return this.dashboardService.getHistory(req.user);
  }
}
