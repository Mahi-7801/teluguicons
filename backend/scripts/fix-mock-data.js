/**
 * fix-mock-data.js
 * ----------------
 * Removes ALL seeded/mock data from:
 *   - gallery_items  (4 Unsplash photos seeded by push-all-tables-supabase.js)
 *   - past_events    (2 seed events: Telugu Icon Awards 2026, Stree Shakti 2025)
 *
 * Safe: only deletes rows whose URLs are from unsplash.com or whose slugs
 * match the known seed slugs. Real data entered by the admin is left intact.
 *
 * Run:  node scripts/fix-mock-data.js
 */

require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL not set in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Supabase.\n');

  // ── 1. Gallery: delete all Unsplash mock images ──────────────────────────────
  const galleryBefore = await client.query('SELECT id, title, url FROM gallery_items ORDER BY id');
  console.log(`Gallery items BEFORE: ${galleryBefore.rows.length}`);
  galleryBefore.rows.forEach(r => console.log(`  [${r.id}] ${r.title} | ${r.url.substring(0, 60)}...`));

  const galDel = await client.query(
    `DELETE FROM gallery_items WHERE url LIKE '%unsplash.com%' RETURNING id, title`
  );
  console.log(`\nDeleted ${galDel.rows.length} mock gallery item(s):`);
  galDel.rows.forEach(r => console.log(`  - [${r.id}] ${r.title}`));

  // ── 2. Past Events: delete known seed slugs ────────────────────────────────
  const eventsBefore = await client.query('SELECT id, slug, name FROM past_events ORDER BY id');
  console.log(`\nPast events BEFORE: ${eventsBefore.rows.length}`);
  eventsBefore.rows.forEach(r => console.log(`  [${r.id}] ${r.slug} | ${r.name}`));

  const seedSlugs = ['telugu-icon-awards-2026', 'stree-shakti-pratibha-awards-2025'];
  const evDel = await client.query(
    `DELETE FROM past_events WHERE slug = ANY($1::text[]) RETURNING id, slug, name`,
    [seedSlugs]
  );
  console.log(`\nDeleted ${evDel.rows.length} mock past event(s):`);
  evDel.rows.forEach(r => console.log(`  - [${r.id}] ${r.slug} | ${r.name}`));

  // ── 3. Summary ─────────────────────────────────────────────────────────────
  const galAfter = await client.query('SELECT COUNT(*)::int AS c FROM gallery_items');
  const evAfter  = await client.query('SELECT COUNT(*)::int AS c FROM past_events');
  console.log(`\nGallery items remaining : ${galAfter.rows[0].c}`);
  console.log(`Past events remaining   : ${evAfter.rows[0].c}`);
  console.log('\nDone. All mock/seed data removed from database.');

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
