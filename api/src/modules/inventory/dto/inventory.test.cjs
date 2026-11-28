const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ValidationPipe } = require('@nestjs/common');
const { SetInventory } = require('../../../../dist/modules/inventory/dto/inventory');

test('SetInventory validation accepts valid 32-bit stock counts and rejects invalid or extra inputs', async () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const validate = body => pipe.transform(body, { type: 'body', metatype: SetInventory });

  const minValid = await validate({ onHand: 0, version: 1 });
  assert.equal(minValid.onHand, 0);
  assert.equal(minValid.version, 1);

  const maxValid = await validate({ onHand: 2147483647, version: 2147483647 });
  assert.equal(maxValid.onHand, 2147483647);
  assert.equal(maxValid.version, 2147483647);

  for (const body of [
    {},
    [],
    null,
    { onHand: 10 },
    { version: 1 },
    { onHand: -1, version: 1 },
    { onHand: 10, version: 0 },
    { onHand: 10, version: -1 },
    { onHand: 1.5, version: 1 },
    { onHand: 10, version: 1.5 },
    { onHand: '10', version: 1 },
    { onHand: 10, version: '1' },
    { onHand: null, version: 1 },
    { onHand: true, version: 1 },
    { onHand: 2147483648, version: 1 },
    { onHand: 10, version: 2147483648 },
    { onHand: 10, version: 1, extra: true },
    { onHand: 10, version: 1, reserved: 0 },
  ]) {
    await assert.rejects(validate(body), { status: 400 }, JSON.stringify(body));
  }
});
