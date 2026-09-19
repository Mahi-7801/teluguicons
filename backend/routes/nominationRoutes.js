const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { pool } = require('../config/database');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'nomination-' + unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// SELF-NOMINATION ONLY — creators submit their own profile.
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const {
      category_id, full_name, creator_name, email, phone, city, state,
      primary_platform, youtube_url, instagram_url, facebook_url,
      other_profile_url, website_url, journey, achievements, support_links,
    } = req.body;

    if (!category_id) {
      return res.status(400).json({ message: 'Please select a category' });
    }
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    if (!phone || !/^[0-9+\-\s]{10,15}$/.test(String(phone).trim())) {
      return res.status(400).json({ message: 'Please provide a valid mobile number' });
    }

    // Jury & Special Recognition categories are NOT open for self-nomination.
    const [catRows] = await pool.query(
      "SELECT id FROM categories WHERE id = ? AND type = 'self_nomination'",
      [category_id]
    );
    if (catRows.length === 0) {
      return res.status(400).json({ message: 'This category is not open for self-nomination' });
    }

    const [nomOpen] = await pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'nominations_open'"
    );
    if (nomOpen.length > 0 && String(nomOpen[0].setting_value) === '0') {
      return res.status(400).json({ message: 'Nominations are currently closed' });
    }

    const photo_url = req.file ? ('/uploads/' + req.file.filename) : null;

    const [result] = await pool.query(
      `INSERT INTO nominations
        (category_id, full_name, creator_name, email, phone, city, state,
         primary_platform, youtube_url, instagram_url, facebook_url,
         other_profile_url, website_url, photo_url, journey, achievements, support_links)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [category_id, full_name.trim(), creator_name || full_name.trim(), email.trim(), phone.trim(),
       city || null, state || null, primary_platform || null,
       youtube_url || null, instagram_url || null, facebook_url || null,
       other_profile_url || null, website_url || null, photo_url,
       journey || null, achievements || null, support_links || null]
    );

    // Nomination ID: TIA2026-XXXXXX
    const nominationId = result.insertId;
    const nominationCode = 'TIA2026-' + String(nominationId).padStart(6, '0');
    await pool.query('UPDATE nominations SET nomination_code = ? WHERE id = ?', [nominationCode, nominationId]);

    res.status(201).json({
      message: 'Your self-nomination has been submitted successfully!',
      nomination_code: nominationCode,
      id: nominationId,
    });
  } catch (error) {
    console.error('Nomination error:', error.message);
    res.status(500).json({ message: 'Failed to submit nomination' });
  }
});

module.exports = router;