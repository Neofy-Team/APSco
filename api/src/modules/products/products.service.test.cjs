const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ProductsService } = require('../../../dist/modules/products/products.service');

const product = {
  id: 'product-id',
  subcategoryId: 'subcategory-id',
  categorySlug: 'catalog-test',
  slug: 'first',
  name: 'First',
  description: '',
  priceAmount: '1234',
  currency: 'USD',
  imageUrls: [],
};

const expectedProduct = {
  id: 'product-id',
  subcategoryId: 'subcategory-id',
  categorySlug: 'catalog-test',
  slug: 'first',
  name: 'First',
  description: '',
  price: { amount: 1234, currency: 'USD' },
  imageUrls: [],
};

test('products service maps products and preserves pagination totals', async () => {
  const query = { view: 'published', page: 2, limit: 10, categorySlug: 'catalog-test' };
  const service = new ProductsService({
    listProducts: async filters => {
      assert.deepEqual(filters, query);
      return { products: [product], totalItems: 11 };
    },
  });

  assert.deepEqual(await service.listProducts(query), {
    items: [expectedProduct],
    page: { number: 2, limit: 10, totalItems: 11 },
  });
});

test('products service includes SKU and status in the management view', async () => {
  const service = new ProductsService({
    listProducts: async () => ({
      products: [{ ...product, sku: 'SKU-FIRST', status: 'draft' }], totalItems: 1,
    }),
  });
  assert.deepEqual(await service.listProducts({ view: 'all', page: 1, limit: 20 }), {
    items: [{ ...expectedProduct, sku: 'SKU-FIRST', status: 'draft' }],
    page: { number: 1, limit: 20, totalItems: 1 },
  });
});

test('products service finds products by slug, maps missing products, and serializes full bigint prices', async () => {
  const service = new ProductsService({
    getProduct: async slug => {
      if (slug === 'first') return product;
      if (slug === 'large-price') return { ...product, slug, priceAmount: '9223372036854775807' };
    },
  });

  assert.deepEqual(await service.getProduct('first'), expectedProduct);
  await assert.rejects(service.getProduct('missing'), { status: 404 });
  assert.match(JSON.stringify(await service.getProduct('large-price')), /"amount":9223372036854775807,/);
});
