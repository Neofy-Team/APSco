const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateEnvironment } = require('../dist/config/environment');
const { HealthController } = require('../dist/modules/health/health.controller');

test('configuration rejects missing database, invalid port and wildcard origin', () => {
  assert.throws(() => validateEnvironment({}));
  assert.throws(() => validateEnvironment({ DATABASE_URL: 'postgresql://localhost/db', PORT: 0 }));
  assert.throws(() => validateEnvironment({ DATABASE_URL: 'postgresql://localhost/db', CORS_ORIGINS: '*' }));
  assert.equal(validateEnvironment({ DATABASE_URL: 'postgresql://localhost/db' }).PORT, 3001);
});
test('readiness checks the database and maps failure to 503', async () => {
  const healthy = new HealthController({ query: async sql => assert.equal(sql, 'SELECT 1') });
  assert.deepEqual(await healthy.ready(), { status: 'ok' });
  const failed = new HealthController({ query: async () => { throw new Error('private connection details'); } });
  await assert.rejects(failed.ready(), error => error.getStatus() === 503 && !error.message.includes('private'));
});

test('configuration parses allowed origins and rejects invalid environment values', () => {
  const databaseUrl = 'postgresql://localhost/db';
  const environment = validateEnvironment({
    DATABASE_URL: databaseUrl,
    PORT: '4300',
    NODE_ENV: 'test',
    CORS_ORIGINS: 'http://localhost:3000, https://example.test',
  });
  assert.equal(environment.DATABASE_URL, databaseUrl);
  assert.equal(environment.PORT, 4300);
  assert.equal(environment.NODE_ENV, 'test');
  assert.deepEqual(environment.CORS_ORIGINS, ['http://localhost:3000', 'https://example.test']);
  assert.throws(() => validateEnvironment({ DATABASE_URL: 'mysql://localhost/db' }), /PostgreSQL URL/);
  assert.throws(() => validateEnvironment({ DATABASE_URL: databaseUrl, NODE_ENV: 'invalid' }), /NODE_ENV/);
  assert.throws(() => validateEnvironment({
    DATABASE_URL: databaseUrl, CORS_ORIGINS: 'https://example.test/path',
  }), /exact HTTP origins/);
  assert.equal(validateEnvironment({
    DATABASE_URL: 'postgresql://localhost/db', CHECKOUT_CURRENCY: 'USD',
  }).CHECKOUT_CURRENCY, 'USD');
  assert.throws(() => validateEnvironment({
    DATABASE_URL: 'postgresql://localhost/db', CHECKOUT_CURRENCY: 'usd',
  }), /Invalid CHECKOUT_CURRENCY/);
});

test('liveness does not query PostgreSQL', () => {
  const health = new HealthController({ query: () => assert.fail('Liveness queried PostgreSQL') });
  assert.deepEqual(health.live(), { status: 'ok' });
});
