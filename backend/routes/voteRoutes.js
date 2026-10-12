const router = require('express').Router();
const crypto = require('crypto');
const { pool } = require('../config/database');
const otpService = require('../services/otpService');
const { resolveVerificationMode } = require('./otpRoutes');

// Simple in-memory per-IP rate limit before fraud signals kick in.
//
// NOTE: this is per-process state. Under CLUSTER=1 every worker keeps its own
// counters, so the effective ceiling is VOTE_RATE_MAX x worker count. That is
// acceptable for flood protection but it is NOT a global quota - use the
// database-level unique keys (uq_votes_category_phone / _email / _device) as
// the authoritative per-voter limit, which they already are.
const voteRate = new Map(); // ip -> { count, windowStart }
const VOTE_RATE_MAX = Number(process.env.VOTE_RATE_MAX) || 20;
const VOTE_RATE_WINDOW = (Number(process.env.VOTE_RATE_WINDOW_MINUTES) || 60) * 60 * 1000;
// Hard ceiling on tracked IPs so a flood from many source addresses cannot grow
// the map without bound. Past the cap the oldest entries are evicted, which
// only ever fails open (a few IPs get an extra chance), never locks anyone out.
const VOTE_RATE_MAX_IPS = Number(process.env.VOTE_RATE_MAX_IPS) || 200000;

function checkIpRate(ip, max, windowMs) {
  const now = Date.now();
  const entry = voteRate.get(ip);
  if (!entry || now - entry.windowStart > windowMs) {
    if (voteRate.size >= VOTE_RATE_MAX_IPS) {
      const oldest = voteRate.keys().next();
      if (!oldest.done) voteRate.delete(oldest.value);
    }
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

// GET /api/votes/check?phone=&nominee_id=
// Answers "has this mobile number already voted in this nominee's category?"
// BEFORE an OTP is requested, so a repeat voter is told immediately instead of
// paying for an SMS and typing a code that will be rejected afterwards.
//
// It returns only whether a vote exists plus the nominee/category it was for -
// never the voter's name, email or IP - so this is not a way to look up who
// voted. Rate limiting still applies to the real POST /votes; this read is
// cheap (one indexed lookup on uq_votes_category_phone) and answers "no" for
// the overwhelming majority of callers.
router.get('/check', async (req, res) => {
  try {
    const mobile = otpService.normalizeMobile(req.query.phone);
    if (!mobile) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number.' });
    }
    const nomineeId = parseInt(req.query.nominee_id, 10);
    if (!nomineeId) {
      return res.status(400).json({ message: 'nominee_id is required' });
    }

    const [nominees] = await pool.query('SELECT id, category_id FROM nominees WHERE id = ? LIMIT 1', [nomineeId]);
    if (nominees.length === 0) {
      return res.status(404).json({ message: 'Nominee not found' });
    }
    const categoryId = nominees[0].category_id;

    const [rows] = await pool.query(
      `SELECT n.full_name AS nominee_name, c.name AS category_name, v.created_at
         FROM votes v
         JOIN nominees n  ON n.id = v.nominee_id
         JOIN categories c ON c.id = v.category_id
        WHERE v.category_id = ? AND v.voter_phone = ?
        LIMIT 1`,
      [categoryId, mobile]
    );

    if (rows.length === 0) {
      return res.json({ already_voted: false });
    }
    res.json({
      already_voted: true,
      nominee_name: rows[0].nominee_name,
      category_name: rows[0].category_name,
      voted_at: rows[0].created_at,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
    //
    // The connection MUST be released on every exit path, including the duplicate
    // -key rejection: the pool only has DB_POOL_SIZE connections, so leaking even
    // one per duplicate vote exhausts it and every later request hangs in the
    // queue forever. try/finally guarantees that.
    conn = await pool.getConnection();
    let recorded = false;
    let duplicateError = null;
    try {
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
          if (insertErr.code === 'ER_DUP_ENTRY') {
            duplicateError = insertErr;
            break;
          }
          const retryable = insertErr.code === 'ER_LOCK_DEADLOCK' || insertErr.code === 'ER_LOCK_WAIT_TIMEOUT';
          if (retryable && attempt < 4) {
            await new Promise((r) => setTimeout(r, 20 + Math.floor(Math.random() * 60)));
            continue;
          }
          throw insertErr;
        }
      }
    } finally {
      conn.release();
      conn = null;
    }

    if (duplicateError) {
      return res.status(400).json({ message: duplicateMessage(duplicateError) });
    }
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
  // MySQL reports the offending index by name in the message:
  //   Duplicate entry '...' for key 'votes.uq_votes_category_phone'
  const sql = String(err.sqlMessage || err.message || '');
  if (sql.includes('uq_votes_category_device')) {
    return 'You have already voted in this category from this device.';
  }
  if (sql.includes('uq_votes_category_email')) {
    return 'This email address has already voted in this category.';
  }
  if (sql.includes('uq_votes_category_phone') || /voter_phone/.test(sql)) {
    return 'This mobile number has already voted in this category.';
  }
  return 'This email address has already voted in this category.';
}

module.exports = router;