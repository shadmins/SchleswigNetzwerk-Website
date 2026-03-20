'use strict';

require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const authRoutes     = require('./routes/auth');
const discordAuthRoutes = require('./routes/discord-auth');
const accountRoutes  = require('./routes/accounts');
const contentRoutes  = require('./routes/content');
const adminRoutes    = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security Headers ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
}));

// ── Compression ────────────────────────────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));

// ── Frontend Static Files ──────────────────────────────────────
app.use(express.static('../frontend', { 
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: false 
}));

// ── Backend Static Files (Public) ──────────────────────────────
app.use(express.static('public', { 
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: false 
}));

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.APP_URL 
    : true,
  credentials: true,
}));

// ── Body Parser / Cookie ──────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ── Request Logging (Entwicklung) ─────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin',   adminRoutes);

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Frontend Routes (HTML-Seiten) ──────────────────────────────
app.get('/', (_req, res) => {
  res.sendFile(__dirname + '/../../frontend/index.html');
});

app.get('/:page', (req, res) => {
  const page = req.params.page;
  // Nur alphanumerisch + Bindestrich erlauben (Sicherheit)
  if (!/^[a-z0-9\-]+$/.test(page)) {
    return res.status(400).send('Invalid page');
  }
  res.sendFile(__dirname + `/../../frontend/${page}.html`, (err) => {
    if (err) {
      res.status(404).sendFile(__dirname + '/../../frontend/index.html');
    }
  });
});

// ── 404 Handler (nur für API) ─────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API Route nicht gefunden' });
  }
  // Keine API-Route: Sendfile ist die letzte Aktion der Frontend-Routes
  res.status(404).sendFile(__dirname + '/../../frontend/index.html');
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.status || 500).json({ error: err.message, stack: err.stack });
  }
  res.status(err.status || 500).json({ error: 'Interner Serverfehler' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Schleswig-Netzwerk API läuft auf http://localhost:${PORT}`);
  console.log(`   Umgebung: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
