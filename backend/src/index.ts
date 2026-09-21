import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import recommendRoutes from './routes/recommend';
import emiRoutes from './routes/emi';
import partnersRoutes from './routes/partners';
import chatRoutes from './routes/chat';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import userAuthRoutes from './routes/userAuth';
import chatsRoutes from './routes/chats';
import ttsRoutes from './routes/tts';
import sttRoutes from './routes/stt';
import registrationRoutes from './routes/registration';
import telegramRoutes from './routes/telegram';
import { TelegramBotService } from './services/TelegramBotService';
import { pool } from './db/pool';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

// ── Main API (port 4000) ──────────────────────────────────────────────────────

const app = express();

const rawFrontendUrl = process.env.FRONTEND_URL?.trim();
const configuredOrigins = rawFrontendUrl
  ? rawFrontendUrl.split(',').map((u) => u.trim().replace(/\/+$/, ''))
  : [];

const isAllowedOrigin = (origin: string): boolean => {
  try {
    const parsed = new URL(origin);
    const originClean = `${parsed.protocol}//${parsed.host}`;

    // Explicit configured frontend origins (e.g. from FRONTEND_URL env var)
    if (configuredOrigins.includes(originClean) || configuredOrigins.includes(origin)) {
      return true;
    }

    // Automatically allow Vercel domains (production & branch preview deployments)
    if (parsed.hostname.endsWith('.vercel.app') || parsed.hostname === 'vercel.app') {
      return true;
    }

    // Localhost & local development ports / network IPs
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)
    ) {
      return true;
    }
  } catch {}

  return false;
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/api/chat', chatRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/stt', sttRoutes);
app.use('/api/users', userAuthRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/telegram', telegramRoutes);

// Serve static uploads
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
app.use('/api/auth', authRoutes);           // admin auth
app.use('/api/admin', adminRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/emi', emiRoutes);
app.use('/api/partners', partnersRoutes);

app.get('/api/health', (_req, res) => { res.json({ status: 'ok' }); });

// Public schemes endpoint (no auth needed)
app.get('/api/schemes', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM schemes WHERE active = TRUE ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schemes' });
  }
});

// Compare schemes endpoint
app.get('/api/schemes/compare', async (req, res) => {
  try {
    const idsParam = req.query.ids as string;
    if (!idsParam) {
      res.status(400).json({ error: 'ids query parameter is required (e.g. ?ids=1,2,3)' });
      return;
    }
    const ids = idsParam.split(',').map((id) => parseInt(id.trim(), 10)).filter((n) => !isNaN(n));
    if (ids.length === 0) {
      res.status(400).json({ error: 'No valid numeric IDs provided' });
      return;
    }
    const { rows } = await pool.query('SELECT * FROM schemes WHERE id = ANY($1::int[]) ORDER BY id ASC', [ids]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compare schemes' });
  }
});

// Single scheme by ID
app.get('/api/schemes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid scheme ID' });
      return;
    }
    const { rows } = await pool.query('SELECT * FROM schemes WHERE id = $1', [id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Scheme not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scheme' });
  }
});


app.use((err: Error, _req: import('express').Request, res: import('express').Response, _next: import('express').NextFunction) => {
  const msg = err?.message || String(err);
  process.stdout.write(`[express-error] ${msg}\n${err?.stack || ''}\n`);
  res.status(500).json({ error: 'Internal server error', detail: msg });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  if (TelegramBotService.isConfigured()) {
    console.log('[Telegram Bot] Initialized with token.');
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || 'https://pradarshakai.onrender.com/api/telegram/webhook';
    TelegramBotService.setWebhook(webhookUrl, process.env.TELEGRAM_WEBHOOK_SECRET)
      .then((res) => {
        if (res?.ok) {
          console.log(`[Telegram Bot] Webhook successfully registered: ${webhookUrl}`);
        } else {
          console.warn('[Telegram Bot] Webhook registration response:', res);
        }
      })
      .catch((err) => console.warn('[Telegram Bot] Webhook sync warning:', err.message));
  }
});

// ── Admin static server (port 3001) ──────────────────────────────────────────

const adminDir = fs.existsSync(path.join(__dirname, 'admin-static'))
  ? path.join(__dirname, 'admin-static')
  : path.join(__dirname, '../src/admin-static');

// In cloud environments like Render, only one HTTP port is exposed.
// Run the standalone admin server only if explicitly enabled or when running locally.
const shouldRunAdminServer =
  process.env.ENABLE_ADMIN_SERVER === 'true' ||
  (!process.env.RENDER && process.env.DISABLE_ADMIN_SERVER !== 'true');

if (shouldRunAdminServer) {
  const adminApp = express();
  adminApp.use(cors());
  adminApp.use(express.static(adminDir));
  adminApp.use((_req, res) => {
    const indexPath = path.join(adminDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Admin panel static files not found');
    }
  });

  const ADMIN_PORT = process.env.ADMIN_PORT || 3001;
  adminApp.listen(ADMIN_PORT, () => console.log(`Admin panel running on http://localhost:${ADMIN_PORT}`));
}
