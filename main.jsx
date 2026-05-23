import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from './lib/api';
import { supabase } from './lib/supabase';
import './style.css';

function formatPct(v){ return Number.isFinite(v) ? `${(v*100).toFixed(2)}%` : '-'; }
function formatUsd(v){ return Number.isFinite(v) ? `$${v.toLocaleString(undefined,{maximumFractionDigits:2})}` : '-'; }

function Login({ session }){
  const login = () => supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.origin }});
  const logout = () => supabase.auth.signOut();
  return <div className="auth">{session ? <><span>{session.user.email}</span><button onClick={logout}>Esci</button></> : <button onClick={login}>Login reale con Google / Supabase</button>}</div>;
}

function App(){
  const [session,setSession]=useState(null); const [coin,setCoin]=useState('bitcoin'); const [provider,setProvider]=useState('coingecko'); const [days,setDays]=useState(180); const [data,setData]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [watch,setWatch]=useState([]);
  useEffect(()=>{ supabase.auth.getSession().then(({data})=>setSession(data.session)); const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s)); return ()=>subscription.unsubscribe(); },[]);
  async function analyze(){ setLoading(true); setError(''); try{ const res=await api.get('/api/market/analyze',{params:{coin,provider,days}}); setData(res.data); } catch(e){ setError(e.response?.data?.error || e.message); } finally{ setLoading(false); } }
  async function loadWatch(){ if(!session) return; const res=await api.get('/api/watchlist'); setWatch(res.data); }
  async function addWatch(){ if(!session) return alert('Fai login prima'); await api.post('/api/watchlist',{symbol:coin}); loadWatch(); }
  useEffect(()=>{ analyze(); },[]); useEffect(()=>{ loadWatch(); },[session]);
  const a=data?.analysis;
  return <main><header><div><h1>QuantumTrade Real Stack</h1><p>Dashboard con dati reali: CoinGecko/Binance → backend Express → calcoli matematici → React.</p></div><Login session={session}/></header>
    <section className="panel controls"><input value={coin} onChange={e=>setCoin(e.target.value)} placeholder="bitcoin / ethereum / BTCUSDT"/><select value={provider} onChange={e=>setProvider(e.target.value)}><option value="coingecko">CoinGecko</option><option value="binance">Binance</option></select><input type="number" value={days} min="35" max="1000" onChange={e=>setDays(e.target.value)}/><button onClick={analyze} disabled={loading}>{loading?'Analisi...':'Analizza'}</button><button onClick={addWatch}>+ Watchlist</button></section>
    {error && <div className="error">{error}</div>}
    {a && <><section className="cards"><div><b>Prezzo reale</b><span>{formatUsd(a.latestPrice)}</span></div><div><b>RSI 14</b><span>{a.rsi14?.toFixed(2)}</span></div><div><b>MACD</b><span>{a.macd?.MACD?.toFixed(2)} / {a.macd?.signal?.toFixed(2)}</span></div><div><b>EMA 20 / 50</b><span>{formatUsd(a.ema20)} / {formatUsd(a.ema50)}</span></div><div><b>Rendimento</b><span>{formatPct(a.totalReturn)}</span></div><div><b>Volatilità ann.</b><span>{formatPct(a.volatilityAnnualized)}</span></div><div><b>Max drawdown</b><span>{formatPct(a.maxDrawdown)}</span></div><div><b>Verdetto</b><span>{a.verdict}</span></div></section>
    <section className="panel chart"><h2>Serie storica reale ({data.source})</h2><ResponsiveContainer width="100%" height={360}><LineChart data={a.chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" minTickGap={35}/><YAxis domain={['auto','auto']}/><Tooltip/><Line type="monotone" dataKey="close" dot={false}/></LineChart></ResponsiveContainer></section></>}
    <section className="panel"><h2>Watchlist salvata nel database</h2>{session ? <ul>{watch.map(w=><li key={w.id}>{w.symbol}</li>)}</ul> : <p>Effettua il login per salvare asset su Supabase/PostgreSQL.</p>}</section>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
