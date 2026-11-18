// Each migration runs in a transaction. Never edit an applied migration.
require('dotenv/config');
const { Pool } = require('pg');
const { readdir, readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { createHash } = require('node:crypto');

const folder = join(__dirname, '../src/database/migrations');

async function findUpFiles() {
  const files = new Map();
  for (const file of await readdir(folder)) {
    if (!file.endsWith('.sql') || file.endsWith('.down.sql')) continue;
    // Preserve the history key used by migrations that previously ended in .sql.
    const name = file.replace(/\.up\.sql$/, '.sql');
    if (files.has(name)) throw new Error(`Duplicate up migration: ${name}`);
    files.set(name, file);
  }
  return files;
}

async function readUpFile(file) {
  const sql = await readFile(join(folder, file), 'utf8');
  return { sql, checksum: createHash('sha256').update(sql).digest('hex') };
}

function verifyChecksum(name, expected, actual) {
  if (expected !== actual) throw new Error(`Applied migration changed: ${name}`);
}

async function runInTransaction(client, action) {
  await client.query('BEGIN');
  try {
    await action();
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function applyMigrations(client, files) {
  for (const name of [...files.keys()].sort()) {
    const { sql, checksum } = await readUpFile(files.get(name));
    const { rows: [applied] } = await client.query(
      'SELECT checksum FROM schema_migrations WHERE name = $1', [name],
    );
    if (applied) {
      verifyChecksum(name, applied.checksum, checksum);
      continue;
    }
    await runInTransaction(client, async () => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
    });
    console.log(`Applied ${name}`);
  }
}

async function revertMigration(client, files) {
  const { rows: [applied] } = await client.query(
    'SELECT name, checksum FROM schema_migrations ORDER BY applied_at DESC, name DESC LIMIT 1',
  );
  if (!applied) {
    console.log('No migrations to roll back');
    return;
  }

  const { name } = applied;
  const upFile = files.get(name);
  if (!upFile) throw new Error(`Up migration missing for ${name}`);
  const { checksum } = await readUpFile(upFile);
  verifyChecksum(name, applied.checksum, checksum);

  const downFile = name.replace(/\.sql$/, '.down.sql');
  const sql = await readFile(join(folder, downFile), 'utf8');
  await runInTransaction(client, async () => {
    await client.query(sql);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [name]);
  });
  console.log(`Rolled back ${name}`);
}

async function migrate() {
  const direction = process.argv[2] ?? 'up';
  if (!['up', 'down'].includes(direction) || process.argv.length > 3) {
    throw new Error('Usage: node scripts/migrate.cjs [up|down]');
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT pg_advisory_lock(73482610)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const files = await findUpFiles();
    if (direction === 'down') await revertMigration(client, files);
    else await applyMigrations(client, files);
  } finally {
    if (client) {
      try { await client.query('SELECT pg_advisory_unlock(73482610)'); }
      finally { client.release(); }
    }
    await pool.end();
  }
}
migrate().catch(error => { console.error(error); process.exitCode = 1; });
