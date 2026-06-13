// Provider di dati di mercato REALI. Scaricano serie storiche di prezzi di
// chiusura giornalieri da CoinGecko o Binance.
//
// Output normalizzato per entrambi i provider:
//   { source, symbol, currency, asOf, candles: [{ date, close, high, low }] }
// Nota: CoinGecko market_chart fornisce solo il prezzo -> high/low = close.

import axios from 'axios';

const http = axios.create({ timeout: 15000 });

// Cache in memoria con TTL. Riduce le chiamate alle API (importante per il
// limite gratuito di CoinGecko, 429). Su Vercel persiste finche' l'istanza
// serverless resta "calda": copre i click ravvicinati dello stesso utente.
const cache = new Map(); // key -> { exp, data }

async function cachedGet(url, params, ttlMs) {
  const key = `${url}?${JSON.stringify(params)}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.exp > now) return hit.data;
  const { data } = await http.get(url, { params });
  cache.set(key, { exp: now + ttlMs, data });
  return data;
}

// Traduce gli errori delle API in messaggi chiari per l'utente.
function translateError(e, provider) {
  const status = e.response?.status;
  if (status === 429) {
    const err = new Error(
      provider === 'coingecko'
        ? 'Troppe richieste a CoinGecko (limite del piano gratuito). Attendi ~1 minuto oppure passa a Binance.'
        : 'Troppe richieste al provider. Attendi qualche secondo e riprova.'
    );
    err.statusCode = 429;
    return err;
  }
  return e;
}

/**
 * CoinGecko: market_chart con `days`. L'id e' il nome coin (es. "bitcoin").
 * API pubblica, nessuna chiave richiesta per uso base.
 */
export async function fetchCoinGecko(coin, days, currency = 'usd') {
  const id = String(coin || '').trim().toLowerCase();
  const vs = String(currency || 'usd').trim().toLowerCase();
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
    id
  )}/market_chart`;

  let data;
  try {
    // Lo storico giornaliero cambia poco: TTL generoso (5 min).
    data = await cachedGet(
      url,
      { vs_currency: vs, days, interval: 'daily' },
      5 * 60 * 1000
    );
  } catch (e) {
    throw translateError(e, 'coingecko');
  }
  if (!data?.prices?.length) {
    throw new Error(`Nessun dato da CoinGecko per "${id}"`);
  }
  const candles = data.prices.map(([ts, close]) => ({
    date: new Date(ts).toISOString().slice(0, 10),
    close,
    high: close, // market_chart non espone OHLC: high/low = close
    low: close,
  }));

  // Prezzo "live": market_chart e' a granularita' giornaliera, quindi l'ultimo
  // punto e' una chiusura potenzialmente vecchia di ore. Recuperiamo lo spot
  // piu' recente (cache 30s) e aggiorniamo/aggiungiamo l'ultimo punto. Se
  // fallisce (es. 429), restiamo sulla chiusura giornaliera senza errori.
  let asOf = candles[candles.length - 1]?.date;
  try {
    const live = await cachedGet(
      'https://api.coingecko.com/api/v3/simple/price',
      { ids: id, vs_currencies: vs, include_last_updated_at: true },
      30 * 1000
    );
    const px = live?.[id]?.[vs];
    const ts = live?.[id]?.last_updated_at;
    if (Number.isFinite(px)) {
      const isoTs = ts ? new Date(ts * 1000).toISOString() : new Date().toISOString();
      const day = isoTs.slice(0, 10);
      const last = candles[candles.length - 1];
      if (day > last.date) {
        candles.push({ date: day, close: px, high: px, low: px });
      } else {
        last.close = px;
        last.high = Math.max(last.high, px);
        last.low = Math.min(last.low, px);
      }
      asOf = isoTs;
    }
  } catch {
    /* lo spot non e' essenziale: usiamo la chiusura giornaliera */
  }

  return { source: 'coingecko', symbol: id, currency: vs, asOf, candles };
}

/**
 * Binance: klines giornaliere. Il symbol e' la coppia (es. "BTCUSDT").
 * limit max 1000 candele.
 */
export async function fetchBinance(symbol, days) {
  const sym = String(symbol || '').trim().toUpperCase();
  const limit = Math.min(1000, Math.max(35, Number(days) || 180));
  const url = 'https://api.binance.com/api/v3/klines';

  let data;
  try {
    data = await cachedGet(url, { symbol: sym, interval: '1d', limit }, 60 * 1000);
  } catch (e) {
    throw translateError(e, 'binance');
  }
  if (!Array.isArray(data) || !data.length) {
    throw new Error(`Nessun dato da Binance per "${sym}"`);
  }
  // kline: [openTime, open, high, low, close, volume, closeTime, ...]
  const candles = data.map((k) => ({
    date: new Date(k[0]).toISOString().slice(0, 10),
    close: Number(k[4]),
    high: Number(k[2]),
    low: Number(k[3]),
  }));
  // Le coppie Binance sono in USDT (~USD): la valuta e' fissa.
  // L'ultima candela giornaliera e' "in formazione": il suo close e' gia' il
  // prezzo live, quindi asOf = adesso.
  return {
    source: 'binance',
    symbol: sym,
    currency: 'usd',
    asOf: new Date().toISOString(),
    candles,
  };
}

export async function fetchMarket(provider, symbol, days, currency = 'usd') {
  if (provider === 'binance') return fetchBinance(symbol, days);
  return fetchCoinGecko(symbol, days, currency);
}
