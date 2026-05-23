# QuantumTrade Real Full-Stack

Progetto reale full-stack: React/Vite frontend, Node.js/Express backend, Supabase Auth + PostgreSQL, prezzi reali da CoinGecko o Binance, calcoli tecnici reali: RSI, MACD, EMA, rendimento logaritmico, volatilità e drawdown.

## Struttura

```txt
quantcrypto-real/
├─ frontend/        React + Vite
├─ backend/         Node.js + Express
├─ supabase/        schema PostgreSQL + RLS
├─ render.yaml      deploy backend Render
├─ netlify.toml     deploy frontend Netlify
└─ package.json     workspace root
```

## 1. Crea Supabase

1. Crea un progetto su Supabase.
2. Vai in SQL Editor e incolla `supabase/schema.sql`.
3. Vai in Authentication → Providers → abilita Google.
4. Inserisci Client ID e Client Secret di Google Cloud.
5. In Authentication → URL Configuration aggiungi:
   - local: `http://localhost:5173`
   - produzione: URL Netlify/Vercel del frontend.

## 2. Configura `.env`

Copia gli esempi:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Compila le chiavi Supabase. Nel frontend usa solo `anon key`. Nel backend usa anche `service role key`, ma non pubblicarla mai nel frontend.

## 3. Avvio locale

```bash
npm install
npm run install:all
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3001`  
Test backend: `http://localhost:3001/health`

## 4. Come funziona davvero

- Il frontend chiama `/api/market/analyze`.
- Il backend scarica serie storiche reali da CoinGecko o Binance.
- Il backend calcola indicatori matematici reali con dati storici reali.
- La dashboard mostra solo risultati derivati da API reali.
- La watchlist viene salvata su PostgreSQL/Supabase per l'utente autenticato.

## 5. Deploy consigliato

### Backend su Render

1. Carica il progetto su GitHub.
2. Su Render: New → Web Service.
3. Root directory: `backend`.
4. Build command: `npm install`.
5. Start command: `npm start`.
6. Aggiungi env:
   - `FRONTEND_URL=https://tuo-frontend.netlify.app`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MARKET_PROVIDER=coingecko`

### Frontend su Netlify

1. New site from Git.
2. Base directory: `frontend`.
3. Build command: `npm run build`.
4. Publish directory: `frontend/dist` oppure `dist` se base è `frontend`.
5. Env:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL=https://tuo-backend.onrender.com`

### Frontend su Vercel

1. Importa repository.
2. Framework: Vite.
3. Root directory: `frontend`.
4. Env uguali a Netlify.
5. Le variabili esposte al browser devono iniziare con `VITE_`.

## 6. Nota importante

Questo progetto non promette guadagni e non è consulenza finanziaria. Produce analisi quantitativa su dati reali, ma il mercato crypto resta altamente rischioso.
