const router = require('express').Router();
const { pool } = require('../config/database');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

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
    const { name, tier, website_url, tagline, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Sponsor name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO sponsors (name, tier, website_url, tagline, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, tier || 'gold', website_url || null, tagline || null, sort_order || 0]
    );
    res.status(201).json({ message: 'Sponsor created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/sponsors/:id', async (req, res) => {
  try {
    const { name, tier, website_url, tagline, is_active, sort_order } = req.body;
    await pool.query(
      'UPDATE sponsors SET name = COALESCE(?, name), tier = COALESCE(?, tier), website_url = COALESCE(?, website_url), tagline = COALESCE(?, tagline), is_active = COALESCE(?, is_active), sort_order = COALESCE(?, sort_order) WHERE id = ?',
      [name, tier, website_url, tagline, is_active === undefined ? null : is_active ? 1 : 0, sort_order, req.params.id]
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

module.exports = router;