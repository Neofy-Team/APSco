const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CategoriesRepository } = require('../dist/modules/categories/categories.repository');
const { ProductsRepository } = require('../dist/modules/products/products.repository');
const { createTestDatabase } = require('./support/postgres.cjs');

test('category and product repositories query migrated PostgreSQL with storefront visibility and pagination', async t => {
  const database = await createTestDatabase(t);
  await database.migrate('up');
  await database.seedCatalog();
  const categories = new CategoriesRepository(database.pool);
  const products = new ProductsRepository(database.pool);

  assert.deepEqual(await categories.listCategories(), [
    { slug: 'catalog-test', name: 'Catalog Test' },
    { slug: 'empty-test', name: 'Empty Test' },
  ]);
  assert.equal(await categories.listCategorySubcategories('missing'), null);
  assert.deepEqual(await categories.listCategorySubcategories('empty-test'), []);

  const subcategories = await categories.listCategorySubcategories('catalog-test');
  assert.deepEqual(subcategories, [{
    id: '525a24fe-ae23-46b2-a286-4604b40abfb2',
    slug: 'active-test', name: 'Active Test', categorySlug: 'catalog-test', status: 'active',
  }]);

  const filters = { categorySlug: 'catalog-test', subcategoryId: subcategories[0].id, page: 1, limit: 1 };
  const firstPage = await products.listProducts(filters);
  assert.deepEqual(firstPage.products.map(row => row.slug), ['first']);
  assert.equal(firstPage.totalItems, 2);
  const secondPage = await products.listProducts({ ...filters, page: 2 });
  assert.deepEqual(secondPage.products.map(row => row.slug), ['second']);
  assert.equal(secondPage.totalItems, 2);
  assert.deepEqual(await products.listProducts({ ...filters, page: 3 }), { products: [], totalItems: 2 });
  assert.deepEqual(await products.listProducts({ ...filters, categorySlug: 'empty-test' }), {
    products: [], totalItems: 0,
  });

  const product = await products.getProduct('first');
  assert.deepEqual(product.imageUrls, ['https://example.test/a', 'https://example.test/b']);
  assert.equal(product.priceAmount, '1234');
  assert.equal((await products.getProduct('second')).priceAmount, '9223372036854775807');
  for (const slug of ['draft', 'hidden', 'missing']) {
    assert.equal(await products.getProduct(slug), undefined);
  }
});

test('product creation and image replacement roll back together with their dependent writes', async t => {
  const { pool, migrate, seedCatalog } = await createTestDatabase(t);
  await migrate('up');
  await seedCatalog();
  const products = new ProductsRepository(pool);

  await pool.query('ALTER TABLE inventory ADD CHECK (on_hand > 0)');
  await assert.rejects(products.createProduct({
    subcategoryId: '525a24fe-ae23-46b2-a286-4604b40abfb2', slug: 'failed-create', sku: 'SKU-FAIL',
    name: 'Failed create', description: '', price: { amount: 100, currency: 'USD' }, imageUrls: [],
  }), { code: '23514' });
  assert.equal((await pool.query("SELECT id FROM products WHERE slug = 'failed-create'")).rowCount, 0);

  const original = await products.getProduct('first');
  await pool.query("ALTER TABLE product_images ADD CHECK (url <> 'https://example.test/rejected')");
  await assert.rejects(products.updateProduct(original.id, {
    name: 'Failed update', imageUrls: ['https://example.test/rejected'],
  }), { code: '23514' });
  assert.deepEqual(await products.getProduct('first'), original);
});
