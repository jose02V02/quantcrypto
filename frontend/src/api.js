import axios from 'axios';
import { supabase, supabaseEnabled } from './supabase';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
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
