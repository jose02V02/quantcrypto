# QuantCrypto — Analisi quantitativa su dati reali

Progetto full-stack **funzionante**: React/Vite (frontend) + Node.js/Express
(backend) + Supabase (auth opzionale + PostgreSQL). Scarica prezzi storici
**reali** da CoinGecko o Binance e calcola indicatori veri (RSI, MACD, EMA/SMA,
rendimento logaritmico, volatilità annualizzata, max drawdown, Sharpe) più una
**proiezione probabilistica trasparente** (Monte Carlo / moto browniano
geometrico) con bande di confidenza.

> ⚠️ **Onestà prima di tutto.** Nessun modello prevede il mercato con certezza.
> QuantCrypto è uno strumento di analisi quantitativa e di proiezione
> *statistica* su dati reali. **Non** è consulenza finanziaria e **non** promette
> guadagni. Il mercato crypto è altamente rischioso.

## Struttura

```txt
quantcrypto/
├─ frontend/        React + Vite (dashboard, grafici)
│  └─ src/          App.jsx, api.js, supabase.js, style.css
├─ backend/         Node.js + Express
│  └─ src/          server.js, indicators.js, forecast.js, providers.js, analyze.js
├─ supabase/        schema PostgreSQL + RLS
├─ render.yaml      deploy backend su Render
├─ netlify.toml     deploy frontend su Netlify
├─ vercel.json      deploy frontend su Vercel
└─ package.json     workspace root (frontend + backend)
```

## Cosa calcola davvero

| Indicatore | Significato |
|---|---|
| RSI 14 (Wilder) | momentum, ipercomprato/ipervenduto |
| MACD (12,26,9) | incrocio medie esponenziali, momentum |
| EMA 20 / 50, SMA 200 | trend |
| Rendimento periodo | performance totale sul range |
| Volatilità annualizzata | rischio (dev. std rendimenti log × √365) |
| Max drawdown | peggior calo dal picco |
| Sharpe ratio | rendimento corretto per il rischio |
| Proiezione Monte Carlo | mediana, banda 5–95%, probabilità di rialzo |

Il **verdetto** (RIALZISTA / NEUTRALE / RIBASSISTA) è una sintesi euristica e
trasparente dei segnali sopra — non un consiglio.

## Avvio locale

```bash
npm install            # installa frontend + backend (workspaces)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev            # avvia backend (3001) e frontend (5173) insieme
```

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3001/health`
- Test backend: `npm test`

L'analisi di mercato funziona **anche senza Supabase**. Supabase serve solo per
login Google e watchlist salvata su database.

## Configurazione `.env`

**backend/.env**
```
PORT=3001
FRONTEND_URL=http://localhost:5173
MARKET_PROVIDER=coingecko          # oppure binance
SUPABASE_URL=...                   # opzionale (auth + watchlist)
SUPABASE_ANON_KEY=...              # opzionale
SUPABASE_SERVICE_ROLE_KEY=...      # SEGRETA, solo backend
```

**frontend/.env**
```
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=...              # opzionale
VITE_SUPABASE_ANON_KEY=...         # opzionale, mai la service role
```

## Supabase (opzionale)

1. Crea un progetto su Supabase.
2. SQL Editor → incolla `supabase/schema.sql`.
3. Authentication → Providers → abilita Google (Client ID/Secret da Google Cloud).
4. Authentication → URL Configuration → aggiungi `http://localhost:5173` e l'URL di produzione.

## Deploy

### Backend su Render
1. Push su GitHub.
2. Render → New → Blueprint (usa `render.yaml`) oppure Web Service con root `backend`.
3. Build: `npm install` · Start: `npm start`.
4. Env: `FRONTEND_URL`, `MARKET_PROVIDER`, e (se usi auth) le chiavi Supabase.

### Frontend su Netlify / Vercel
- Base/Root directory: `frontend`
- Build: `npm run build` · Publish: `dist`
- Env: `VITE_API_URL` (URL del backend Render), `VITE_SUPABASE_*` opzionali.

## Note tecniche

- Gli indicatori sono implementati a mano in `backend/src/indicators.js`
  (nessuna black-box), con test in `indicators.test.js`.
- La previsione (`forecast.js`) usa drift e volatilità stimati dai dati storici
  per simulare migliaia di traiettorie GBM; restituisce mediana e percentili.
  È riproducibile (seed deterministico nei test).
- I provider dati sono in `providers.js` con output normalizzato.

## Idee per evolverlo

- Aggiungere altri indicatori (Bollinger, ATR, Ichimoku).
- Backtesting di una strategia sui segnali del verdetto.
- Modelli di forecast più ricchi (GARCH per la volatilità, ARIMA, ML).
- Caching/rate-limit dei provider per evitare 403 in produzione.
- Alert su soglie RSI/prezzo via email.
