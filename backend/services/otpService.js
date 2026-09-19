const crypto = require('crypto');

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || '';
const MSG91_OTP_EXPIRY = Number(process.env.MSG91_OTP_EXPIRY || 10); // minutes

const API_BASE = 'https://control.msg91.com/api/v5/otp';

// DEV MODE until BOTH auth token and template id are configured (no SMS cost).
const DEV_MODE = !MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID;

const devOtpStore = new Map(); // mobile -> { otp, expiresAt }
const rateLimits = new Map(); // key(mobile|ip) -> { count, firstAt, lastAt }

function normalizeMobile(mobile) {
  if (!mobile) return null;
  let m = String(mobile).trim().replace(/[^\d]/g, '');
  if (m.length === 10) m = '91' + m;
  if (m.length === 12 && m.startsWith('91')) return m;
  return null;
}

function devOtp(mobile) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  devOtpStore.set(mobile, { otp, expiresAt: Date.now() + MSG91_OTP_EXPIRY * 60 * 1000 });
  return otp;
}

function checkRateLimit(key, maxPerWindow, windowMs) {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now - entry.firstAt > windowMs) {
    rateLimits.set(key, { count: 1, firstAt: now, lastAt: now });
    return { allowed: true, remaining: maxPerWindow - 1 };
  }
  if (now - entry.lastAt < 30000) return { allowed: false, remaining: 0 }; // 30s between sends
  entry.count += 1;
  entry.lastAt = now;
  if (entry.count > maxPerWindow) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: maxPerWindow - entry.count };
}

async function sendOtp(mobile, options = {}) {
  const normalized = normalizeMobile(mobile);
  if (!normalized) throw Object.assign(new Error('Please enter a valid 10-digit Indian mobile number.'), { status: 400 });

  const limit = checkRateLimit('send:' + normalized, 5, 24 * 60 * 60 * 1000);
  if (!limit.allowed && limit.remaining === 0) {
    throw Object.assign(new Error('Too many OTP requests. Please try again later.'), { status: 429 });
  }

  const liveMode = options.live !== undefined ? options.live : !DEV_MODE;
  const templateId = options.templateId || MSG91_TEMPLATE_ID;

  if (!liveMode) {
    const otp = devOtp(normalized);
    return {
      type: 'success',
      message: 'OTP sent successfully.',
      otp,
      dev_otp: otp,
      delivery: 'onsite',
      dev_hint: 'SMS authkey or DLT template not configured — OTP is shown on the website.',
    };
  }

  if (!templateId) {
    throw Object.assign(new Error('OTP template is not configured. Add an active DLT template in Admin > SMS Templates.'), { status: 502 });
  }

  const body = {
    authkey: MSG91_AUTH_KEY,
    template_id: templateId,
    mobile: normalized,
    otp_expiry: MSG91_OTP_EXPIRY,
    otp_length: 6,
    realTimeResponse: 1,
  };

  const res = await fetch(`${API_BASE}?authkey=${encodeURIComponent(MSG91_AUTH_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (data.type !== 'success') {
    throw Object.assign(new Error(data.message || 'Failed to send OTP. Please try again.'), { status: 502 });
  }
  return { message: 'OTP sent to your mobile.', type: 'success' };
}

async function verifyOtp(mobile, otp) {
  const normalized = normalizeMobile(mobile);
  if (!normalized) throw Object.assign(new Error('Please enter a valid 10-digit Indian mobile number.'), { status: 400 });
  if (!otp || !/^\d{4,9}$/.test(String(otp).trim())) {
    throw Object.assign(new Error('Please enter the OTP you received.'), { status: 400 });
  }

  if (DEV_MODE) {
    const entry = devOtpStore.get(normalized);
    if (!entry) throw Object.assign(new Error('No OTP sent to this number yet. Please request an OTP first.'), { status: 400 });
    if (Date.now() > entry.expiresAt) throw Object.assign(new Error('OTP has expired. Please request a new one.'), { status: 400 });
    if (String(entry.otp) !== String(otp).trim()) throw Object.assign(new Error('Invalid OTP. Please try again.'), { status: 400 });
    devOtpStore.delete(normalized);
    return { type: 'success', message: 'number_verified_successfully' };
  }

  const url = `${API_BASE}/verify?otp=${encodeURIComponent(String(otp).trim())}&mobile=${encodeURIComponent(normalized)}`;
  const res = await fetch(url, { headers: { authkey: MSG91_AUTH_KEY } });
  const data = await res.json().catch(() => ({}));
  if (data.type !== 'success') {
    throw Object.assign(new Error(data.message || 'Invalid OTP. Please try again.'), { status: 400 });
  }
  return data;
}

async function resendOtp(mobile, options = {}) {
  const normalized = normalizeMobile(mobile);
  if (!normalized) throw Object.assign(new Error('Please enter a valid 10-digit Indian mobile number.'), { status: 400 });

  const limit = checkRateLimit('resend:' + normalized, 3, 24 * 60 * 60 * 1000);
  if (!limit.allowed && limit.remaining === 0) {
    throw Object.assign(new Error('Too many resend attempts. Please try again later.'), { status: 429 });
  }

  const liveMode = options.live !== undefined ? options.live : !DEV_MODE;

  if (!liveMode) {
    const otp = devOtp(normalized);
    return { type: 'success', message: 'OTP re-sent successfully.', otp, dev_otp: otp, delivery: 'onsite' };
  }

  const url = `${API_BASE}/retry?mobile=${encodeURIComponent(normalized)}&retrytype=text&authkey=${encodeURIComponent(MSG91_AUTH_KEY)}`;
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (data.type !== 'success') {
    throw Object.assign(new Error(data.message || 'Failed to re-send OTP.'), { status: 502 });
  }
  return { message: 'OTP re-sent to your mobile.', type: 'success' };
}

async function createVerificationToken(mobile) {
  const normalized = normalizeMobile(mobile);
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 30 * 60 * 1000);
  return { normalized, token, expires };
}

module.exports = { sendOtp, verifyOtp, resendOtp, createVerificationToken, normalizeMobile, DEV_MODE };