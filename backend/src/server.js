import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

import { fetchMarket } from './providers.js';
import { analyzeMarket } from './analyze.js';
import { backtest } from './backtest.js';

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const DEFAULT_PROVIDER = process.env.MARKET_PROVIDER || 'coingecko';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: (origin, cb) => {
      // Consenti richieste senza origin (curl, health check) e il frontend.
      if (!origin || origin === FRONTEND_URL) return cb(null, true);
      return cb(null, true); // permissivo: il dato di mercato e' pubblico
    },
  })
);

// --- Supabase admin client (opzionale: serve solo per auth + watchlist) ---
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseEnabled = Boolean(supabaseUrl && serviceKey);
const supabaseAdmin = supabaseEnabled
  ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  : null;

if (!supabaseEnabled) {
  console.warn(
    '[quantcrypto] Supabase non configurato: auth e watchlist disabilitate. ' +
      'L\'analisi di mercato funziona comunque.'
  );
}

// Middleware: verifica il Bearer token Supabase e popola req.user.
async function requireAuth(req, res, next) {
  if (!supabaseEnabled) {
    return res.status(503).json({ error: 'Auth non configurata sul server.' });
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token mancante.' });
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Token non valido.' });
  }
  req.user = data.user;
  next();
}

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    supabase: supabaseEnabled,
    defaultProvider: DEFAULT_PROVIDER,
    time: new Date().toISOString(),
  });
});

// --- Analisi di mercato (cuore dell'app) ---
app.get('/api/market/analyze', async (req, res) => {
  try {
    const coin = req.query.coin || 'bitcoin';
    const provider = req.query.provider || DEFAULT_PROVIDER;
    const days = Math.min(1000, Math.max(35, Number(req.query.days) || 180));
    const horizon = Math.min(180, Math.max(7, Number(req.query.horizon) || 30));
    const currency = req.query.currency || 'usd';

    const market = await fetchMarket(provider, coin, days, currency);
    const analysis = analyzeMarket(market, { forecastHorizon: horizon });
    res.json({ source: analysis.source, analysis });
  } catch (e) {
    const status = e.response?.status === 404 ? 404 : 400;
    res.status(status).json({
      error: e.response?.data?.error || e.message || 'Errore di analisi',
    });
  }
});

// --- Backtesting della strategia ---
app.get('/api/market/backtest', async (req, res) => {
  try {
    const coin = req.query.coin || 'bitcoin';
    const provider = req.query.provider || DEFAULT_PROVIDER;
    const days = Math.min(1000, Math.max(60, Number(req.query.days) || 365));
    const currency = req.query.currency || 'usd';
    const market = await fetchMarket(provider, coin, days, currency);
    const result = backtest(market);
    res.json(result);
  } catch (e) {
    const status = e.response?.status === 404 ? 404 : 400;
    res.status(status).json({
      error: e.response?.data?.error || e.message || 'Errore di backtest',
    });
  }
});

// --- Watchlist (richiede login Supabase) ---
app.get('/api/watchlist', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('watchlists')
    .select('id, symbol, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/watchlist', requireAuth, async (req, res) => {
  const symbol = String(req.body?.symbol || '').trim();
  if (!symbol) return res.status(400).json({ error: 'symbol mancante.' });
  const { data, error } = await supabaseAdmin
    .from('watchlists')
    .upsert(
      { user_id: req.user.id, symbol },
      { onConflict: 'user_id,symbol' }
    )
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete('/api/watchlist/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('watchlists')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`[quantcrypto] backend in ascolto su http://localhost:${PORT}`);
});

export default app;
