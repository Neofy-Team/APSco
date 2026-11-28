const { test } = require('node:test');
const assert = require('node:assert/strict');
const { InventoryService } = require('../../../dist/modules/inventory/inventory.service');

const row = {
  productId: '11111111-1111-4111-8111-111111111111',
  onHand: 12,
  reserved: 3,
  available: 9,
  version: 2,
};

test('inventory service returns stock and maps missing inventory to 404', async () => {
  const service = new InventoryService({
    getInventory: async productId => (productId === row.productId ? row : undefined),
  });

  assert.deepEqual(await service.getInventory(row.productId), row);
  await assert.rejects(service.getInventory('22222222-2222-4222-8222-222222222222'), { status: 404 });
});

test('inventory service updates stock and maps missing or conflicting updates', async () => {
  const service = new InventoryService({
    setInventory: async (productId, onHand, version) => {
      assert.equal(onHand, 20);
      assert.equal(version, 2);
      if (productId === row.productId) {
        return { inventory: { ...row, onHand: 20, available: 17, version: 3 } };
      }
      if (productId === '22222222-2222-4222-8222-222222222222') {
        return { reason: 'missing' };
      }
      return { reason: 'conflict' };
    },
  });

  assert.deepEqual(await service.setInventory(row.productId, { onHand: 20, version: 2 }), {
    ...row, onHand: 20, available: 17, version: 3,
  });
  await assert.rejects(
    service.setInventory('22222222-2222-4222-8222-222222222222', { onHand: 20, version: 2 }),
    { status: 404 },
  );
  await assert.rejects(
    service.setInventory('33333333-3333-4333-8333-333333333333', { onHand: 20, version: 2 }),
    { status: 409 },
  );
});
