// Compone gli indicatori + la previsione in un unico oggetto di analisi
// pronto per il frontend, con un "verdetto" euristico trasparente.

import {
  rsi,
  macd,
  ema,
  sma,
  logReturns,
  totalReturn,
  annualizedVolatility,
  maxDrawdown,
  sharpeRatio,
} from './indicators.js';
import { forecast } from './forecast.js';

/**
 * Verdetto euristico basato su segnali standard. NON e' un consiglio
 * finanziario: e' una sintesi leggibile dei segnali calcolati.
 */
function buildVerdict({ rsi14, macdObj, price, ema20, ema50, fc }) {
  let score = 0;
  const reasons = [];

  if (rsi14 != null) {
    if (rsi14 < 30) {
      score += 1;
      reasons.push('RSI in ipervenduto (<30)');
    } else if (rsi14 > 70) {
      score -= 1;
      reasons.push('RSI in ipercomprato (>70)');
    }
  }
  if (macdObj && macdObj.histogram != null) {
    if (macdObj.histogram > 0) {
      score += 1;
      reasons.push('MACD sopra la signal (momentum positivo)');
    } else {
      score -= 1;
      reasons.push('MACD sotto la signal (momentum negativo)');
    }
  }
  if (price != null && ema20 != null && ema50 != null) {
    if (price > ema20 && ema20 > ema50) {
      score += 1;
      reasons.push('Prezzo sopra EMA20 sopra EMA50 (trend rialzista)');
    } else if (price < ema20 && ema20 < ema50) {
      score -= 1;
      reasons.push('Prezzo sotto EMA20 sotto EMA50 (trend ribassista)');
    }
  }
  if (fc && fc.probabilityUp != null) {
    if (fc.probabilityUp > 0.55) {
      score += 1;
      reasons.push(`Proiezione MC: ${(fc.probabilityUp * 100).toFixed(0)}% prob. al rialzo`);
    } else if (fc.probabilityUp < 0.45) {
      score -= 1;
      reasons.push(`Proiezione MC: ${((1 - fc.probabilityUp) * 100).toFixed(0)}% prob. al ribasso`);
    }
  }

  let label = 'NEUTRALE';
  if (score >= 2) label = 'RIALZISTA';
  else if (score <= -2) label = 'RIBASSISTA';
  return { label, score, reasons };
}

/**
 * @param {{source:string, symbol:string, candles:{date:string, close:number}[]}} market
 * @param {object} opts { forecastHorizon }
 */
export function analyzeMarket(market, opts = {}) {
  const candles = market.candles.filter((c) => Number.isFinite(c.close));
  const closes = candles.map((c) => c.close);
  if (closes.length < 35) {
    throw new Error(
      `Servono almeno 35 punti di dati, ricevuti ${closes.length}. Aumenta "days".`
    );
  }

  const returns = logReturns(closes);
  const rsi14 = rsi(closes, 14);
  const macdObj = macd(closes);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const sma200 = sma(closes, 200);
  const latestPrice = closes[closes.length - 1];
  const fc = forecast(closes, { horizon: opts.forecastHorizon ?? 30 });

  const verdict = buildVerdict({
    rsi14,
    macdObj,
    price: latestPrice,
    ema20,
    ema50,
    fc,
  });

  return {
    source: market.source,
    symbol: market.symbol,
    points: closes.length,
    latestPrice,
    rsi14,
    macd: macdObj,
    ema20,
    ema50,
    sma200,
    totalReturn: totalReturn(closes),
    volatilityAnnualized: annualizedVolatility(returns),
    maxDrawdown: maxDrawdown(closes),
    sharpeRatio: sharpeRatio(returns),
    forecast: fc,
    verdict,
    chart: candles, // [{date, close}]
  };
}
