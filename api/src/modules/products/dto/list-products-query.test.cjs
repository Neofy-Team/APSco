const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ValidationPipe } = require('@nestjs/common');
const { ListProductsQuery } = require('../../../../dist/modules/products/dto/list-products-query');

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
