// Punteggio dei segnali tecnici DETERMINISTICI (senza Monte Carlo).
// Condiviso tra l'analisi (verdetto) e il backtesting, cosi' la strategia
// testata e' esattamente quella mostrata in dashboard.

export function scoreSignals({ rsi14, macdObj, price, ema20, ema50, bb }) {
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
  if (bb && bb.percentB != null) {
    if (bb.percentB < 0.05) {
      score += 1;
      reasons.push('Prezzo sulla banda di Bollinger inferiore (possibile rimbalzo)');
    } else if (bb.percentB > 0.95) {
      score -= 1;
      reasons.push('Prezzo sulla banda di Bollinger superiore (possibile eccesso)');
    }
  }

  return { score, reasons };
}
