// Indicatori tecnici e statistici calcolati su serie di prezzi reali.
// Tutte le funzioni sono pure e prive di dipendenze esterne, cosi' i
// risultati sono verificabili e riproducibili.

/** Media mobile semplice (SMA) sull'ultima finestra `period`. */
export function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Media mobile esponenziale (EMA) calcolata su tutta la serie.
 * Ritorna l'array completo delle EMA (stessa lunghezza dei valori
 * a partire dall'indice period-1), utile per MACD e per i grafici.
 */
export function emaSeries(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const out = [];
  // Seed: SMA dei primi `period` valori.
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

/** Ultimo valore EMA, oppure null se la serie e' troppo corta. */
export function ema(values, period) {
  const series = emaSeries(values, period);
  return series.length ? series[series.length - 1] : null;
}

/**
 * RSI di Wilder. Ritorna l'ultimo valore (0-100) o null.
 * Usa lo smoothing esponenziale classico di Wilder.
 */
export function rsi(values, period = 14) {
  if (values.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * MACD classico (12, 26, 9). Ritorna { macd, signal, histogram } sull'ultimo
 * punto disponibile, oppure null se la serie e' troppo corta.
 */
export function macd(values, fast = 12, slow = 26, signalPeriod = 9) {
  if (values.length < slow + signalPeriod) return null;
  const emaFast = emaSeries(values, fast);
  const emaSlow = emaSeries(values, slow);
  // Allinea le due serie sulla coda (la slow e' piu' corta).
  const offset = emaFast.length - emaSlow.length;
  const macdLine = emaSlow.map((v, i) => emaFast[i + offset] - v);
  const signalLine = emaSeries(macdLine, signalPeriod);
  if (!signalLine.length) return null;
  const macdVal = macdLine[macdLine.length - 1];
  const signalVal = signalLine[signalLine.length - 1];
  return { macd: macdVal, signal: signalVal, histogram: macdVal - signalVal };
}

/** Rendimenti logaritmici giornalieri. */
export function logReturns(values) {
  const out = [];
  for (let i = 1; i < values.length; i++) {
    out.push(Math.log(values[i] / values[i - 1]));
  }
  return out;
}

/** Rendimento totale sul periodo (frazione, es. 0.25 = +25%). */
export function totalReturn(values) {
  if (values.length < 2) return null;
  return values[values.length - 1] / values[0] - 1;
}

/** Media aritmetica. */
export function mean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Deviazione standard campionaria (n-1). */
export function stdDev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Volatilita' annualizzata a partire dai rendimenti log giornalieri.
 * 365 perche' i mercati crypto operano ogni giorno.
 */
export function annualizedVolatility(returns, periodsPerYear = 365) {
  return stdDev(returns) * Math.sqrt(periodsPerYear);
}

/** Massimo drawdown (frazione negativa, es. -0.42 = -42%). */
export function maxDrawdown(values) {
  if (values.length < 2) return 0;
  let peak = values[0];
  let maxDd = 0;
  for (const v of values) {
    if (v > peak) peak = v;
    const dd = v / peak - 1;
    if (dd < maxDd) maxDd = dd;
  }
  return maxDd;
}

/**
 * Serie di Bande di Bollinger (rolling). Ritorna un array allineato ai valori:
 * null finche' non c'e' abbastanza storia, poi { upper, middle, lower }.
 * Usa la deviazione standard di popolazione (denominatore = period), come da
 * convenzione di Bollinger.
 */
export function bollingerSeries(values, period = 20, mult = 2) {
  const out = values.map(() => null);
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const m = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((acc, v) => acc + (v - m) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    out[i] = { upper: m + mult * sd, middle: m, lower: m - mult * sd };
  }
  return out;
}

/**
 * Bande di Bollinger sull'ultimo punto + indicatori derivati:
 *  - percentB: posizione del prezzo nella banda (0 = banda bassa, 1 = alta)
 *  - bandwidth: ampiezza relativa della banda (volatilita')
 */
export function bollingerBands(values, period = 20, mult = 2) {
  const series = bollingerSeries(values, period, mult);
  const last = series[series.length - 1];
  if (!last) return null;
  const price = values[values.length - 1];
  const width = last.upper - last.lower;
  return {
    upper: last.upper,
    middle: last.middle,
    lower: last.lower,
    percentB: width === 0 ? null : (price - last.lower) / width,
    bandwidth: last.middle === 0 ? null : width / last.middle,
  };
}

/**
 * ATR (Average True Range) di Wilder su `period` giorni.
 * Richiede massimi, minimi e chiusure. Se il provider non fornisce
 * high/low (es. CoinGecko market_chart), high=low=close e l'ATR si riduce
 * alla media delle variazioni assolute giornaliere.
 */
export function atr(highs, lows, closes, period = 14) {
  const n = closes.length;
  if (n < period + 1) return null;
  const trs = [];
  for (let i = 1; i < n; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  let atrVal = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atrVal = (atrVal * (period - 1) + trs[i]) / period;
  }
  return atrVal;
}

/** Sharpe ratio annualizzato (risk-free = 0 di default). */
export function sharpeRatio(returns, periodsPerYear = 365, riskFree = 0) {
  if (returns.length < 2) return null;
  const sd = stdDev(returns);
  if (sd === 0) return null;
  const excess = mean(returns) - riskFree / periodsPerYear;
  return (excess / sd) * Math.sqrt(periodsPerYear);
}
