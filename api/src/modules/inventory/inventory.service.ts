import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SetInventory } from './dto/inventory';
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(private readonly inventory: InventoryRepository) {}

  async getInventory(productId: string) {
    const inventory = await this.inventory.getInventory(productId);
    if (!inventory) throw new NotFoundException('Inventory not found');
    return inventory;
  }

  async setInventory(productId: string, { onHand, version }: SetInventory) {
    const result = await this.inventory.setInventory(productId, onHand, version);
    if ('inventory' in result) return result.inventory;
    if (result.reason === 'missing') throw new NotFoundException('Inventory not found');
    throw new ConflictException('Inventory update conflicts with current stock or version');
  }
}
