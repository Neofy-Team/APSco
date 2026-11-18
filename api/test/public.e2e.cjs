const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTestDatabase } = require('./support/postgres.cjs');

test('public HTTP routes serve real catalog data and reject invalid or hidden requests', async t => {
  const database = await createTestDatabase(t);
  await database.migrate('up');
  await database.seedCatalog();

  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = database.url;
  t.after(() => {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  });

  const { createApp } = require('../dist/create-app');
  const app = await createApp();
  t.after(() => app.close());
  await app.listen(0, '127.0.0.1');
  const root = `${await app.getUrl()}/api/v1`;

  async function get(path, expected = 200) {
    const response = await fetch(root + path);
    assert.equal(response.status, expected, path);
    return response;
  }

  assert.deepEqual(await (await get('/health/live')).json(), { status: 'ok' });
  assert.deepEqual(await (await get('/health/ready')).json(), { status: 'ok' });
  assert.deepEqual((await (await get('/categories')).json()).map(row => row.slug), ['catalog-test', 'empty-test']);
  assert.deepEqual(await (await get('/categories/empty-test/subcategories')).json(), []);
  await (await get('/categories/missing/subcategories', 404)).json();

  const subcategories = await (await get('/categories/catalog-test/subcategories')).json();
  assert.deepEqual(subcategories.map(row => row.slug), ['active-test']);
  const id = subcategories[0].id;
  const page = await (await get(`/products?categorySlug=catalog-test&subcategoryId=${id}&limit=1`)).json();
  assert.deepEqual(page.page, { number: 1, limit: 1, totalItems: 2 });
  assert.deepEqual(page.items.map(product => product.slug), ['first']);
  assert.deepEqual(page.items[0].price, { amount: 1234, currency: 'USD' });
  assert.deepEqual(page.items[0].imageUrls, ['https://example.test/a', 'https://example.test/b']);
  assert.equal(Object.hasOwn(page.items[0], 'sku'), false);
  assert.deepEqual(await (await get('/products?page=10')).json(), {
    items: [], page: { number: 10, limit: 20, totalItems: 2 },
  });

  for (const path of ['/products?limit=101', '/products?subcategoryId=invalid', '/products?unknown=value']) {
    const error = await (await get(path, 400)).json();
    assert.equal(error.statusCode, 400);
  }
  await (await get('/products?view=all', 401)).json();
  await (await get('/products/by-slug/draft', 404)).json();
  await (await get('/products/by-slug/hidden', 404)).json();
  assert.deepEqual(await (await get('/products/by-slug/first')).json(), page.items[0]);
  assert.match(await (await get('/products/by-slug/second')).text(), /"amount":9223372036854775807,/);
});
