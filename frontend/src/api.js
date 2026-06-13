import axios from 'axios';
import { supabase, supabaseEnabled } from './supabase';

// In produzione su Vercel le API sono same-origin (/api/*) come funzioni
// serverless, quindi baseURL vuoto. In locale con il backend Express imposta
// VITE_API_URL=http://localhost:3001 nel file frontend/.env.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Allega automaticamente il token Supabase quando l'utente e' loggato.
api.interceptors.request.use(async (config) => {
  if (supabaseEnabled && supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
