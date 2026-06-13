import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { supabase, supabaseEnabled } from './supabase';
import { api } from './api';

const fmtPct = (v) =>
  Number.isFinite(v) ? `${(v * 100).toFixed(2)}%` : '—';
const fmtUsd = (v) =>
  Number.isFinite(v)
    ? `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : '—';

function Login({ session }) {
  if (!supabaseEnabled) {
    return <span className="muted">Login disattivato (Supabase non configurato)</span>;
  }
  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  const logout = () => supabase.auth.signOut();
  return (
    <div className="auth">
      {session ? (
        <>
          <span>{session.user.email}</span>
          <button onClick={logout}>Esci</button>
        </>
      ) : (
        <button onClick={login}>Login con Google</button>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [coin, setCoin] = useState('bitcoin');
  const [provider, setProvider] = useState('coingecko');
  const [days, setDays] = useState(180);
  const [horizon, setHorizon] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [watch, setWatch] = useState([]);

  useEffect(() => {
    if (!supabaseEnabled) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  async function analyze() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/market/analyze', {
        params: { coin, provider, days, horizon },
      });
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadWatch() {
    if (!session) return;
    try {
      const res = await api.get('/api/watchlist');
      setWatch(res.data);
    } catch {
      /* ignora errori watchlist */
    }
  }

  async function addWatch() {
    if (!session) return alert('Fai login prima');
    await api.post('/api/watchlist', { symbol: coin });
    loadWatch();
  }

  useEffect(() => {
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    loadWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const a = data?.analysis;
  const fc = a?.forecast;

  // Combina storico recente + banda di previsione in un'unica serie per il grafico.
  const forecastChart = fc
    ? [
        { date: 'oggi', median: fc.lastPrice, p05: fc.lastPrice, p95: fc.lastPrice },
        ...fc.band.map((b, i) => ({
          date: `+${i + 1}g`,
          median: b.median,
          p05: b.p05,
          p95: b.p95,
        })),
      ]
    : [];

  const verdictClass = a?.verdict?.label
    ? `verdict ${a.verdict.label.toLowerCase()}`
    : 'verdict';

  return (
    <main>
      <header>
        <div>
          <h1>QuantCrypto</h1>
          <p>
            Analisi quantitativa su dati reali: CoinGecko/Binance → backend
            Express → matematica → React.
          </p>
        </div>
        <Login session={session} />
      </header>

      <section className="panel controls">
        <input
          value={coin}
          onChange={(e) => setCoin(e.target.value)}
          placeholder="bitcoin / ethereum / BTCUSDT"
        />
        <select value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="coingecko">CoinGecko (es. bitcoin)</option>
          <option value="binance">Binance (es. BTCUSDT)</option>
        </select>
        <label className="field">
          giorni storico
          <input
            type="number"
            value={days}
            min="35"
            max="1000"
            onChange={(e) => setDays(e.target.value)}
          />
        </label>
        <label className="field">
          orizzonte (g)
          <input
            type="number"
            value={horizon}
            min="7"
            max="180"
            onChange={(e) => setHorizon(e.target.value)}
          />
        </label>
        <button onClick={analyze} disabled={loading}>
          {loading ? 'Analisi…' : 'Analizza'}
        </button>
        <button onClick={addWatch}>+ Watchlist</button>
      </section>

      {error && <div className="error">{error}</div>}

      {a && (
        <>
          <section className="cards">
            <div>
              <b>Prezzo reale</b>
              <span>{fmtUsd(a.latestPrice)}</span>
            </div>
            <div>
              <b>RSI 14</b>
              <span>{a.rsi14?.toFixed(2) ?? '—'}</span>
            </div>
            <div>
              <b>MACD / signal</b>
              <span>
                {a.macd?.macd?.toFixed(2) ?? '—'} / {a.macd?.signal?.toFixed(2) ?? '—'}
              </span>
            </div>
            <div>
              <b>EMA 20 / 50</b>
              <span>
                {fmtUsd(a.ema20)} / {fmtUsd(a.ema50)}
              </span>
            </div>
            <div>
              <b>Rendimento periodo</b>
              <span>{fmtPct(a.totalReturn)}</span>
            </div>
            <div>
              <b>Volatilità ann.</b>
              <span>{fmtPct(a.volatilityAnnualized)}</span>
            </div>
            <div>
              <b>Max drawdown</b>
              <span>{fmtPct(a.maxDrawdown)}</span>
            </div>
            <div>
              <b>Sharpe ann.</b>
              <span>{a.sharpeRatio?.toFixed(2) ?? '—'}</span>
            </div>
          </section>

          <section className={verdictClass}>
            <div>
              <b>Verdetto sintetico: {a.verdict.label}</b>
              <ul>
                {a.verdict.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel chart">
            <h2>Serie storica reale ({a.source})</h2>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={a.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d3556" />
                <XAxis dataKey="date" minTickGap={40} />
                <YAxis domain={['auto', 'auto']} width={70} />
                <Tooltip />
                <Line type="monotone" dataKey="close" stroke="#18a2ff" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          {fc && (
            <section className="panel chart">
              <h2>
                Proiezione Monte Carlo — {fc.horizonDays} giorni ({fc.simulations}{' '}
                simulazioni)
              </h2>
              <p className="muted">
                Prezzo atteso (mediana): <b>{fmtUsd(fc.expectedPrice)}</b> ·
                rendimento atteso <b>{fmtPct(fc.expectedReturn)}</b> · prob. al
                rialzo <b>{(fc.probabilityUp * 100).toFixed(0)}%</b> · banda 90%:{' '}
                {fmtUsd(fc.lowPrice)} – {fmtUsd(fc.highPrice)}
              </p>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={forecastChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d3556" />
                  <XAxis dataKey="date" minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} width={70} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="p95"
                    name="95° perc."
                    stroke="#6f5cff"
                    fill="#6f5cff"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="median"
                    name="mediana"
                    stroke="#18a2ff"
                    fill="#18a2ff"
                    fillOpacity={0.25}
                  />
                  <Area
                    type="monotone"
                    dataKey="p05"
                    name="5° perc."
                    stroke="#1d3556"
                    fill="#07111f"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="disclaimer">
                ⚠️ Proiezione statistica (moto browniano geometrico) basata su
                drift e volatilità storici. NON è una previsione garantita né un
                consiglio finanziario.
              </p>
            </section>
          )}
        </>
      )}

      <section className="panel">
        <h2>Watchlist (salvata su database)</h2>
        {!supabaseEnabled ? (
          <p className="muted">
            Configura Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) per
            abilitare login e watchlist.
          </p>
        ) : session ? (
          <ul>
            {watch.map((w) => (
              <li key={w.id}>{w.symbol}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">Effettua il login per salvare asset.</p>
        )}
      </section>

      <footer className="disclaimer">
        QuantCrypto non promette guadagni e non è consulenza finanziaria.
        Produce analisi quantitativa su dati reali; il mercato crypto resta
        altamente rischioso.
      </footer>
    </main>
  );
}
