import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { InventoryController } from './inventory.controller';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';

@Module({
  imports: [IdentityModule],
  controllers: [InventoryController],
  providers: [InventoryRepository, InventoryService],
})
export class InventoryModule {}
