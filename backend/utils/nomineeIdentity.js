const crypto = require('crypto');
const { pool } = require('../config/database');

const CODE_PREFIX = 'TIC26-';
const CODE_PAD = 5;

// "Ananya Nagalla" -> "ananya-nagalla"
function slugify(input) {
  const base = String(input || '')
    .normalize('NFKD')
    // strip combining marks left behind by NFKD (accented latin)
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.slice(0, 180);
}

// A slug that is free to use. Falls back to a numbered suffix only on collision,
// so the common case stays readable: /nominee/ananya-nagalla
async function uniqueSlug(desired, excludeId) {
  const base = slugify(desired) || `nominee-${excludeId || Date.now()}`;
  const filter = excludeId ? 'AND id <> ?' : '';

  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base.slice(0, 180 - String(attempt).length - 1)}-${attempt}`;
    const params = excludeId ? [candidate, excludeId] : [candidate];
    const [rows] = await pool.query(`SELECT id FROM nominees WHERE slug = ? ${filter} LIMIT 1`, params);
    if (rows.length === 0) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// TIC26-00001, TIC26-00002, ...
// Prefers the Postgres sequence created by migration-nominee-pages.sql; falls
// back to max(existing)+1 so the endpoint keeps working before the migration
// has been applied.
async function generateNomineeCode() {
  try {
    const [rows] = await pool.query("SELECT 'TIC26-' || LPAD(NEXTVAL('public.nominee_code_seq')::TEXT, 5, '0') AS code");
    if (rows[0] && rows[0].code) return rows[0].code;
  } catch (_) {
    // sequence not created yet - fall through
  }

  const [rows] = await pool.query(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(nominee_code, '\\D', '', 'g'), '')::INTEGER), 0) + 1 AS next
       FROM nominees
      WHERE nominee_code LIKE 'TIC26-%'`
  );
  const next = Number((rows[0] && rows[0].next) || 1);
  return CODE_PREFIX + String(next).padStart(CODE_PAD, '0');
}

function isUniqueViolation(error) {
  if (!error) return false;
  if (error.code === '23505') return true;
  return /duplicate key value|unique constraint/i.test(String(error.message || ''));
}

// Runs `insert` with a fresh nominee code, retrying on the (rare) chance of a
// code collision so a busy awards night can never fail to create a nominee.
async function withNomineeCode(insert) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const nominee_code = await generateNomineeCode();
    try {
      return await insert(nominee_code);
    } catch (error) {
      lastError = error;
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw lastError;
}

const hashFingerprint = (ip, userAgent) =>
  crypto.createHash('sha256').update(`${ip || ''}|${userAgent || ''}`).digest('hex').slice(0, 64);

const clientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim().slice(0, 60);
  return (req.ip || (req.connection && req.connection.remoteAddress) || '').slice(0, 60) || null;
};

// Migrations here are applied by hand in the Supabase SQL editor, so a column can
// be missing on a database that has not been updated yet. Probe once and cache
// so the API keeps serving instead of erroring with "column does not exist".
const columnCache = new Map();

async function hasColumn(table, column) {
  const key = `${table}.${column}`;
  if (columnCache.has(key)) return columnCache.get(key);
  let exists = false;
  try {
    const [rows] = await pool.query(
      `SELECT 1 AS ok FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ? AND column_name = ? LIMIT 1`,
      [table, column]
    );
    exists = rows.length > 0;
  } catch (_) {
    exists = false;
  }
  columnCache.set(key, exists);
  return exists;
}

function resetColumnCache() {
  columnCache.clear();
}

module.exports = {
  CODE_PREFIX,
  slugify,
  uniqueSlug,
  generateNomineeCode,
  withNomineeCode,
  isUniqueViolation,
  hashFingerprint,
  clientIp,
  hasColumn,
  resetColumnCache,
};
