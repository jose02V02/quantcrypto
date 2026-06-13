import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sma,
  ema,
  rsi,
  macd,
  totalReturn,
  maxDrawdown,
  stdDev,
  annualizedVolatility,
  bollingerBands,
  bollingerSeries,
  atr,
} from './indicators.js';
import { forecast } from './forecast.js';

test('sma calcola la media dell ultima finestra', () => {
  assert.equal(sma([1, 2, 3, 4, 5], 5), 3);
  assert.equal(sma([2, 4, 6], 3), 4);
  assert.equal(sma([1, 2], 5), null);
});

test('ema dei valori costanti e costante', () => {
  const v = Array(50).fill(10);
  assert.equal(ema(v, 20), 10);
});

test('rsi su serie crescente tende a 100', () => {
  const v = Array.from({ length: 30 }, (_, i) => i + 1);
  const r = rsi(v, 14);
  assert.ok(r > 95, `RSI atteso ~100, ottenuto ${r}`);
});

test('rsi su serie decrescente tende a 0', () => {
  const v = Array.from({ length: 30 }, (_, i) => 100 - i);
  const r = rsi(v, 14);
  assert.ok(r < 5, `RSI atteso ~0, ottenuto ${r}`);
});

test('macd ritorna le tre componenti', () => {
  const v = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 5 + i);
  const m = macd(v);
  assert.ok(m && typeof m.macd === 'number');
  assert.ok(typeof m.signal === 'number');
  assert.ok(typeof m.histogram === 'number');
  assert.ok(Math.abs(m.histogram - (m.macd - m.signal)) < 1e-9);
});

test('totalReturn e maxDrawdown', () => {
  assert.ok(Math.abs(totalReturn([100, 110]) - 0.1) < 1e-9);
  // picco 100 -> minimo 50 = -50%
  assert.ok(Math.abs(maxDrawdown([100, 120, 60, 80]) - (60 / 120 - 1)) < 1e-9);
});

test('stdDev e volatilita annualizzata', () => {
  assert.equal(stdDev([5, 5, 5, 5]), 0);
  assert.equal(annualizedVolatility([0, 0, 0]), 0);
});

test('bollinger su serie costante collassa sulla media', () => {
  const v = Array(30).fill(50);
  const bb = bollingerBands(v, 20, 2);
  assert.equal(bb.upper, 50);
  assert.equal(bb.middle, 50);
  assert.equal(bb.lower, 50);
  assert.equal(bb.percentB, null); // banda di ampiezza zero
});

test('bollinger: prezzo dentro le bande, ordine corretto', () => {
  const v = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 5);
  const bb = bollingerBands(v, 20, 2);
  assert.ok(bb.lower < bb.middle && bb.middle < bb.upper);
  assert.ok(bb.percentB >= -0.5 && bb.percentB <= 1.5);
});

test('bollingerSeries allineata e con null iniziali', () => {
  const v = Array.from({ length: 25 }, (_, i) => i + 1);
  const s = bollingerSeries(v, 20, 2);
  assert.equal(s.length, 25);
  assert.equal(s[0], null);
  assert.equal(s[18], null);
  assert.ok(s[19] && typeof s[19].upper === 'number');
});

test('atr positivo e finito con high/low/close', () => {
  const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
  const highs = closes.map((c) => c + 2);
  const lows = closes.map((c) => c - 2);
  const a = atr(highs, lows, closes, 14);
  assert.ok(Number.isFinite(a) && a > 0, `ATR atteso > 0, ottenuto ${a}`);
  assert.equal(atr(highs, lows, closes.slice(0, 5), 14), null);
});

test('forecast produce bande coerenti', () => {
  // Serie con drift positivo + rumore.
  const prices = [];
  let p = 100;
  for (let i = 0; i < 200; i++) {
    p *= 1 + 0.002 + (Math.sin(i) * 0.01);
    prices.push(p);
  }
  const fc = forecast(prices, { horizon: 30, simulations: 500, seed: 7 });
  assert.ok(fc, 'forecast non deve essere null');
  assert.equal(fc.band.length, 30);
  // La banda deve rispettare p05 <= median <= p95.
  for (const day of fc.band) {
    assert.ok(day.p05 <= day.median + 1e-6);
    assert.ok(day.median <= day.p95 + 1e-6);
  }
  assert.ok(fc.probabilityUp >= 0 && fc.probabilityUp <= 1);
});
