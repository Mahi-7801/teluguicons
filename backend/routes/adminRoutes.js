const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const { pool } = require('../config/database');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'admin-' + unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg/i;
    if (allowed.test(path.extname(file.originalname)) || (file.mimetype && file.mimetype.startsWith('image/'))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.use(authenticate, authorizeAdmin);

// POST /api/admin/upload — Dedicated admin image upload endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
    message: 'Image uploaded successfully'
  });
});

router.get('/stats', async (req, res) => {
  try {
    const [totalNominations] = await pool.query('SELECT COUNT(*)::int AS count FROM nominations');
    const [pendingNominations] = await pool.query("SELECT COUNT(*)::int AS count FROM nominations WHERE status = 'pending'");
    const [approvedNominations] = await pool.query("SELECT COUNT(*)::int AS count FROM nominations WHERE status = 'shortlisted'");
    const [verifiedNominations] = await pool.query("SELECT COUNT(*)::int AS count FROM nominations WHERE status = 'verified'");
    const [totalVotes] = await pool.query('SELECT COUNT(*)::int AS count FROM votes');
    const [flaggedVotes] = await pool.query('SELECT COUNT(*)::int AS count FROM votes WHERE is_flagged = 1');
    const [totalNominees] = await pool.query('SELECT COUNT(*)::int AS count FROM nominees');
    const [totalCategories] = await pool.query('SELECT COUNT(*)::int AS count FROM categories');
    const [totalSponsors] = await pool.query('SELECT COUNT(*)::int AS count FROM sponsors');
    const [recentVotes] = await pool.query(
      `SELECT v.id, v.voter_name, v.voter_email, v.created_at, v.is_flagged, n.full_name AS nominee_name
       FROM votes v JOIN nominees n ON v.nominee_id = n.id
       ORDER BY v.id DESC LIMIT 10`
    );

    res.json({
      stats: {
        totalNominations: totalNominations[0].count,
        pendingNominations: pendingNominations[0].count,
        approvedNominations: approvedNominations[0].count,
        verifiedNominations: verifiedNominations[0].count,
        totalVotes: totalVotes[0].count,
        flaggedVotes: flaggedVotes[0].count,
        totalNominees: totalNominees[0].count,
        totalCategories: totalCategories[0].count,
        totalSponsors: totalSponsors[0].count,
      },
      recentVotes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/nominations', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT n.id, n.nomination_code, n.full_name, n.creator_name, n.email, n.phone, n.city, n.state,
                      n.primary_platform, n.youtube_url, n.instagram_url, n.facebook_url, n.photo_url,
                      n.journey, n.achievements, n.status, n.created_at, c.name AS category_name
               FROM nominations n JOIN categories c ON n.category_id = c.id`;
    const params = [];
    if (status) {
      sql += ' WHERE n.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY n.id DESC LIMIT 300';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/nominations/:id', async (req, res) => {
  try {
    const { status, admin_notes, category_id } = req.body;
    const [rows] = await pool.query('SELECT * FROM nominations WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nomination not found' });
    }
    const nomination = rows[0];

    await pool.query(
      'UPDATE nominations SET status = COALESCE(?, status), admin_notes = COALESCE(?, admin_notes), category_id = COALESCE(?, category_id) WHERE id = ?',
      [status, admin_notes, category_id, req.params.id]
    );

    // Shortlisting a verified nomination promotes it to an official nominee.
    if (status === 'shortlisted') {
      const slugBase = (nomination.creator_name || nomination.full_name || 'creator')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 1000);
      const nomineeCode = 'TIA2026-' + String(nomination.id).padStart(6, '0');
      await pool.query(
        `INSERT INTO nominees (category_id, full_name, slug, bio, photo_url, social_handle, status, nominee_code)
         VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)
         ON CONFLICT (slug) DO UPDATE SET full_name = EXCLUDED.full_name`,
        [
          nomination.category_id || category_id,
          nomination.creator_name || nomination.full_name,
          slugBase,
          nomination.journey || nomination.achievements || null,
          nomination.photo_url,
          nomination.instagram_url || nomination.youtube_url || nomination.other_profile_url || null,
          nomineeCode,
        ]
      );
      await pool.query("UPDATE nominations SET nomination_code = COALESCE(nomination_code, ?) WHERE id = ?", [nomineeCode, nomination.id]);
    }

    res.json({ message: 'Nomination updated' });
  } catch (error) {
    console.error('Update nomination error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/nominations/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM nominations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Nomination deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/nominees', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.id, n.full_name, n.slug, n.bio, n.photo_url, n.social_handle, n.followers_count,
              n.featured, n.status, n.nominee_code, n.vote_count, c.name AS category_name
       FROM nominees n JOIN categories c ON n.category_id = c.id
       ORDER BY n.id DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/nominees', async (req, res) => {
  try {
    const { full_name, category_id, bio, photo_url, social_handle, followers_count, featured } = req.body;
    if (!full_name || !category_id) {
      return res.status(400).json({ message: 'Full name and category are required' });
    }
    const slug = full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
    const nomineeCode = 'TIA-' + Math.floor(1000 + Math.random() * 9000);
    const [result] = await pool.query(
      `INSERT INTO nominees (category_id, full_name, slug, bio, photo_url, social_handle, followers_count, featured, status, nominee_code, vote_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, 0)`,
      [category_id, full_name, slug, bio || null, photo_url || null, social_handle || null, followers_count || null, featured ? 1 : 0, nomineeCode]
    );
    res.status(201).json({ message: 'Nominee created successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/nominees/:id', async (req, res) => {
  try {
    const { full_name, bio, photo_url, social_handle, followers_count, featured, status, category_id } = req.body;
    await pool.query(
      `UPDATE nominees SET
         full_name = COALESCE(?, full_name),
         bio = COALESCE(?, bio),
         photo_url = COALESCE(?, photo_url),
         social_handle = COALESCE(?, social_handle),
         followers_count = COALESCE(?, followers_count),
         featured = COALESCE(?, featured),
         status = COALESCE(?, status),
         category_id = COALESCE(?, category_id)
       WHERE id = ?`,
      [full_name, bio, photo_url, social_handle, followers_count,
       featured === undefined ? null : featured ? 1 : 0, status, category_id, req.params.id]
    );
    res.json({ message: 'Nominee updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/nominees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM nominees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Nominee deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/votes', async (req, res) => {
  try {
    const { flagged } = req.query;
    let sql = `SELECT v.id, v.voter_name, v.voter_email, v.voter_phone, v.ip_address, v.user_agent,
                      v.is_flagged, v.flag_reason, v.otp_verified, v.created_at, n.full_name AS nominee_name, c.name AS category_name
               FROM votes v
               JOIN nominees n ON v.nominee_id = n.id
               JOIN categories c ON v.category_id = c.id`;
    const params = [];
    if (flagged) {
      sql += ' WHERE v.is_flagged = 1';
    }
    sql += ' ORDER BY v.id DESC LIMIT 300';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/votes/:id/flag', async (req, res) => {
  try {
    const { is_flagged, flag_reason } = req.body;
    await pool.query(
      'UPDATE votes SET is_flagged = ?, flag_reason = ? WHERE id = ?',
      [is_flagged ? 1 : 0, flag_reason || null, req.params.id]
    );
    res.json({ message: 'Vote updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/votes/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT nominee_id FROM votes WHERE id = ?', [req.params.id]);
    if (rows.length > 0) {
      const nomineeId = rows[0].nominee_id;
      await pool.query('DELETE FROM votes WHERE id = ?', [req.params.id]);
      await pool.query('UPDATE nominees SET vote_count = GREATEST(0, vote_count - 1) WHERE id = ?', [nomineeId]);
    }
    res.json({ message: 'Vote deleted and vote count updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/sponsors', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sponsors ORDER BY sort_order ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/sponsors', async (req, res) => {
  try {
    const { name, tier, logo_url, website_url, tagline, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Sponsor name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO sponsors (name, tier, logo_url, website_url, tagline, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [name, tier || 'gold', logo_url || null, website_url || null, tagline || null, sort_order || 0]
    );
    res.status(201).json({ message: 'Sponsor created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/sponsors/:id', async (req, res) => {
  try {
    const { name, tier, logo_url, website_url, tagline, is_active, sort_order } = req.body;
    await pool.query(
      'UPDATE sponsors SET name = COALESCE(?, name), tier = COALESCE(?, tier), logo_url = COALESCE(?, logo_url), website_url = COALESCE(?, website_url), tagline = COALESCE(?, tagline), is_active = COALESCE(?, is_active), sort_order = COALESCE(?, sort_order) WHERE id = ?',
      [name, tier, logo_url, website_url, tagline, is_active === undefined ? null : is_active ? 1 : 0, sort_order, req.params.id]
    );
    res.json({ message: 'Sponsor updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/sponsors/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sponsors WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sponsor deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value, group_name FROM settings');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value',
        [key, String(value)]
      );
    }
    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/messages', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY id DESC LIMIT 200');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/messages/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== TICKETS ADMIN ==========
router.get('/tickets', async (req, res) => {
  try {
    const [configs] = await pool.query('SELECT * FROM tickets ORDER BY session ASC, tier ASC');
    const [orders] = await pool.query('SELECT * FROM ticket_orders ORDER BY id DESC LIMIT 300');
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_orders,
        COALESCE(SUM(quantity), 0)::int AS total_attendees,
        COALESCE(SUM(price_paisa), 0)::bigint AS total_revenue_paisa,
        COALESCE(SUM(is_checked_in), 0)::int AS total_checked_in
      FROM ticket_orders WHERE payment_status = 'paid'
    `);
    res.json({
      configs,
      orders,
      stats: stats[0] || { total_orders: 0, total_attendees: 0, total_revenue_paisa: 0, total_checked_in: 0 },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/tickets/:id/check-in', async (req, res) => {
  try {
    const { is_checked_in } = req.body;
    const checkedInVal = is_checked_in ? 1 : 0;
    const checkedAt = is_checked_in ? new Date() : null;
    await pool.query(
      'UPDATE ticket_orders SET is_checked_in = ?, checked_in_at = ? WHERE id = ?',
      [checkedInVal, checkedAt, req.params.id]
    );
    res.json({ message: `Ticket order ${checkedInVal ? 'checked in' : 'unchecked'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/tickets/config/:id', async (req, res) => {
  try {
    const { inventory, price_paisa, availability, is_active } = req.body;
    await pool.query(
      `UPDATE tickets SET
         inventory = COALESCE(?, inventory),
         price_paisa = COALESCE(?, price_paisa),
         availability = COALESCE(?, availability),
         is_active = COALESCE(?, is_active),
         updated_at = NOW()
       WHERE id = ?`,
      [inventory, price_paisa, availability, is_active === undefined ? null : is_active ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Ticket config updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== PAST EVENTS & AWARDEES CRUD ==========
router.get('/past-events', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM past_events ORDER BY sort_order ASC, year DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/past-events', async (req, res) => {
  try {
    const { slug, name, event_date, year, venue, description, poster_url, sort_order, is_published } = req.body;
    if (!slug || !name || !year) {
      return res.status(400).json({ message: 'Slug, Name and Year are required' });
    }
    const [result] = await pool.query(
      `INSERT INTO past_events (slug, name, event_date, year, venue, description, poster_url, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, name, event_date || null, year, venue || null, description || null, poster_url || null, sort_order || 0, is_published === 0 ? 0 : 1]
    );
    res.status(201).json({ message: 'Past event created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/past-events/:id', async (req, res) => {
  try {
    const { slug, name, event_date, year, venue, description, poster_url, sort_order, is_published } = req.body;
    await pool.query(
      `UPDATE past_events SET
         slug = COALESCE(?, slug),
         name = COALESCE(?, name),
         event_date = COALESCE(?, event_date),
         year = COALESCE(?, year),
         venue = COALESCE(?, venue),
         description = COALESCE(?, description),
         poster_url = COALESCE(?, poster_url),
         sort_order = COALESCE(?, sort_order),
         is_published = COALESCE(?, is_published)
       WHERE id = ?`,
      [slug, name, event_date, year, venue, description, poster_url, sort_order, is_published, req.params.id]
    );
    res.json({ message: 'Past event updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/past-events/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM past_events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Past event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/awardees', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, pe.name AS event_name
      FROM awardees a JOIN past_events pe ON a.past_event_id = pe.id
      ORDER BY a.year DESC, a.id DESC LIMIT 200
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/awardees', async (req, res) => {
  try {
    const { past_event_id, name, category, award_type, photo_url, bio, social_handle, year } = req.body;
    if (!past_event_id || !name || !category) {
      return res.status(400).json({ message: 'past_event_id, name and category are required' });
    }
    const [result] = await pool.query(
      `INSERT INTO awardees (past_event_id, name, category, award_type, photo_url, bio, social_handle, year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [past_event_id, name, category, award_type || null, photo_url || null, bio || null, social_handle || null, year || 2025]
    );
    res.status(201).json({ message: 'Awardee added', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/awardees/:id', async (req, res) => {
  try {
    const { past_event_id, name, category, award_type, photo_url, bio, social_handle, year } = req.body;
    await pool.query(
      `UPDATE awardees SET
         past_event_id = COALESCE(?, past_event_id),
         name = COALESCE(?, name),
         category = COALESCE(?, category),
         award_type = COALESCE(?, award_type),
         photo_url = COALESCE(?, photo_url),
         bio = COALESCE(?, bio),
         social_handle = COALESCE(?, social_handle),
         year = COALESCE(?, year)
       WHERE id = ?`,
      [past_event_id, name, category, award_type, photo_url, bio, social_handle, year, req.params.id]
    );
    res.json({ message: 'Awardee updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/awardees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM awardees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Awardee removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== GALLERY CMS ==========
router.get('/gallery', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gallery_items ORDER BY id DESC LIMIT 200');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/gallery', async (req, res) => {
  try {
    const { category, item_type, url, thumbnail_url, title, description, sort_order, is_published } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });
    const [result] = await pool.query(
      `INSERT INTO gallery_items (category, item_type, url, thumbnail_url, title, description, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [category || 'general', item_type || 'image', url, thumbnail_url || null, title || null, description || null, sort_order || 0, is_published === 0 ? 0 : 1]
    );
    res.status(201).json({ message: 'Gallery item added', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/gallery/:id', async (req, res) => {
  try {
    const { category, item_type, url, thumbnail_url, title, description, sort_order, is_published } = req.body;
    await pool.query(
      `UPDATE gallery_items SET
         category = COALESCE(?, category),
         item_type = COALESCE(?, item_type),
         url = COALESCE(?, url),
         thumbnail_url = COALESCE(?, thumbnail_url),
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         sort_order = COALESCE(?, sort_order),
         is_published = COALESCE(?, is_published)
       WHERE id = ?`,
      [category, item_type, url, thumbnail_url, title, description, sort_order, is_published, req.params.id]
    );
    res.json({ message: 'Gallery item updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/gallery/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM gallery_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Gallery item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== MEDIA CMS ==========
router.get('/media', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM media_items ORDER BY id DESC LIMIT 200');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/media', async (req, res) => {
  try {
    const { item_type, title, description, url, thumbnail_url, source, published_date, sort_order, is_published } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const [result] = await pool.query(
      `INSERT INTO media_items (item_type, title, description, url, thumbnail_url, source, published_date, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_type || 'press_release', title, description || null, url || null, thumbnail_url || null, source || null, published_date || new Date(), sort_order || 0, is_published === 0 ? 0 : 1]
    );
    res.status(201).json({ message: 'Media release added', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/media/:id', async (req, res) => {
  try {
    const { item_type, title, description, url, thumbnail_url, source, published_date, sort_order, is_published } = req.body;
    await pool.query(
      `UPDATE media_items SET
         item_type = COALESCE(?, item_type),
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         url = COALESCE(?, url),
         thumbnail_url = COALESCE(?, thumbnail_url),
         source = COALESCE(?, source),
         published_date = COALESCE(?, published_date),
         sort_order = COALESCE(?, sort_order),
         is_published = COALESCE(?, is_published)
       WHERE id = ?`,
      [item_type, title, description, url, thumbnail_url, source, published_date, sort_order, is_published, req.params.id]
    );
    res.json({ message: 'Media release updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/media/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM media_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Media release deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== SPONSOR LEADS ==========
router.get('/sponsor-leads', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sponsor_leads ORDER BY id DESC LIMIT 200');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/sponsor-leads/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE sponsor_leads SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sponsor lead marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/sponsor-leads/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sponsor_leads WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sponsor lead deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== EVENT PHASE SWITCHER ==========
router.put('/event-phase', async (req, res) => {
  try {
    const { phase } = req.body;
    if (!['phase_1', 'phase_2', 'phase_3', 'phase_4', 'phase_5'].includes(phase)) {
      return res.status(400).json({ message: 'Invalid phase value. Use phase_1 through phase_5' });
    }
    await pool.query(
      `INSERT INTO settings (setting_key, setting_value, group_name)
       VALUES ('event_phase', ?, 'event')
       ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value`,
      [phase]
    );
    res.json({ message: `Event phase switched to ${phase}`, phase });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== AUDIT LOGS ==========
router.get('/audit-logs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== VOTES EXPORT CSV ==========
router.get('/votes/export', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT v.id, v.voter_name, v.voter_email, v.voter_phone, v.ip_address, v.is_flagged, v.flag_reason,
             v.created_at, n.full_name AS nominee_name, c.name AS category_name
      FROM votes v
      JOIN nominees n ON v.nominee_id = n.id
      JOIN categories c ON v.category_id = c.id
      ORDER BY v.id DESC LIMIT 5000
    `);
    let csv = 'ID,Voter Name,Voter Email,Voter Phone,IP Address,Flagged,Flag Reason,Nominee,Category,Timestamp\n';
    rows.forEach((r) => {
      const line = [
        r.id,
        `"${(r.voter_name || '').replace(/"/g, '""')}"`,
        `"${(r.voter_email || '').replace(/"/g, '""')}"`,
        `"${(r.voter_phone || '').replace(/"/g, '""')}"`,
        `"${(r.ip_address || '').replace(/"/g, '""')}"`,
        r.is_flagged ? 'YES' : 'NO',
        `"${(r.flag_reason || '').replace(/"/g, '""')}"`,
        `"${(r.nominee_name || '').replace(/"/g, '""')}"`,
        `"${(r.category_name || '').replace(/"/g, '""')}"`,
        `"${r.created_at}"`,
      ].join(',');
      csv += line + '\n';
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="telugu-icon-votes.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;