// Provider di dati di mercato REALI. Scaricano serie storiche di prezzi di
// chiusura giornalieri da CoinGecko o Binance.
//
// Output normalizzato per entrambi i provider:
//   { source, symbol, candles: [{ date, close, high, low }] }
// Nota: CoinGecko market_chart fornisce solo il prezzo -> high/low = close.

import axios from 'axios';

const http = axios.create({ timeout: 15000 });

/**
 * CoinGecko: market_chart con `days`. L'id e' il nome coin (es. "bitcoin").
 * API pubblica, nessuna chiave richiesta per uso base.
 */
export async function fetchCoinGecko(coin, days) {
  const id = String(coin || '').trim().toLowerCase();
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
    id
  )}/market_chart`;
  const { data } = await http.get(url, {
    params: { vs_currency: 'usd', days, interval: 'daily' },
  });
  if (!data?.prices?.length) {
    throw new Error(`Nessun dato da CoinGecko per "${id}"`);
  }
  const candles = data.prices.map(([ts, close]) => ({
    date: new Date(ts).toISOString().slice(0, 10),
    close,
    high: close, // market_chart non espone OHLC: high/low = close
    low: close,
  }));
  return { source: 'coingecko', symbol: id, candles };
}

/**
 * Binance: klines giornaliere. Il symbol e' la coppia (es. "BTCUSDT").
 * limit max 1000 candele.
 */
export async function fetchBinance(symbol, days) {
  const sym = String(symbol || '').trim().toUpperCase();
  const limit = Math.min(1000, Math.max(35, Number(days) || 180));
  const url = 'https://api.binance.com/api/v3/klines';
  const { data } = await http.get(url, {
    params: { symbol: sym, interval: '1d', limit },
  });
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
  return { source: 'binance', symbol: sym, candles };
}

export async function fetchMarket(provider, symbol, days) {
  if (provider === 'binance') return fetchBinance(symbol, days);
  return fetchCoinGecko(symbol, days);
}
