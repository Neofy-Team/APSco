// Each migration runs in a transaction. Never edit an applied migration.
require('dotenv/config');
const { Pool } = require('pg');
const { readdir, readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { createHash } = require('node:crypto');

async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT pg_advisory_lock(73482610)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const folder = join(__dirname, '../src/database/migrations');
    const files = (await readdir(folder)).filter(f => f.endsWith('.sql')).sort();
    for (const name of files) {
      const sql = await readFile(join(folder, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const { rows } = await client.query('SELECT checksum FROM schema_migrations WHERE name = $1', [name]);
      if (rows.length) {
        if (rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
        await client.query('COMMIT');
        console.log(`Applied ${name}`);
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } finally {
    if (client) {
      try { await client.query('SELECT pg_advisory_unlock(73482610)'); }
      finally { client.release(); }
    }
    await pool.end();
  }
}
migrate().catch(error => { console.error(error); process.exitCode = 1; });
