const router = require('express').Router();
const crypto = require('crypto');
const { pool } = require('../config/database');
const otpService = require('../services/otpService');

async function resolveTemplateOptions() {
  const [templates] = await pool.query(
    'SELECT dlt_template_id FROM sms_templates WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
  );
  const templateId = templates.length ? templates[0].dlt_template_id : undefined;
  // Delivery mode is admin-controllable via settings.otp_delivery:
  //   'onsite' -> OTP is generated locally and shown on the website (NO SMS).
  //   'sms'    -> OTP is sent via MSG91 SMS (requires auth key + template).
  //   'auto'   -> SMS if fully configured, otherwise show OTP on the website.
  const [deliveryRows] = await pool.query(
    "SELECT setting_value FROM settings WHERE setting_key = 'otp_delivery' LIMIT 1"
  );
  const delivery = deliveryRows.length ? deliveryRows[0].setting_value : 'auto';
  const smsConfigured = !!(process.env.MSG91_AUTH_KEY && templateId);
  const live = delivery === 'sms' ? smsConfigured : (delivery === 'onsite' ? false : smsConfigured);
  return { templateId, live, delivery };
}

async function resolveVerificationMode() {
  const [rows] = await pool.query(
    "SELECT setting_value FROM settings WHERE setting_key = 'vote_verification' LIMIT 1"
  );
  if (rows.length && ['otp', 'device'].includes(rows[0].setting_value)) {
    return rows[0].setting_value;
  }
  // Default: every vote MUST be verified with an OTP (shown on the website when
  // SMS is not configured). No more silent device-only votes.
  return 'otp';
}

router.get('/mode', async (req, res) => {
  try {
    res.json({ mode: await resolveVerificationMode() });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load verification mode' });
  }
});

router.post('/send', async (req, res) => {
  try {
    const options = await resolveTemplateOptions();
    const result = await otpService.sendOtp(req.body.mobile, options);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to send OTP' });
  }
});

router.post('/resend', async (req, res) => {
  try {
    const options = await resolveTemplateOptions();
    const result = await otpService.resendOtp(req.body.mobile, options);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to resend OTP' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    await otpService.verifyOtp(mobile, otp);

    const { normalized, token } = await otpService.createVerificationToken(mobile);

    // Invalidate any prior unused sessions for this mobile + purpose
    await pool.query(
      "UPDATE otp_sessions SET used_at = NOW() WHERE mobile = ? AND purpose = 'vote' AND used_at IS NULL",
      [normalized]
    );
    // expires_at is computed server-side so the client's timezone (UTC string ->
    // SYSTEM/IST TIMESTAMP) can never push the token into the past.
    await pool.query(
      "INSERT INTO otp_sessions (mobile, token_hash, purpose, expires_at) VALUES (?, ?, ?, NOW() + INTERVAL '30 minutes')",
      [normalized, crypto.createHash('sha256').update(token).digest('hex'), 'vote']
    );

    res.json({
      type: 'success',
      message: 'Mobile verified successfully.',
      verification_token: token,
      mobile: normalized,
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Verification failed' });
  }
});

module.exports = router;
module.exports.resolveVerificationMode = resolveVerificationMode;