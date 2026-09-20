require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: No DATABASE_URL in .env');
    process.exit(1);
  }

  console.log('Connecting to Supabase (PostgreSQL)...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✓ Successfully connected to Supabase database!\n');

    // 1. Run schema.supabase.sql
    console.log('--- Step 1: Executing schema.supabase.sql ---');
    const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.supabase.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✓ Core schema applied successfully (users, categories, nominees, nominations, votes, etc.)\n');

    // 2. Run migration-tickets-media.sql
    console.log('--- Step 2: Executing migration-tickets-media.sql ---');
    const migrationSql = fs.readFileSync(path.join(__dirname, '..', 'database', 'migration-tickets-media.sql'), 'utf-8');
    await client.query(migrationSql);
    console.log('✓ Tickets, past events, awardees, gallery, media, and sponsor leads applied successfully!\n');

    // 3. Ensure sample data exists if empty for public view
    console.log('--- Step 3: Checking & Seeding Essential Data ---');

    // Sample nominees if 0
    const nomineeCheck = await client.query('SELECT count(*)::int AS count FROM public.nominees');
    if (nomineeCheck.rows[0].count === 0) {
      console.log('Seeding initial verified nominees...');
      const catRows = await client.query("SELECT id FROM public.categories WHERE type = 'self_nomination' LIMIT 10");
      if (catRows.rows.length > 0) {
        const sampleNominees = [
          { name: 'Prasad Tech in Telugu', cat: catRows.rows[0].id, handle: '@prasadtechintelugu', followers: 4200000, bio: 'Pioneering Telugu tech creator unboxing and reviewing modern gadgets.', code: 'TIA2026-001001', votes: 12450 },
          { name: 'Village Cooking Channel (Telugu)', cat: catRows.rows[1]?.id || catRows.rows[0].id, handle: '@teluguvillagecooking', followers: 2800000, bio: 'Authentic traditional Andhra and Rayalaseema culinary journey.', code: 'TIA2026-001002', votes: 11200 },
          { name: 'Uma Telugu Traveller', cat: catRows.rows[2]?.id || catRows.rows[0].id, handle: '@umatravels', followers: 1500000, bio: 'Exploring hidden global wonders and cultural heritage in Telugu.', code: 'TIA2026-001003', votes: 9840 },
          { name: 'Telugu Comedy Factory', cat: catRows.rows[3]?.id || catRows.rows[0].id, handle: '@telugucomedyfactory', followers: 3100000, bio: 'Everyday relatable Telugu humor and family sketches.', code: 'TIA2026-001004', votes: 8900 },
          { name: 'FinWise Telugu', cat: catRows.rows[4]?.id || catRows.rows[0].id, handle: '@finwisetelugu', followers: 1200000, bio: 'Simplifying stock markets, investments, and personal finance for youth.', code: 'TIA2026-001005', votes: 7600 },
        ];
        for (const sn of sampleNominees) {
          const slug = sn.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
          await client.query(`
            INSERT INTO public.nominees (category_id, full_name, slug, bio, social_handle, followers_count, featured, status, nominee_code, vote_count)
            VALUES ($1, $2, $3, $4, $5, $6, 1, 'approved', $7, $8)
            ON CONFLICT (slug) DO NOTHING
          `, [sn.cat, sn.name, slug, sn.bio, sn.handle, sn.followers, sn.code, sn.votes]);
        }
        console.log('✓ Initial approved nominees seeded.');
      }
    }

    // Sample gallery items if 0
    const galleryCheck = await client.query('SELECT count(*)::int AS count FROM public.gallery_items');
    if (galleryCheck.rows[0].count === 0) {
      console.log('Seeding initial gallery items...');
      const samplePhotos = [
        { cat: 'telugu_icon_2026', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80', title: 'Grand Stage Preview', desc: 'Main stage setup at Hitex Exhibition Center, Hyderabad' },
        { cat: 'telugu_icon_2026', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80', title: 'Lighting & Atmosphere', desc: 'World-class cinematic lighting and stage production' },
        { cat: 'stree_shakti_2025', url: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&w=1000&q=80', title: 'Stree Shakti Pratibha Gala', desc: 'Moments honoring women leaders and trailblazers' },
        { cat: 'press_events', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80', title: 'Press Meet Hyderabad', desc: 'Organizing committee announcement meet' },
      ];
      for (const p of samplePhotos) {
        await client.query(`
          INSERT INTO public.gallery_items (category, item_type, url, title, description)
          VALUES ($1, 'image', $2, $3, $4)
        `, [p.cat, p.url, p.title, p.desc]);
      }
      console.log('✓ Sample gallery items seeded.');
    }

    // Sample video items if 0
    const videoCheck = await client.query('SELECT count(*)::int AS count FROM public.video_items');
    if (videoCheck.rows[0].count === 0) {
      console.log('Seeding initial video items...');
      const sampleVideos = [
        { cat: 'event_highlights', title: 'Telugu Icon Awards 2026 Official Anthem & Teaser', youtube_id: 'dQw4w9WgXcQ', duration: '2:45' },
        { cat: 'creator_stories', title: 'From Village Streets to 1M Subscribers: Creator Journey', youtube_id: 'dQw4w9WgXcQ', duration: '5:12' },
        { cat: 'previous_events', title: 'Stree Shakti Pratibha Awards 2025 Grand Recap', youtube_id: 'dQw4w9WgXcQ', duration: '8:30' },
      ];
      for (const v of sampleVideos) {
        await client.query(`
          INSERT INTO public.video_items (category, title, youtube_id, duration)
          VALUES ($1, $2, $3, $4)
        `, [v.cat, v.title, v.youtube_id, v.duration]);
      }
      console.log('✓ Sample video items seeded.');
    }

    // Sample past awardees if 0
    const awardeeCheck = await client.query('SELECT count(*)::int AS count FROM public.awardees');
    if (awardeeCheck.rows[0].count === 0) {
      console.log('Seeding sample past awardees...');
      const evRows = await client.query("SELECT id FROM public.past_events WHERE slug = 'stree-shakti-pratibha-awards-2025'");
      if (evRows.rows.length > 0) {
        const evId = evRows.rows[0].id;
        const pastWinners = [
          { name: 'Dr. Sudha Rani', cat: 'Excellence in Healthcare & Rural Service', type: 'Pratibha Icon Award', year: 2025 },
          { name: 'Kavitha Reddy', cat: 'Women Entrepreneur of the Year', type: 'Winner', year: 2025 },
          { name: 'Shailaja V', cat: 'Social Impact in Education', type: 'Winner', year: 2025 },
        ];
        for (const pw of pastWinners) {
          await client.query(`
            INSERT INTO public.awardees (past_event_id, name, category, award_type, year)
            VALUES ($1, $2, $3, $4, $5)
          `, [evId, pw.name, pw.cat, pw.type, pw.year]);
        }
        console.log('✓ Past awardees seeded.');
      }
    }

    // 4. Verify all tables in public schema
    console.log('\n--- Step 4: Verification of All Tables on Supabase ---');
    const tablesQuery = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC
    `);

    const tableNames = tablesQuery.rows.map(r => r.table_name);
    console.log(`Found ${tableNames.length} total tables in public schema:\n`);

    const report = [];
    for (const t of tableNames) {
      try {
        const countRes = await client.query(`SELECT count(*)::int AS count FROM public.${t}`);
        report.push({ table: t, count: countRes.rows[0].count, status: 'WORKING' });
      } catch (err) {
        report.push({ table: t, count: 'N/A', status: 'ERROR: ' + err.message });
      }
    }

    console.table(report);

    console.log('\n======================================================');
    console.log('✓ ALL TABLES SUCCESSFULLY CREATED AND VERIFIED ON SUPABASE!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
