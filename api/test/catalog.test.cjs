const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ValidationPipe } = require('@nestjs/common');
const { CategoriesService } = require('../dist/modules/categories/categories.service');
const { ProductsService } = require('../dist/modules/products/products.service');
const { ListProductsQuery } = require('../dist/modules/products/dto/list-products-query');

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

test('catalog service returns configured categories and distinguishes empty and unknown categories', async () => {
  const categories = [{ slug: 'catalog-test', name: 'Catalog Test' }];
  const service = new CategoriesService({
    listCategories: async () => categories,
    listCategorySubcategories: async slug => slug === 'catalog-test' ? [] : null,
  });

  assert.deepEqual(await service.listCategories(), categories);
  assert.deepEqual(await service.listCategorySubcategories('catalog-test'), []);
  await assert.rejects(service.listCategorySubcategories('missing'), { status: 404 });
});

test('catalog service maps products and preserves pagination totals', async () => {
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

test('catalog service rejects the planned management view before querying products', async () => {
  const service = new ProductsService({
    listProducts: async () => assert.fail('Management query reached the repository'),
  });
  await assert.rejects(service.listProducts({ view: 'all', page: 1, limit: 20 }), { status: 401 });
});

test('catalog service finds products by slug, maps missing products, and serializes full bigint prices', async () => {
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

test('product query validation coerces pagination and rejects invalid or unknown inputs', async () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const validate = query => pipe.transform(query, { type: 'query', metatype: ListProductsQuery });

  const defaults = await validate({});
  assert.equal(defaults.page, 1);
  assert.equal(defaults.limit, 20);
  assert.equal(defaults.view, 'published');

  const valid = await validate({
    page: '2', limit: '100', categorySlug: 'catalog-test',
    subcategoryId: '525a24fe-ae23-46b2-a286-4604b40abfb2',
  });
  assert.equal(valid.page, 2);
  assert.equal(valid.limit, 100);

  for (const query of [
    { page: '0' }, { page: '1.5' }, { page: '9007199254740992' },
    { limit: '101' }, { limit: ['1', '2'] }, { categorySlug: 'Invalid' },
    { subcategoryId: 'invalid' }, { view: 'hidden' }, { unknown: 'value' },
  ]) {
    await assert.rejects(validate(query), { status: 400 }, JSON.stringify(query));
  }
});
