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
