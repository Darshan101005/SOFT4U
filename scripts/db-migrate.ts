/**
 * Applies SQL files from db/migrations in name order, once each.
 * Uses the direct (non-pooled) DATABASE_URL. Bun loads .env.local itself.
 *
 *   bun run db:migrate
 */
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { normalizePgUrl } from '../lib/db/url';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const client = new Client({ connectionString: normalizePgUrl(url) });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    const applied = new Set(
      (await client.query<{ name: string }>('SELECT name FROM schema_migrations')).rows.map(r => r.name),
    );

    const dir = path.join(process.cwd(), 'db', 'migrations');
    const files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = readFileSync(path.join(dir, file), 'utf8');
      console.log(`applying ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`${file} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log(count === 0 ? 'database is up to date' : `applied ${count} migration(s)`);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
