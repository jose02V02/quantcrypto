# UltimaOra Live 🔴

**Aggregatore intelligente di notizie in tempo reale.**  
Dashboard dark-mode premium ispirata a Bloomberg + AI aesthetic — feed RSS aggiornati ogni 60 secondi, breaking news, filtri per categoria, ricerca live.

---

## Struttura del progetto

```
ultimaora-live/
├── backend/               Node.js + Express
│   ├── src/
│   │   ├── server.js      Entry point, routes
│   │   ├── feedService.js Fetching RSS, normalizzazione, deduplication
│   │   ├── cache.js       Cache in-memory con TTL
│   │   └── feeds.config.js Feed RSS configurati + keyword breaking
│   ├── package.json
│   └── .env.example
│
├── frontend/              React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css      Design system dark mode completo
│   │   ├── components/
│   │   │   ├── Header.jsx           Logo, countdown ring, pulsante refresh
│   │   │   ├── BreakingNewsTicker.jsx Ticker animato breaking news
│   │   │   ├── CategoryFilter.jsx   Tab filtro categorie
│   │   │   ├── SearchBar.jsx        Ricerca con debounce
│   │   │   ├── NewsCard.jsx         Card con glassmorphism + animazioni
│   │   │   ├── NewsGrid.jsx         Griglia responsive a colonne
│   │   │   ├── Loader.jsx           Skeleton loader animato
│   │   │   └── ErrorMessage.jsx     Gestione errori con retry
│   │   ├── hooks/
│   │   │   ├── useNews.js           Auto-refresh, countdown, stato
│   │   │   └── useDebounce.js       Debounce ricerca
│   │   └── utils/
│   │       ├── api.js               Client HTTP per il backend
│   │       └── helpers.js           timeAgo, colori categorie
│   ├── index.html
│   ├── vite.config.js     Proxy /api → backend in dev
│   └── package.json
│
├── package.json           Script root
├── render.yaml            Deploy backend su Render
├── vercel.json            Deploy frontend su Vercel
└── README.md
```

---

## Installazione locale

### Prerequisiti
- Node.js ≥ 18
- npm ≥ 9

### 1. Clona il repository

```bash
git clone https://github.com/jose02v02/quantcrypto.git ultimaora-live
cd ultimaora-live
```

### 2. Installa le dipendenze

```bash
# Backend
cd backend && npm install

# Frontend (in un altro terminale)
cd frontend && npm install
```

### 3. Configura il backend

```bash
cp backend/.env.example backend/.env
# Modifica .env se vuoi cambiare PORT o ALLOWED_ORIGINS
```

### 4. Avvio in sviluppo

Terminale 1 — Backend:
```bash
cd backend
npm run dev
# → http://localhost:3001
```

Terminale 2 — Frontend:
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

Il frontend usa il proxy Vite per girare le chiamate `/api/*` al backend locale. Non serve configurare nulla.

### 5. Verifica

- Frontend: http://localhost:5173
- Backend health: http://localhost:3001/api/health
- News API: http://localhost:3001/api/news
- Breaking: http://localhost:3001/api/news/breaking

---

## Deploy in produzione

### Backend su Render (gratuito)

1. Vai su [render.com](https://render.com) → **New → Web Service**
2. Connetti il tuo repository GitHub
3. Impostazioni:
   - **Root directory**: `backend`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
4. Aggiungi le variabili d'ambiente:
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=https://tuo-frontend.vercel.app`
5. Il file `render.yaml` nella root automatizza questo processo.

### Frontend su Vercel (gratuito)

1. Vai su [vercel.com](https://vercel.com) → **New Project**
2. Importa il repository
3. Impostazioni:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Output directory**: `frontend/dist`
4. Aggiungi variabile d'ambiente:
   - `VITE_API_URL=https://tuo-backend.onrender.com`
5. Deploy!

---

## Trasformarlo in PWA

La base PWA è già inclusa (`/frontend/public/manifest.json`). Per completarla:

1. **Service Worker** — Aggiungi `vite-plugin-pwa`:
   ```bash
   cd frontend && npm install vite-plugin-pwa -D
   ```
   In `vite.config.js`:
   ```js
   import { VitePWA } from 'vite-plugin-pwa'
   plugins: [react(), VitePWA({ registerType: 'autoUpdate' })]
   ```

2. **Icone** — Aggiungi `icon-192.png` e `icon-512.png` in `frontend/public/`

3. **Offline cache** — Il service worker di VitePWA fa precaching automatico della shell.

4. **Push notifications** — Usa l'API Web Push + un server di notifiche per le breaking news.

---

## Idee monetizzazione futura

| Livello | Idea |
|---------|------|
| **Freemium** | Feed base gratis, feed premium (borsa, crypto, wire) a pagamento |
| **Newsletter** | Digest giornaliero via email (integra Resend o Mailgun) |
| **API pubblica** | Vendi accesso all'API aggregata con rate limiting per tier |
| **Advertising** | Banner contestuali per categoria (Tech → prodotti tech) |
| **White-label** | Dashboard personalizzabile per testate e PR agencies |
| **AI Summary** | Riassunti automatici con Claude API — feature premium |

---

## Roadmap MVP → Prodotto serio

### ✅ v1.0 — MVP (ora)
- [x] Feed RSS multi-sorgente con cache
- [x] Dashboard dark mode responsive
- [x] Breaking news ticker
- [x] Filtri categoria + ricerca
- [x] Auto-refresh 60s con countdown
- [x] Skeleton loader + gestione errori
- [x] Deploy su Vercel + Render

### 🔧 v1.5 — Qualità
- [ ] Paginazione infinita (IntersectionObserver)
- [ ] Icone e immagini lazy load ottimizzate
- [ ] Modalità lettura (full-screen card)
- [ ] Preferenze utente in localStorage
- [ ] Test E2E con Playwright

### 🚀 v2.0 — Features
- [ ] Auth utente (Clerk o Supabase)
- [ ] Feed personalizzati per utente
- [ ] Salvataggio articoli preferiti
- [ ] Push notification per breaking news
- [ ] Ricerca full-text con indice locale (FlexSearch)
- [ ] Supporto dark/light mode toggle

### 🤖 v3.0 — AI Layer
- [ ] Riassunto automatico articoli (Claude API)
- [ ] Sentiment analysis per mercati
- [ ] Cluster automatico di notizie correlate
- [ ] Feed curato da AI: "Top 5 del momento"
- [ ] Traduzione automatica articoli internazionali

### 📊 v4.0 — Data
- [ ] Database PostgreSQL per storico notizie
- [ ] Analytics articoli più letti / trending
- [ ] Grafico trending topics nel tempo
- [ ] Export dati / API pubblica

---

## Feed RSS configurati

| Testata | Categoria |
|---------|-----------|
| ANSA | Italia |
| Repubblica | Italia |
| Corriere della Sera | Italia |
| TGCom24 | Italia |
| BBC World | Mondo |
| Reuters | Mondo |
| TechCrunch | Tech |
| The Verge | Tech |
| Hacker News | Tech |
| Wired | Tech |
| Il Sole 24 Ore | Economia |
| Gazzetta dello Sport | Sport |

> Le notizie appartengono alle rispettive testate. UltimaOra Live mostra solo titolo, estratto e link alla fonte originale, nel rispetto del copyright.

---

## Licenza

MIT — Uso libero, credita la fonte delle notizie.
