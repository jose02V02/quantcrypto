// Backtesting della strategia del "verdetto" sui dati storici reali.
//
// Strategia long/flat: investito al 100% quando i segnali sono rialzisti,
// in liquidita' (0%) quando sono ribassisti, mantiene la posizione quando
// sono neutri. Viene confrontata con il semplice buy & hold.
//
// REGOLA ANTI-LOOKAHEAD: la posizione del giorno t e' decisa dal segnale
// calcolato alla chiusura del giorno t-1, usando SOLO i dati fino a t-1.
// Cosi' non si "bara" guardando il futuro.

import {
  rsi,
  macd,
  ema,
  bollingerBands,
  maxDrawdown,
  sharpeRatio,
} from './indicators.js';
import { scoreSignals } from './signals.js';

const WARMUP = 50; // giorni necessari a EMA50 / MACD prima di operare

export function backtest(market, opts = {}) {
  const candles = market.candles.filter((c) => Number.isFinite(c.close));
  const closes = candles.map((c) => c.close);
  const n = closes.length;
  if (n < WARMUP + 10) {
    throw new Error(
      `Servono almeno ${WARMUP + 10} giorni per il backtest, ricevuti ${n}.`
    );
  }

  // Punteggio dei segnali alla chiusura del giorno t (solo dati 0..t).
  function scoreAt(t) {
    const slice = closes.slice(0, t + 1);
    return scoreSignals({
      rsi14: rsi(slice, 14),
      macdObj: macd(slice),
      price: slice[slice.length - 1],
      ema20: ema(slice, 20),
      ema50: ema(slice, 50),
      bb: bollingerBands(slice, 20, 2),
    }).score;
  }

  let position = 0; // 0 = liquidita', 1 = investito
  let eqStrategy = 1;
  let eqBuyHold = 1;
  let trades = 0;
  let wins = 0;
  let entryEquity = null;
  const curve = [];
  const strategyDaily = [];

  for (let i = WARMUP + 1; i < n; i++) {
    const score = scoreAt(i - 1); // deciso ieri, nessun lookahead
    let newPos = position;
    if (score >= 1) newPos = 1;
    else if (score <= -1) newPos = 0;
    // score == 0 -> mantieni la posizione

    // Contabilita' delle operazioni (un'operazione = un periodo investito).
    if (newPos === 1 && position === 0) entryEquity = eqStrategy;
    if (newPos === 0 && position === 1) {
      trades += 1;
      if (eqStrategy > entryEquity) wins += 1;
    }
    position = newPos;

    const r = closes[i] / closes[i - 1] - 1;
    eqStrategy *= 1 + position * r;
    eqBuyHold *= 1 + r;
    strategyDaily.push(position * r);
    curve.push({
      date: candles[i].date,
      strategy: eqStrategy,
      buyhold: eqBuyHold,
    });
  }

  // Chiudi un'eventuale operazione ancora aperta a fine periodo.
  if (position === 1 && entryEquity != null) {
    trades += 1;
    if (eqStrategy > entryEquity) wins += 1;
  }

  const strategyReturn = eqStrategy - 1;
  const buyHoldReturn = eqBuyHold - 1;

  return {
    source: market.source,
    symbol: market.symbol,
    points: n,
    fromDate: curve[0]?.date,
    toDate: curve[curve.length - 1]?.date,
    strategyReturn,
    buyHoldReturn,
    outperformance: strategyReturn - buyHoldReturn,
    trades,
    winRate: trades ? wins / trades : null,
    maxDrawdown: maxDrawdown(curve.map((c) => c.strategy)),
    buyHoldMaxDrawdown: maxDrawdown(curve.map((c) => c.buyhold)),
    sharpe: sharpeRatio(strategyDaily),
    finalPosition: position,
    curve,
  };
}
