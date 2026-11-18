const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CatalogRepository } = require('../dist/modules/catalog/catalog.repository');
const { createTestDatabase } = require('./support/postgres.cjs');

test('catalog repository queries migrated PostgreSQL with storefront visibility and pagination', async t => {
  const database = await createTestDatabase(t);
  await database.migrate('up');
  await database.seedCatalog();
  const catalog = new CatalogRepository(database.pool);

  assert.deepEqual(await catalog.listCategories(), [
    { slug: 'catalog-test', name: 'Catalog Test' },
    { slug: 'empty-test', name: 'Empty Test' },
  ]);
  assert.equal(await catalog.listCategorySubcategories('missing'), null);
  assert.deepEqual(await catalog.listCategorySubcategories('empty-test'), []);

  const subcategories = await catalog.listCategorySubcategories('catalog-test');
  assert.deepEqual(subcategories, [{
    id: '525a24fe-ae23-46b2-a286-4604b40abfb2',
    slug: 'active-test', name: 'Active Test', categorySlug: 'catalog-test', status: 'active',
  }]);

  const filters = { categorySlug: 'catalog-test', subcategoryId: subcategories[0].id, page: 1, limit: 1 };
  const firstPage = await catalog.listProducts(filters);
  assert.deepEqual(firstPage.products.map(row => row.slug), ['first']);
  assert.equal(firstPage.totalItems, 2);
  const secondPage = await catalog.listProducts({ ...filters, page: 2 });
  assert.deepEqual(secondPage.products.map(row => row.slug), ['second']);
  assert.equal(secondPage.totalItems, 2);
  assert.deepEqual(await catalog.listProducts({ ...filters, page: 3 }), { products: [], totalItems: 2 });
  assert.deepEqual(await catalog.listProducts({ ...filters, categorySlug: 'empty-test' }), {
    products: [], totalItems: 0,
  });

  const product = await catalog.getProduct('first');
  assert.deepEqual(product.imageUrls, ['https://example.test/a', 'https://example.test/b']);
  assert.equal(product.priceAmount, '1234');
  assert.equal((await catalog.getProduct('second')).priceAmount, '9223372036854775807');
  for (const slug of ['draft', 'hidden', 'missing']) {
    assert.equal(await catalog.getProduct(slug), undefined);
  }
});
