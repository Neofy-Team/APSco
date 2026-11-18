const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTestDatabase } = require('./support/postgres.cjs');

const expectedTables = [
  'accounts', 'cart_items', 'carts', 'categories', 'inventory', 'order_items', 'orders',
  'payments', 'product_images', 'products', 'schema_migrations', 'shipments', 'subcategories',
];

async function tables({ pool, schema }) {
  const { rows } = await pool.query(
    'SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename', [schema],
  );
  return rows.map(row => row.tablename);
}

test('migration applies once, rolls back and reapplies with the legacy history key', async t => {
  const database = await createTestDatabase(t);
  const { pool, migrate } = database;

  assert.match((await migrate('down')).stdout, /No migrations to roll back/);
  await Promise.all([migrate('up'), migrate('up')]);
  assert.deepEqual(await tables(database), expectedTables);
  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  assert.deepEqual(rows, [{ name: '0001_commerce_schema.sql' }]);

  await migrate('down');
  assert.deepEqual(await tables(database), ['schema_migrations']);
  assert.equal((await pool.query('SELECT * FROM schema_migrations')).rowCount, 0);
  await migrate('up');
  assert.deepEqual(await tables(database), expectedTables);
});

test('migration rollback failure preserves all tables and history', async t => {
  const database = await createTestDatabase(t);
  const { pool, migrate } = database;
  await migrate('up');
  await pool.query('CREATE TABLE rollback_blocker (account_id uuid REFERENCES accounts (id))');

  await assert.rejects(migrate('down'), /cannot drop table accounts/);
  assert.deepEqual(await tables(database), [...expectedTables, 'rollback_blocker'].sort());
  assert.equal((await pool.query('SELECT * FROM schema_migrations')).rowCount, 1);
});

test('migration rejects checksum drift for both directions', async t => {
  const { pool, migrate } = await createTestDatabase(t);
  await migrate('up');
  await pool.query("UPDATE schema_migrations SET checksum = 'changed'");
  await assert.rejects(migrate('up'), /Applied migration changed/);
  await assert.rejects(migrate('down'), /Applied migration changed/);
  assert.equal((await pool.query('SELECT * FROM accounts')).rowCount, 0);
});

test('commerce constraints protect accounts, stock, checkout snapshots, and payment attempts', async t => {
  const { pool, migrate, seedCatalog } = await createTestDatabase(t);
  await migrate('up');
  await seedCatalog();

  const { rows: [{ id: accountId }] } = await pool.query(
    "INSERT INTO accounts (email, name, password_hash) VALUES ('Buyer@example.test', 'Buyer', 'test-hash') RETURNING id",
  );
  await assert.rejects(pool.query(
    "INSERT INTO accounts (email, name, password_hash) VALUES ('buyer@example.test', 'Duplicate', 'test-hash')",
  ), { code: '23505' });
  await assert.rejects(pool.query(
    "INSERT INTO subcategories (category_slug, slug, name) VALUES ('missing', 'invalid', 'Invalid')",
  ), { code: '23503' });

  const { rows: [{ id: productId }] } = await pool.query("SELECT id FROM products WHERE slug = 'first'");
  const { rows: [{ available }] } = await pool.query(
    'INSERT INTO inventory (product_id, on_hand, reserved) VALUES ($1, 4, 2) RETURNING available', [productId],
  );
  assert.equal(available, 2);
  await assert.rejects(pool.query('UPDATE inventory SET on_hand = 1 WHERE product_id = $1', [productId]), {
    code: '23514',
  });
  await pool.query('INSERT INTO carts (account_id) VALUES ($1)', [accountId]);
  await assert.rejects(pool.query(
    'INSERT INTO cart_items (account_id, product_id, quantity) VALUES ($1, $2, 0)', [accountId, productId],
  ), { code: '23514' });

  const checkout = `INSERT INTO orders (
      customer_id, idempotency_key, request_hash, currency, subtotal_amount, tax_amount,
      shipping_amount, shipping_option_code, shipping_option_name, recipient_name,
      phone, address_line1, city, country_code, payment_due_at
    ) VALUES ($1, 'test-key', decode(repeat('aa', 32), 'hex'), 'USD', 2000, 100, 300,
      'standard', 'Standard', 'Buyer', '5550100', '1 Test Street', 'Test City', 'US', now() + interval '15 minutes')
    RETURNING id, total_amount`;
  const { rows: [{ id: orderId, total_amount: total }] } = await pool.query(checkout, [accountId]);
  assert.equal(total, '2400');
  await assert.rejects(pool.query(checkout, [accountId]), { code: '23505' });

  const item = await pool.query(
    `INSERT INTO order_items (order_id, product_id, sku, name, quantity, unit_price_amount)
     VALUES ($1, $2, 'SKU-FIRST', 'First', 2, 1000) RETURNING line_total_amount`,
    [orderId, productId],
  );
  assert.equal(item.rows[0].line_total_amount, '2000');

  await pool.query("INSERT INTO payments (order_id, provider) VALUES ($1, 'test')", [orderId]);
  await assert.rejects(pool.query("INSERT INTO payments (order_id, provider) VALUES ($1, 'test')", [orderId]), {
    code: '23505',
  });
  await pool.query("UPDATE payments SET status = 'failed' WHERE order_id = $1", [orderId]);
  await pool.query("INSERT INTO payments (order_id, provider) VALUES ($1, 'test')", [orderId]);

  const shipment = "INSERT INTO shipments (order_id, carrier, tracking_number) VALUES ($1, 'Carrier', 'TRACK-01')";
  await pool.query(shipment, [orderId]);
  await assert.rejects(pool.query(shipment, [orderId]), { code: '23505' });
});
