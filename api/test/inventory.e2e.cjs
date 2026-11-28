const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash, randomBytes, randomUUID } = require('node:crypto');
const { createTestDatabase } = require('./support/postgres.cjs');

const activeSubcategory = '525a24fe-ae23-46b2-a286-4604b40abfb2';

async function issueToken(pool, role, expiresAt) {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest();
  const { rows: [{ id }] } = await pool.query(
    'INSERT INTO accounts (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
    [`${randomUUID()}@example.test`, role, 'test-hash', role],
  );
  await pool.query('INSERT INTO account_access_tokens VALUES ($1, $2, $3)', [hash, id, expiresAt]);
  return { token, id };
}

test('inventory HTTP endpoints enforce access, validate inputs, and persist optimistic stock updates', async t => {
  const database = await createTestDatabase(t);
  await database.migrate('up');
  await database.seedCatalog();
  const { pool } = database;
  const future = new Date(Date.now() + 60 * 60_000);
  const admin = await issueToken(pool, 'admin', future);
  const customer = await issueToken(pool, 'customer', future);
  const expired = await issueToken(pool, 'admin', new Date(0));

  const origin = 'https://admin.example.test';
  const config = { DATABASE_URL: database.url, CHECKOUT_CURRENCY: 'USD', CORS_ORIGINS: origin };
  for (const [key, value] of Object.entries(config)) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
  const { createApp } = require('../dist/create-app');
  const app = await createApp();
  t.after(() => app.close());
  await app.listen(0, '127.0.0.1');
  const root = `${await app.getUrl()}/api/v1`;

  async function request(method, path, status, { token, body } = {}) {
    const headers = { Origin: origin };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(root + path, {
      method, headers, body: typeof body === 'string' ? body : JSON.stringify(body),
    });
    const raw = await response.text();
    assert.equal(response.status, status, `${method} ${path}: ${raw}`);
    return { json: JSON.parse(raw), headers: response.headers };
  }

  const manage = (method, path, status, body) => request(method, path, status, { token: admin.token, body });

  await t.test('inventory routes require a valid admin bearer token', async () => {
    const id = randomUUID();
    for (const [method, path, body] of [
      ['GET', `/inventory/${id}`, undefined],
      ['PUT', `/inventory/${id}`, { onHand: 1, version: 1 }],
    ]) {
      const { headers } = await request(method, path, 401, { body });
      assert.equal(headers.get('www-authenticate'), 'Bearer realm="catalog"');
      await request(method, path, 403, { token: customer.token, body });

      for (const token of ['malformed', randomBytes(32).toString('base64url'), expired.token]) {
        const invalid = await request(method, path, 401, { token, body });
        assert.equal(invalid.headers.get('www-authenticate'), 'Bearer realm="catalog", error="invalid_token"');
      }
    }
  });

  await t.test('inventory routes validate productId and SetInventory payloads and return 404 when missing', async () => {
    await manage('GET', '/inventory/not-a-uuid', 400);
    await manage('PUT', '/inventory/not-a-uuid', 400, { onHand: 1, version: 1 });

    const missingId = randomUUID();
    await manage('GET', `/inventory/${missingId}`, 404);
    await manage('PUT', `/inventory/${missingId}`, 404, { onHand: 1, version: 1 });

    const { json: product } = await manage('POST', '/products', 201, {
      subcategoryId: activeSubcategory,
      slug: 'inventory-validation-item',
      sku: 'SKU-INV-VAL',
      name: 'Validation Item',
      description: '',
      price: { amount: 100, currency: 'USD' },
      imageUrls: [],
    });

    for (const invalid of [
      {},
      [],
      { onHand: 5 },
      { version: 1 },
      { onHand: -1, version: 1 },
      { onHand: 5, version: 0 },
      { onHand: 1.5, version: 1 },
      { onHand: '5', version: 1 },
      { onHand: 2147483648, version: 1 },
      { onHand: 5, version: 2147483648 },
      { onHand: 5, version: 1, extra: true },
    ]) {
      await manage('PUT', `/inventory/${product.id}`, 400, invalid);
    }
  });

  await t.test('inventory reads across product statuses, updates stock atomically, and guards reserved stock', async () => {
    const { json: product } = await manage('POST', '/products', 201, {
      subcategoryId: activeSubcategory,
      slug: 'inventory-flow-item',
      sku: 'SKU-INV-FLOW',
      name: 'Flow Item',
      description: '',
      price: { amount: 250, currency: 'USD' },
      imageUrls: [],
    });
    const path = `/inventory/${product.id}`;

    assert.deepEqual((await manage('GET', path, 200)).json, {
      productId: product.id, onHand: 0, reserved: 0, available: 0, version: 1,
    });

    assert.deepEqual((await manage('PUT', path, 200, { onHand: 10, version: 1 })).json, {
      productId: product.id, onHand: 10, reserved: 0, available: 10, version: 2,
    });

    await manage('PUT', path, 409, { onHand: 15, version: 1 });
    assert.deepEqual((await manage('GET', path, 200)).json, {
      productId: product.id, onHand: 10, reserved: 0, available: 10, version: 2,
    });

    await pool.query('UPDATE inventory SET reserved = 4 WHERE product_id = $1', [product.id]);
    await manage('PUT', path, 409, { onHand: 3, version: 2 });
    assert.deepEqual((await manage('GET', path, 200)).json, {
      productId: product.id, onHand: 10, reserved: 4, available: 6, version: 2,
    });

    assert.deepEqual((await manage('PUT', path, 200, { onHand: 6, version: 2 })).json, {
      productId: product.id, onHand: 6, reserved: 4, available: 2, version: 3,
    });

    await manage('PATCH', `/products/${product.id}`, 200, { status: 'published' });
    assert.equal((await manage('GET', path, 200)).json.version, 3);
    await manage('PATCH', `/products/${product.id}`, 200, { status: 'archived' });
    assert.deepEqual((await manage('PUT', path, 200, { onHand: 4, version: 3 })).json, {
      productId: product.id, onHand: 4, reserved: 4, available: 0, version: 4,
    });
  });
});
