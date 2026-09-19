const router = require('express').Router();
const crypto = require('crypto');
const { pool } = require('../config/database');
const otpService = require('../services/otpService');
const { resolveVerificationMode } = require('./otpRoutes');

// Simple in-memory per-IP rate limit before fraud signals kick in.
const voteRate = new Map(); // ip -> { count, windowStart }
const VOTE_RATE_MAX = 20;
const VOTE_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkIpRate(ip, max, windowMs) {
  const now = Date.now();
  const entry = voteRate.get(ip);
  if (!entry || now - entry.windowStart > windowMs) {
    voteRate.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

// Periodically drop expired rate-limit entries so the map cannot grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of voteRate) {
    if (now - entry.windowStart > VOTE_RATE_WINDOW) voteRate.delete(key);
  }
}, 15 * 60 * 1000).unref();

// The verification mode rarely changes mid-run; cache it briefly to save a DB hit per vote.
let modeCache = { value: null, at: 0 };
async function getVerifyMode() {
  if (modeCache.value && Date.now() - modeCache.at < 5000) return modeCache.value;
  const value = await resolveVerificationMode();
  modeCache = { value, at: Date.now() };
  return value;
}

// During a 10k-90k simultaneous-vote round the MySQL pool can hit its cap or the
// request queue can fill up. Treat those as "please retry in a second" instead of 500.
function isBusyError(err) {
  if (!err) return false;
  if (err.code === 'ER_CON_COUNT_ERROR') return true;
  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('queue limit') ||
    msg.includes('too many connections') ||
    msg.includes('connection limit') ||
    msg === 'timeout' ||
    /getaddrinfo|econnrefused|pool_closed/.test(msg)
  );
}

router.post('/', async (req, res) => {
  let conn;
  try {
    const { nominee_id, voter_name, voter_email, voter_phone, verification_token, device_fingerprint } = req.body;
    if (!nominee_id) {
      return res.status(400).json({ message: 'Nominee is required' });
    }

    const ip = req.ip || req.connection.remoteAddress || null;
    const ua = (req.headers['user-agent'] || '').slice(0, 300) || null;

    // Hard cap per IP/hour to stop automated flooding.
    if (!checkIpRate(ip, VOTE_RATE_MAX, VOTE_RATE_WINDOW)) {
      return res.status(429).json({ message: 'Too many votes from this device. Please try again later.' });
    }

    const username = (voter_name || '').trim().slice(0, 120) || null;
    const useremail = (voter_email || '').trim().toLowerCase().slice(0, 150) || null;
    const mobile = otpService.normalizeMobile(voter_phone);
    const fingerprint = typeof device_fingerprint === 'string'
      ? device_fingerprint.trim().slice(0, 64)
      : null;

    const verifyMode = await getVerifyMode();

    // Validate OTP token when present; the token must belong to the same mobile
    // number that is voting, otherwise a stolen token could be paired with any phone.
    let otpVerified = 0;
    if (verification_token) {
      const tokenHash = crypto.createHash('sha256').update(verification_token).digest('hex');
      const [sessions] = await pool.query(
        "SELECT id FROM otp_sessions WHERE token_hash = ? AND purpose = 'vote' AND mobile = ? AND used_at IS NULL AND expires_at > NOW()",
        [tokenHash, mobile]
      );
      if (sessions.length === 0) {
        return res.status(401).json({ message: 'Mobile not verified. Please verify your OTP again.' });
      }
      otpVerified = 1;
    } else if (verifyMode === 'otp') {
      return res.status(401).json({ message: 'Mobile not verified. Please verify your OTP first.' });
    }

    if (verifyMode === 'device' && !mobile && !fingerprint) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number or allow device verification to vote.' });
    }
    if (!otpVerified && !fingerprint) {
      return res.status(400).json({ message: 'Mobile not verified. Please verify your OTP first.' });
    }

    // Nominee + category checks in a single round trip (was two).
    const [nomineeRows] = await pool.query(
      `SELECT n.id, n.category_id, n.vote_count, c.voting_open, c.type
         FROM nominees n
         JOIN categories c ON c.id = n.category_id
        WHERE n.id = ? AND n.status = 'approved'
        LIMIT 1`,
      [nominee_id]
    );
    if (nomineeRows.length === 0) {
      return res.status(404).json({ message: 'Nominee not found or not approved' });
    }
    const nominee = nomineeRows[0];
    if (nominee.voting_open !== 1) {
      return res.status(400).json({ message: 'Voting is currently closed for this category' });
    }
    if (nominee.type === 'jury') {
      return res.status(400).json({ message: 'This category is handled through the official jury process and is not open for public voting' });
    }

    // ---- Duplicate prevention: one device + one IP + one phone + one email =
    //      one vote per category. One combined friendly pre-check keeps this at a
    //      single round trip. The unique keys on the votes table are still the
    //      authoritative, race-safe guard — see the INSERT inside the transaction.
    if (mobile || useremail || fingerprint || (ip && ua)) {
      const [dups] = await pool.query(
        `SELECT voter_phone, voter_email, device_fingerprint
           FROM votes
          WHERE category_id = ?
            AND (voter_phone = ? OR voter_email = ? OR device_fingerprint = ? OR (ip_address = ? AND user_agent = ?))
          LIMIT 1`,
        [nominee.category_id, mobile, useremail, fingerprint, ip, ua]
      );
      if (dups.length > 0) {
        const d = dups[0];
        let message = 'A vote from this device has already been recorded in this category.';
        if (mobile && d.voter_phone === mobile) {
          message = 'This mobile number has already voted in this category.';
        } else if (useremail && d.voter_email && String(d.voter_email).toLowerCase() === useremail) {
          message = 'This email address has already voted in this category.';
        } else if (fingerprint && d.device_fingerprint === fingerprint) {
          message = 'You have already voted in this category from this device.';
        }
        return res.status(400).json({ message });
      }
    }

    const tokenHash = verification_token
      ? crypto.createHash('sha256').update(verification_token).digest('hex')
      : null;

    // Atomic insert + count. Under high concurrency two identical votes can pass the
    // pre-checks together; the unique keys on (category_id, voter_phone),
    // (category_id, voter_email) and (category_id, device_fingerprint) reject the
    // second one inside the transaction.
    //
    // InnoDB can raise a deadlock (1213) / lock wait timeout (1205) when many
    // parallel votes hit the same category range + the shared nominee row, so the
    // transaction is retried a few times with a small jitter before giving up.
    conn = await pool.getConnection();
    let recorded = false;
    for (let attempt = 1; attempt <= 4 && !recorded; attempt++) {
      try {
        await conn.beginTransaction();
        await conn.query(
          `INSERT INTO votes (nominee_id, category_id, voter_name, voter_email, voter_phone, ip_address, user_agent, otp_verified, verification_token, device_fingerprint)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [nominee_id, nominee.category_id, username, useremail, mobile, ip, ua, otpVerified, tokenHash, fingerprint]
        );
        await conn.query('UPDATE nominees SET vote_count = vote_count + 1 WHERE id = ?', [nominee_id]);
        await conn.commit();
        recorded = true;
      } catch (insertErr) {
        try { await conn.rollback(); } catch (_) {}
        if (insertErr.code === '23505') {
          return res.status(400).json({ message: duplicateMessage(insertErr) });
        }
        const retryable = insertErr.code === '40001' || insertErr.code === '40P01';
        if (retryable && attempt < 4) {
          await new Promise((r) => setTimeout(r, 20 + Math.floor(Math.random() * 60)));
          continue;
        }
        throw insertErr;
      }
    }
    conn.release();
    conn = null;
    if (!recorded) {
      throw Object.assign(new Error('Could not record vote after retries'), { transient: true });
    }

    res.status(201).json({ message: 'Your vote has been recorded. Thank you for supporting the Telugu digital creator community!', vote_count: nominee.vote_count + 1 });
  } catch (error) {
    if (conn) { try { conn.rollback(); } catch (_) {} conn.release(); }
    console.error('Vote error:', error.message);
    if (error.transient || isBusyError(error)) {
      return res.status(503).json({ message: 'Voting is very busy right now. Please try again in a moment.' });
    }
    res.status(500).json({ message: 'Failed to record vote' });
  }
});

function duplicateMessage(err) {
  const constraint = String(err.constraint || '');
  const sql = String(err.sql || err.sqlMessage || '');
  if (constraint.includes('uq_votes_category_device')) {
    return 'You have already voted in this category from this device.';
  }
  if (constraint.includes('uq_votes_category_email')) {
    return 'This email address has already voted in this category.';
  }
  if (constraint.includes('uq_votes_category_phone') || /voter_phone/.test(sql)) {
    return 'This mobile number has already voted in this category.';
  }
  return 'This email address has already voted in this category.';
}

module.exports = router;