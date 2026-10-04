/**
 * fix-mock-votes.js
 * -----------------
 * Resets the seeded/mock vote_count values on the nominees table
 * to match ONLY real votes recorded in the votes table.
 *
 * Run once on production:
 *   node scripts/fix-mock-votes.js
 *
 * What it does:
 *  1. Recalculates vote_count for every nominee from the actual votes table.
 *  2. Prints a before/after summary so you can verify the change.
 */

require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL not set. Add it to your .env file.');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Supabase.\n');

  // 1. Show current (mock) vote counts
  const before = await client.query(`
    SELECT id, full_name, vote_count AS current_vote_count
    FROM nominees
    ORDER BY vote_count DESC
  `);

  console.log('BEFORE (current vote_count in nominees table):');
  before.rows.forEach((r) =>
    console.log(`  [${r.id}] ${r.full_name}  ->  ${r.current_vote_count}`)
  );

  // 2. Count real votes per nominee
  const realVotes = await client.query(`
    SELECT nominee_id, COUNT(*)::int AS real_count
    FROM votes
    GROUP BY nominee_id
  `);

  const realMap = {};
  realVotes.rows.forEach((r) => { realMap[r.nominee_id] = r.real_count; });

  console.log('\nReal vote counts from the votes table:');
  if (realVotes.rows.length === 0) {
    console.log('  (no real votes cast yet)');
  } else {
    realVotes.rows.forEach((r) =>
      console.log(`  nominee_id=${r.nominee_id}  ->  ${r.real_count} real votes`)
    );
  }

  // 3. Reset all nominees vote_count to 0 then apply real counts
  console.log('\nResetting vote_count for all nominees...');
  await client.query(`UPDATE nominees SET vote_count = 0`);

  for (const row of realVotes.rows) {
    await client.query(
      `UPDATE nominees SET vote_count = $1 WHERE id = $2`,
      [row.real_count, row.nominee_id]
    );
  }

  // 4. Show after state
  const after = await client.query(`
    SELECT id, full_name, vote_count AS updated_vote_count
    FROM nominees
    ORDER BY vote_count DESC
  `);

  console.log('\nAFTER (corrected vote_count):');
  after.rows.forEach((r) =>
    console.log(`  [${r.id}] ${r.full_name}  ->  ${r.updated_vote_count}`)
  );

  console.log('\nDone! All mock vote counts replaced with real vote counts.');
  await client.end();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
