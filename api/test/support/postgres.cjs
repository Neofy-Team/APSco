const { randomUUID } = require('node:crypto');
const { execFile } = require('node:child_process');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { promisify } = require('node:util');
const { Pool } = require('pg');

const execFileAsync = promisify(execFile);
const apiDir = join(__dirname, '../..');

async function createTestDatabase(t) {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) throw new Error('Set TEST_DATABASE_URL to a PostgreSQL database for this suite');

  const schema = `apsco_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new Pool({ connectionString: testUrl, connectionTimeoutMillis: 5000 });
  const config = new URL(testUrl);
  config.searchParams.set('options', `-c search_path=${schema}`);
  const url = config.toString();
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000 });
  let schemaCreated = false;

  t.after(async () => {
    try {
      await pool.end();
      if (schemaCreated) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    } finally {
      await admin.end();
    }
  });

  await admin.query(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;

  return {
    schema,
    url,
    pool,
    migrate: (direction) => execFileAsync(process.execPath, ['scripts/migrate.cjs', direction], {
      cwd: apiDir,
      env: { ...process.env, DATABASE_URL: url },
      timeout: 15_000,
    }),
    seedCatalog: async () => {
      const fixture = await readFile(join(__dirname, 'catalog.sql'), 'utf8');
      await pool.query(fixture);
    },
  };
}

module.exports = { createTestDatabase };
