require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cluster = require('cluster');
const os = require('os');
const zlib = require('zlib');

const { testConnection, pool } = require('./config/database');

const app = express();
app.disable('x-powered-by');

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// gzip JSON/text responses to cut bandwidth under heavy traffic.
app.use((req, res, next) => {
  if (!(req.headers['accept-encoding'] || '').toLowerCase().includes('gzip')) return next();
  const send = res.send.bind(res);
  res.send = (body) => {
    if (res.getHeader('Content-Encoding')) return send(body);
    const ct = String(res.getHeader('Content-Type') || '');
    if (ct && !/json|text|javascript|xml/.test(ct)) return send(body);
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body === undefined ? '' : String(body));
    res.setHeader('Content-Encoding', 'gzip');
    res.removeHeader('Content-Length');
    res.setHeader('Vary', 'Accept-Encoding');
    zlib.gzip(buffer, (err, compressed) => {
      if (err) {
        res.removeHeader('Content-Encoding');
        res.setHeader('Content-Length', buffer.length);
        return send(buffer);
      }
      send(compressed);
    });
  };
  next();
});

// Nominee photos are drawn into a <canvas> on the client to build the campaign
// poster. Canvas taints (and silently drops) cross-origin images unless the
// response carries CORS headers, so uploads are served with permissive CORS.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  cors: true,
  crossOriginResourcePolicy: 'cross-origin',
  maxAge: '7d',
}));

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const nomineeRoutes = require('./routes/nomineeRoutes');
const nominationRoutes = require('./routes/nominationRoutes');
const voteRoutes = require('./routes/voteRoutes');
const otpRoutes = require('./routes/otpRoutes');
const sponsorRoutes = require('./routes/sponsorRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');
const smsTemplateRoutes = require('./routes/smsTemplateRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const pastEventRoutes = require('./routes/pastEventRoutes');
const awardeeRoutes = require('./routes/awardeeRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const sponsorLeadRoutes = require('./routes/sponsorLeadRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/nominees', nomineeRoutes);
app.use('/api/nominations', nominationRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/sms-templates', smsTemplateRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/past-events', pastEventRoutes);
app.use('/api/awardees', awardeeRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/sponsor-leads', sponsorLeadRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Telugu Icon Awards API is running', db: process.env.DB_PORT, pid: process.pid });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

// MySQL-only migrations (note: on Supabase the equivalent unique indexes are
// already created by schema.supabase.sql, so nothing runs here).
const addKey = async () => {};
const runMigrations = async () => {
  console.log('✓ Schema migrations not required on Supabase (created in SQL Editor)');
};

const ensureDatabase = async () => {
  const connected = await testConnection();
  if (connected) await runMigrations();
  return connected;
};

const startServer = () => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Telugu Icon Awards API running on http://0.0.0.0:${PORT} (pid ${process.pid})`);
  });
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
};

const USE_CLUSTER = process.env.CLUSTER === '1' || process.env.CLUSTER === 'true';
const WORKERS = Math.max(1, Number(process.env.WORKERS) || 1);

const main = async () => {
  if (USE_CLUSTER && cluster.isMaster) {
    console.log(`[cluster] master ${process.pid} spawning ${WORKERS} worker(s)...`);
    for (let i = 0; i < WORKERS; i++) cluster.fork();
    cluster.on('exit', (worker, code, signal) => {
      console.log(`[cluster] worker ${worker.process.pid} died (${signal || code}). Restarting...`);
      cluster.fork();
    });
  } else {
    // Start HTTP server immediately so Railway health checks pass instantly
    startServer();

    // Railway keep-alive: Ping public healthcheck every 4 minutes to prevent idle sleep
    const keepAliveUrl = process.env.PUBLIC_URL || 'https://awards-production-13eb.up.railway.app';
    if (typeof fetch === 'function' && keepAliveUrl) {
      setInterval(() => {
        fetch(`${keepAliveUrl}/api/health`)
          .then((r) => r.json())
          .then(() => console.log('[keepalive] Ping sent to keep Railway awake'))
          .catch(() => {});
      }, 4 * 60 * 1000).unref();
    }

    // Verify database connection asynchronously in background
    ensureDatabase().catch((err) => {
      console.error('Database connection check error:', err.message);
    });
  }
};

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', (err && err.message) || err);
});

const shutdown = async (code) => {
  console.log('Shutting down gracefully...');
  try { await pool.end(); } catch (e) {}
  process.exit(code);
};
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

main();