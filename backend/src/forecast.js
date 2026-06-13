// Previsione quantitativa TRASPARENTE.
//
// IMPORTANTE: nessun modello prevede il mercato con certezza. Qui usiamo due
// strumenti statistici standard e onesti:
//   1) Regressione lineare sul logaritmo dei prezzi -> trend (drift) stimato.
//   2) Proiezione Monte Carlo con Moto Browniano Geometrico (GBM) usando
//      drift e volatilita' stimati dai dati reali, per ottenere bande di
//      confidenza (mediana, 5° e 95° percentile).
//
// Il risultato e' una distribuzione di scenari probabili, NON una garanzia.

import { logReturns, mean, stdDev } from './indicators.js';

/** Regressione lineare semplice y = a + b*x. Ritorna { slope, intercept, r2 }. */
function linearRegression(y) {
  const n = y.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (y[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  // Coefficiente di determinazione R^2.
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * xs[i];
    ssRes += (y[i] - pred) ** 2;
    ssTot += (y[i] - my) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

// Generatore gaussiano (Box-Muller) con seed deterministico opzionale,
// cosi' i test sono riproducibili.
function gaussianFactory(seed = 0) {
  let s = seed || Date.now();
  const rand = () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1e9) / 1e9;
  };
  return () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return null;
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.round((p / 100) * (sortedAsc.length - 1)))
  );
  return sortedAsc[idx];
}

/**
 * Proietta i prezzi in avanti di `horizon` giorni.
 * @param {number[]} prices serie storica di prezzi di chiusura
 * @param {object} opts { horizon, simulations, seed }
 */
export function forecast(prices, opts = {}) {
  const horizon = opts.horizon ?? 30;
  const simulations = opts.simulations ?? 2000;
  const returns = logReturns(prices);
  if (returns.length < 20) return null;

  const mu = mean(returns); // drift giornaliero stimato
  const sigma = stdDev(returns); // volatilita' giornaliera stimata
  const lastPrice = prices[prices.length - 1];

  // Trend di lungo periodo dalla regressione sul log-prezzo.
  const logPrices = prices.map((p) => Math.log(p));
  const reg = linearRegression(logPrices);

  // Monte Carlo GBM.
  const gaussian = gaussianFactory(opts.seed ?? 42);
  const drift = mu - 0.5 * sigma * sigma; // correzione di Ito
  const endingPrices = [];
  // Salviamo i percorsi mediano/banda giorno per giorno.
  const dayPaths = Array.from({ length: horizon }, () => []);

  for (let sim = 0; sim < simulations; sim++) {
    let price = lastPrice;
    for (let d = 0; d < horizon; d++) {
      price = price * Math.exp(drift + sigma * gaussian());
      dayPaths[d].push(price);
    }
    endingPrices.push(price);
  }

  const band = dayPaths.map((day) => {
    const sorted = day.slice().sort((a, b) => a - b);
    return {
      p05: percentile(sorted, 5),
      median: percentile(sorted, 50),
      p95: percentile(sorted, 95),
    };
  });

  endingPrices.sort((a, b) => a - b);
  const expectedPrice = percentile(endingPrices, 50);
  const expectedReturn = expectedPrice / lastPrice - 1;
  const probUp = endingPrices.filter((p) => p > lastPrice).length / simulations;

  return {
    horizonDays: horizon,
    simulations,
    dailyDrift: mu,
    dailyVolatility: sigma,
    annualizedDrift: mu * 365,
    trendSlope: reg.slope, // pendenza giornaliera del log-prezzo
    trendR2: reg.r2, // 0..1: quanto e' "lineare" il trend
    lastPrice,
    expectedPrice,
    expectedReturn,
    probabilityUp: probUp,
    lowPrice: percentile(endingPrices, 5),
    highPrice: percentile(endingPrices, 95),
    band, // banda di confidenza giorno per giorno per il grafico
  };
}
