// Funzione serverless Vercel: /api/watchlist (GET elenco, POST aggiungi).
// Richiede Supabase configurato (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const enabled = Boolean(url && key);
const admin = enabled
  ? createClient(url, key, { auth: { persistSession: false } })
  : null;

async function getUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export default async function handler(req, res) {
  if (!enabled) {
    return res.status(503).json({ error: 'Auth non configurata sul server.' });
  }
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Token non valido.' });

  if (req.method === 'GET') {
    const { data, error } = await admin
      .from('watchlists')
      .select('id, symbol, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const symbol = String(req.body?.symbol || '').trim();
    if (!symbol) return res.status(400).json({ error: 'symbol mancante.' });
    const { data, error } = await admin
      .from('watchlists')
      .upsert({ user_id: user.id, symbol }, { onConflict: 'user_id,symbol' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.status(405).json({ error: 'Metodo non permesso.' });
}
