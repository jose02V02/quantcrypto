import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase e' OPZIONALE: serve solo per login e watchlist.
// Se le chiavi non sono configurate, l'analisi di mercato funziona comunque.
export const supabaseEnabled = Boolean(url && anon);
export const supabase = supabaseEnabled ? createClient(url, anon) : null;
