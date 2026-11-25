const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CategoriesService } = require('../../../dist/modules/categories/categories.service');

test('categories service returns configured categories and distinguishes empty and unknown categories', async () => {
  const categories = [{ slug: 'catalog-test', name: 'Catalog Test' }];
  const service = new CategoriesService({
    listCategories: async () => categories,
    listCategorySubcategories: async slug => slug === 'catalog-test' ? [] : null,
  });

  assert.deepEqual(await service.listCategories(), categories);
  assert.deepEqual(await service.listCategorySubcategories('catalog-test'), []);
  await assert.rejects(service.listCategorySubcategories('missing'), { status: 404 });
});
