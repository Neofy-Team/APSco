import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../identity/access-tokens';
import { SetInventory } from './dto/inventory';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(AdminGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get(':productId')
  getInventory(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventory.getInventory(productId);
  }

  @Put(':productId')
  setInventory(@Param('productId', ParseUUIDPipe) productId: string, @Body() body: SetInventory) {
    return this.inventory.setInventory(productId, body);
  }
}
