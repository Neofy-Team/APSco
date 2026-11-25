const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash, randomBytes, randomUUID } = require('node:crypto');
const { createTestDatabase } = require('./support/postgres.cjs');

const activeSubcategory = '525a24fe-ae23-46b2-a286-4604b40abfb2';
const archivedSubcategory = 'e30a7069-711e-4f96-a1ed-e7b2cd05a066';

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

test('admin catalog HTTP operations enforce access, validate input, and persist changes', async t => {
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
    return { json: JSON.parse(raw), raw, headers: response.headers };
  }

  const manage = (method, path, status, body) => request(method, path, status, { token: admin.token, body });

  await t.test('admin routes require a valid bearer token from an admin account', async () => {
    const id = randomUUID();
    for (const [method, path] of [
      ['GET', '/subcategories'], ['POST', '/subcategories'], ['PATCH', `/subcategories/${id}`],
      ['GET', '/products?view=all'], ['GET', `/products/${id}`], ['POST', '/products'],
      ['PATCH', `/products/${id}`],
    ]) {
      const { headers } = await request(method, path, 401);
      assert.equal(headers.get('www-authenticate'), 'Bearer realm="catalog"');
      assert.equal(headers.get('access-control-expose-headers'), 'WWW-Authenticate');
      await request(method, path, 403, { token: customer.token });
    }
    for (const token of ['malformed', randomBytes(32).toString('base64url'), expired.token]) {
      for (const path of ['/products?view=all', '/subcategories']) {
        const { headers } = await request('GET', path, 401, { token });
        assert.equal(headers.get('www-authenticate'), 'Bearer realm="catalog", error="invalid_token"');
      }
    }
    const { json } = await request('GET', '/products', 200, { token: customer.token });
    assert.deepEqual(json.items.map(product => product.slug), ['first', 'second']);
    assert.equal(Object.hasOwn(json.items[0], 'sku'), false);
  });

  await t.test('subcategories can be listed, created, updated, archived and reactivated', async () => {
    const { json: page } = await manage('GET', '/subcategories?categorySlug=catalog-test&limit=1&page=2', 200);
    assert.deepEqual(page.page, { number: 2, limit: 1, totalItems: 2 });
    assert.deepEqual(page.items.map(({ slug, status }) => ({ slug, status })), [
      { slug: 'archived-test', status: 'archived' },
    ]);
    const { json: empty } = await manage('GET', '/subcategories?categorySlug=catalog-test&page=5', 200);
    assert.deepEqual(empty, { items: [], page: { number: 5, limit: 20, totalItems: 2 } });
    await manage('GET', '/subcategories?limit=0', 400);
    await manage('GET', '/subcategories?subcategoryId=unexpected', 400);

    const body = { categorySlug: 'empty-test', slug: 'active-test', name: '☀️'.repeat(60) };
    await manage('POST', '/subcategories', 400, { ...body, categorySlug: 'unknown' });
    await manage('POST', '/subcategories', 400, { ...body, status: 'archived' });
    await manage('POST', '/subcategories', 400, { ...body, name: '☀️'.repeat(61) });
    const { json: subcategory } = await manage('POST', '/subcategories', 201, body);
    assert.deepEqual(subcategory, { ...body, id: subcategory.id, status: 'active' });
    await manage('POST', '/subcategories', 409, body);
    assert.deepEqual((await request('GET', '/categories/empty-test/subcategories', 200)).json, [subcategory]);

    for (const patch of [
      {}, [], { slug: null }, { status: 'draft' }, { categorySlug: 'catalog-test' }, { name: '☀️'.repeat(61) },
    ]) {
      await manage('PATCH', `/subcategories/${subcategory.id}`, 400, patch);
    }
    await manage('PATCH', '/subcategories/invalid', 400, { name: 'Rename' });
    await manage('PATCH', `/subcategories/${randomUUID()}`, 404, { name: 'Rename' });
    await manage('PATCH', `/subcategories/${activeSubcategory}`, 409, { slug: 'archived-test' });
    assert.deepEqual((await manage('PATCH', `/subcategories/${subcategory.id}`, 200, {
      slug: 'new-slug', name: 'Renamed', status: 'archived',
    })).json, { ...subcategory, slug: 'new-slug', name: 'Renamed', status: 'archived' });
    assert.deepEqual((await request('GET', '/categories/empty-test/subcategories', 200)).json, []);
    await manage('PATCH', `/subcategories/${subcategory.id}`, 200, { status: 'active' });
  });

  await t.test('products can be managed across states with stock, price and ordered images', async () => {
    const { json: hiddenPage } = await manage('GET',
      `/products?view=all&categorySlug=catalog-test&subcategoryId=${archivedSubcategory}`, 200);
    assert.equal(hiddenPage.page.totalItems, 1);
    assert.deepEqual(hiddenPage.items.map(({ slug, sku, status }) => ({ slug, sku, status })), [
      { slug: 'hidden', sku: 'SKU-HIDDEN', status: 'published' },
    ]);
    const { json: all } = await manage('GET', '/products?view=all&limit=1', 200);
    assert.equal(all.page.totalItems, 4);
    assert.equal(all.items.length, 1);
    await manage('GET', `/products/${randomUUID()}`, 404);
    await manage('GET', '/products/invalid', 400);

    const body = {
      subcategoryId: activeSubcategory, slug: 'new-product', sku: '☀️'.repeat(32), name: '☀️'.repeat(100),
      description: '', price: { amount: 100, currency: 'USD' },
      imageUrls: ['https://example.test/second', 'data:image/png;base64,dGVzdA=='],
    };
    const overlongFields = [{ name: '☀️'.repeat(101) }, { description: '☀️'.repeat(5001) }, { sku: '☀️'.repeat(33) }];
    for (const fields of overlongFields) await manage('POST', '/products', 400, { ...body, ...fields });
    for (const invalid of [
      { ...body, status: 'published' }, { ...body, subcategoryId: randomUUID() },
      { ...body, imageUrls: ['//example.test/image'] }, { ...body, price: null },
      { ...body, price: [body.price] }, { ...body, price: { amount: '100', currency: 'USD' } },
      { ...body, price: { amount: 1.5, currency: 'USD' } },
      { ...body, price: { amount: 100, currency: 'EUR' } },
      { ...body, price: { amount: 100, currency: 'USD', extra: true } },
      JSON.stringify(body).replace('"amount":100', '"amount":9223372036854775808'),
      JSON.stringify(body).replace('"amount":100', '"amount":9007199254740991.1'),
    ]) await manage('POST', '/products', 400, invalid);

    const { json: created } = await manage('POST', '/products', 201, body);
    assert.deepEqual(created, { ...body, id: created.id, categorySlug: 'catalog-test', status: 'draft' });
    const path = `/products/${created.id}`;
    assert.deepEqual((await manage('GET', path, 200)).json, created);
    const { rows } = await pool.query('SELECT on_hand, reserved, version FROM inventory WHERE product_id = $1', [created.id]);
    assert.deepEqual(rows, [{ on_hand: 0, reserved: 0, version: 1 }]);
    await manage('POST', '/products', 409, { ...body, sku: 'SKU-OTHER' });
    await manage('POST', '/products', 409, { ...body, slug: 'other-slug' });
    await request('GET', '/products/by-slug/new-product', 404);

    for (const patch of [{}, [], { price: null }, { imageUrls: null }, { status: 'active' },
      { subcategoryId: randomUUID() }, { subcategoryId: archivedSubcategory, status: 'published' }, ...overlongFields]) {
      await manage('PATCH', path, 400, patch);
    }
    await manage('PATCH', `/products/${randomUUID()}`, 404, { name: 'Missing' });
    await manage('PATCH', path, 409, { slug: 'first', imageUrls: [] });
    await manage('PATCH', path, 409, { sku: 'SKU-FIRST' });
    assert.deepEqual((await manage('GET', path, 200)).json, created);

    const { raw } = await manage('PATCH', path, 200,
      '{"price":{"amount":9223372036854775807,"currency":"USD"}}');
    assert.match(raw, /"amount":9223372036854775807,/);
    assert.match((await manage('GET', path, 200)).raw, /"amount":9223372036854775807,/);

    await Promise.all([
      manage('PATCH', path, 200, { name: 'Renamed product', description: 'Updated description' }),
      manage('PATCH', path, 200, { imageUrls: ['https://example.test/replacement'] }),
    ]);
    const { json: published } = await manage('PATCH', path, 200, { status: 'published' });
    assert.equal(published.name, 'Renamed product');
    assert.equal(published.description, 'Updated description');
    assert.deepEqual(published.imageUrls, ['https://example.test/replacement']);
    await manage('PATCH', path, 400, { subcategoryId: archivedSubcategory });
    const storefrontPath = '/products/by-slug/new-product';
    const { json: storefront } = await request('GET', storefrontPath, 200);
    assert.equal(Object.hasOwn(storefront, 'sku'), false);
    assert.equal(Object.hasOwn(storefront, 'status'), false);

    await manage('PATCH', `/subcategories/${activeSubcategory}`, 200, { status: 'archived' });
    await request('GET', storefrontPath, 404);
    assert.equal((await manage('GET', path, 200)).json.status, 'published');
    await manage('PATCH', `/subcategories/${activeSubcategory}`, 200, { status: 'active' });
    await request('GET', storefrontPath, 200);

    const { json: archived } = await manage('PATCH', path, 200, {
      subcategoryId: archivedSubcategory, imageUrls: [], status: 'archived',
    });
    assert.equal(archived.subcategoryId, archivedSubcategory);
    assert.equal(archived.status, 'archived');
    assert.deepEqual(archived.imageUrls, []);
    await request('GET', storefrontPath, 404);
  });

  await pool.query("UPDATE accounts SET role = 'customer' WHERE id = $1", [admin.id]);
  await manage('GET', '/subcategories', 403);
  await pool.query('DELETE FROM accounts WHERE id = $1', [admin.id]);
  await manage('GET', '/subcategories', 401);
});
