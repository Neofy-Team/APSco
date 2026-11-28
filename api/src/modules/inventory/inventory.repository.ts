import { Injectable } from '@nestjs/common';
import { Database } from '../../database/database.module';

export type InventoryRow = {
  productId: string;
  onHand: number;
  reserved: number;
  available: number;
  version: number;
};

export type SetInventoryResult =
  | { inventory: InventoryRow }
  | { reason: 'missing' | 'conflict' };

const inventoryColumns = 'product_id AS "productId", on_hand AS "onHand", reserved, available, version';

@Injectable()
export class InventoryRepository {
  constructor(private readonly database: Database) {}

  async getInventory(productId: string): Promise<InventoryRow | undefined> {
    const { rows: [inventory] } = await this.database.query<InventoryRow>(
      `SELECT ${inventoryColumns} FROM inventory WHERE product_id = $1`,
      [productId],
    );
    return inventory;
  }

  async setInventory(productId: string, onHand: number, version: number): Promise<SetInventoryResult> {
    const { rows: [updated] } = await this.database.query<InventoryRow>(
      `UPDATE inventory
       SET on_hand = $2, version = version + 1
       WHERE product_id = $1 AND version = $3 AND $2 >= reserved
       RETURNING ${inventoryColumns}`,
      [productId, onHand, version],
    );
    if (updated) return { inventory: updated };

    const { rowCount } = await this.database.query(
      'SELECT 1 FROM inventory WHERE product_id = $1',
      [productId],
    );
    return { reason: rowCount ? 'conflict' : 'missing' };
  }
}
