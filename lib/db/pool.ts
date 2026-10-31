import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { normalizePgUrl } from './url';

/**
 * Shared Postgres pool (Neon). Runtime uses the pooled endpoint; migrations
 * use the direct DATABASE_URL (see scripts/db-migrate.ts).
 *
 * Neon free tier scales to zero, so the pool is small and idle connections
 * close quickly (no keep-alive, no background work).
 */
declare global {
  var __soft4uPool: Pool | undefined;
}

function connectionString(): string {
  const url = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL_POOLED / DATABASE_URL is not set');
  return normalizePgUrl(url);
}

function createPool(): Pool {
  return new Pool({
    connectionString: connectionString(),
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
}

export function getPool(): Pool {
  if (!global.__soft4uPool) {
    global.__soft4uPool = createPool();
    global.__soft4uPool.on('error', err => {
      console.error('[db] idle client error:', err.message);
    });
  }
  return global.__soft4uPool;
}

/** Run a parameterised query and return the rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query<T>(text, params as unknown[]);
  return res.rows;
}

/** First row or null. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Run `fn` inside a transaction (BEGIN / COMMIT, ROLLBACK on throw). */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback failure, surface the original error
    }
    throw err;
  } finally {
    client.release();
  }
}
