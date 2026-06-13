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
  bollingerBands,
  bollingerSeries,
  atr,
} from './indicators.js';
import { forecast } from './forecast.js';
import { scoreSignals } from './signals.js';

/**
 * Verdetto euristico basato su segnali standard. NON e' un consiglio
 * finanziario: e' una sintesi leggibile dei segnali calcolati.
 * Riusa scoreSignals (segnali deterministici) e aggiunge la proiezione MC.
 */
function buildVerdict({ rsi14, macdObj, price, ema20, ema50, fc, bb }) {
  const base = scoreSignals({ rsi14, macdObj, price, ema20, ema50, bb });
  let score = base.score;
  const reasons = [...base.reasons];

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
  const highs = candles.map((c) => (Number.isFinite(c.high) ? c.high : c.close));
  const lows = candles.map((c) => (Number.isFinite(c.low) ? c.low : c.close));
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
  const bb = bollingerBands(closes, 20, 2);
  const bbSeries = bollingerSeries(closes, 20, 2);
  const atr14 = atr(highs, lows, closes, 14);
  const fc = forecast(closes, { horizon: opts.forecastHorizon ?? 30 });

  const verdict = buildVerdict({
    rsi14,
    macdObj,
    price: latestPrice,
    ema20,
    ema50,
    fc,
    bb,
  });

  // Grafico storico con overlay delle bande di Bollinger.
  const chart = candles.map((c, i) => ({
    date: c.date,
    close: c.close,
    bbUpper: bbSeries[i]?.upper ?? null,
    bbLower: bbSeries[i]?.lower ?? null,
  }));

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
    bollinger: bb,
    atr14,
    atrPercent: atr14 != null ? atr14 / latestPrice : null,
    totalReturn: totalReturn(closes),
    volatilityAnnualized: annualizedVolatility(returns),
    maxDrawdown: maxDrawdown(closes),
    sharpeRatio: sharpeRatio(returns),
    forecast: fc,
    verdict,
    chart, // [{date, close, bbUpper, bbLower}]
  };
}
