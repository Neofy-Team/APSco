const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { InventoryRepository } = require('../dist/modules/inventory/inventory.repository');
const { ProductsRepository } = require('../dist/modules/products/products.repository');
const { createTestDatabase } = require('./support/postgres.cjs');

test('inventory repository reads, updates with optimistic concurrency, and enforces reserved stock', async t => {
  const database = await createTestDatabase(t);
  await database.migrate('up');
  await database.seedCatalog();
  const { pool } = database;
  const products = new ProductsRepository(pool);
  const inventory = new InventoryRepository(pool);

  const missingId = randomUUID();
  assert.equal(await inventory.getInventory(missingId), undefined);
  assert.deepEqual(await inventory.setInventory(missingId, 10, 1), { reason: 'missing' });

  const product = await products.createProduct({
    subcategoryId: '525a24fe-ae23-46b2-a286-4604b40abfb2',
    slug: 'stock-item',
    sku: 'SKU-STOCK-1',
    name: 'Stock Item',
    description: '',
    price: { amount: 500, currency: 'USD' },
    imageUrls: [],
  });

  const initial = { productId: product.id, onHand: 0, reserved: 0, available: 0, version: 1 };
  assert.deepEqual(await inventory.getInventory(product.id), initial);

  const updated = await inventory.setInventory(product.id, 10, 1);
  assert.deepEqual(updated, {
    inventory: { productId: product.id, onHand: 10, reserved: 0, available: 10, version: 2 },
  });

  assert.deepEqual(await inventory.setInventory(product.id, 20, 1), { reason: 'conflict' });
  assert.deepEqual(await inventory.getInventory(product.id), updated.inventory);

  await pool.query('UPDATE inventory SET reserved = 4 WHERE product_id = $1', [product.id]);
  assert.deepEqual(await inventory.setInventory(product.id, 3, 2), { reason: 'conflict' });
  assert.deepEqual(await inventory.getInventory(product.id), {
    productId: product.id, onHand: 10, reserved: 4, available: 6, version: 2,
  });

  assert.deepEqual(await inventory.setInventory(product.id, 4, 2), {
    inventory: { productId: product.id, onHand: 4, reserved: 4, available: 0, version: 3 },
  });

  const results = await Promise.all([
    inventory.setInventory(product.id, 15, 3),
    inventory.setInventory(product.id, 25, 3),
  ]);
  const successes = results.filter(result => 'inventory' in result);
  const conflicts = results.filter(result => result.reason === 'conflict');
  assert.equal(successes.length, 1);
  assert.equal(conflicts.length, 1);
  assert.deepEqual(await inventory.getInventory(product.id), successes[0].inventory);
});
