const { Pool, Client } = require('pg');
require('dotenv').config();

// ---------------------------------------------------------------------------
// Supabase / PostgreSQL connection with a thin mysql2-compatible wrapper.
//
// The routes were written for mysql2 and use:
//   const [rows] = await pool.query('SELECT ... WHERE id = ?', [id]);
//   const [result] = await pool.query('INSERT INTO ... VALUES (?)', [v]);
//   result.insertId
//   const conn = await pool.getConnection(); conn.beginTransaction(); ...
//
// This wrapper keeps those call sites unchanged while talking to Postgres via
// the `pg` driver. `?` placeholders are rewritten to `$1, $2, ...` and INSERT
// statements get an automatic `RETURNING id` so `result.insertId` still works.
// ---------------------------------------------------------------------------

const connectionString =
  process.env.DATABASE_URL ||
  (process.env.PGHOST
    ? `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'postgres'}`
    : undefined);

let pool;
if (!connectionString) {
  console.warn('⚠️ No database configured. Set DATABASE_URL (Supabase connection string) in Railway Variables.');
  pool = {
    query: async () => [[], { mock: true }],
    getConnection: async () => ({
      query: async () => [[], { mock: true }],
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
    }),
    on: () => {},
  };
} else {
  const poolConfig = {
    connectionString,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: Number(process.env.DB_POOL_SIZE) || 10,
    keepAlive: true,
  };

  if (process.env.PGHOST_IS_POOLER === 'true') {
    poolConfig.options = '-c search_path=public';
  }

  if (process.env.DB_SSL !== 'false') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool(poolConfig);
  pool.on('error', (err) => {
    console.error('PG pool error:', err.message);
  });
}

const nativeQuery = (pool.query && pool.query.bind) ? pool.query.bind(pool) : async () => ({ rows: [] });

// Rewrite mysql2 `?` placeholders to PostgreSQL `$1, $2 ...`.
function convertPlaceholders(sql, params) {
  if (params === undefined || params === null || params.length === 0) return { sql, params: [] };
  let i = 0;
  return { sql: sql.replace(/\?/g, () => `$${++i}`), params };
}

// INSERT statements get RETURNING id so `result.insertId` keeps working.
function withReturningId(sql) {
  if (/^\s*\binsert\b/i.test(sql) && !/\breturning\b/i.test(sql)) {
    return sql.replace(/;?\s*$/, '') + ' RETURNING id';
  }
  return sql;
}

const FIELDS_MOCK = { mock: true };

function normalizeResult(result, sql) {
  const rows = (result && result.rows) || [];
  // mysql2 returns a ResultSetHeader for INSERT as the first tuple element,
  // e.g. const [result] = await pool.query(insertSql); result.insertId
  if (/^\s*\binsert\b/i.test(sql) && rows[0] && rows[0].id !== undefined) {
    return [{ insertId: rows[0].id, affectedRows: 1 }, FIELDS_MOCK];
  }
  return [rows, FIELDS_MOCK];
}

async function query(text, params) {
  const sql = withReturningId(text);
  const { sql: pgSql, params: pgParams } = convertPlaceholders(sql, params);
  const result = await nativeQuery(pgSql, pgParams);
  return normalizeResult(result, sql);
}

async function getConnection() {
  const client = await pool.connect();
  const wrapped = {
    query: async (text, params) => {
      const sql = withReturningId(text);
      const { sql: pgSql, params: pgParams } = convertPlaceholders(sql, params);
      const result = await client.query(pgSql, pgParams);
      return normalizeResult(result, sql);
    },
    beginTransaction: () => client.query('BEGIN'),
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
    release: () => client.release(),
  };
  return wrapped;
}

const testConnection = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✓ Supabase (PostgreSQL) Connected Successfully');
    return true;
  } catch (error) {
    console.error('✗ Supabase (PostgreSQL) Connection Failed:', error.message);
    return false;
  }
};

// Keep the pool.query signature used everywhere: pool.query(sql, params)
pool.query = query;
pool.getConnection = getConnection;

module.exports = { pool, testConnection };