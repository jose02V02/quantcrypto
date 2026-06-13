// Funzione serverless Vercel: GET /api/market/analyze
// Riutilizza la stessa logica del backend Express (nessuna duplicazione).
import { fetchMarket } from '../../backend/src/providers.js';
import { analyzeMarket } from '../../backend/src/analyze.js';

export default async function handler(req, res) {
  try {
    const coin = req.query.coin || 'bitcoin';
    const provider = req.query.provider || process.env.MARKET_PROVIDER || 'coingecko';
    const days = Math.min(1000, Math.max(35, Number(req.query.days) || 180));
    const horizon = Math.min(180, Math.max(7, Number(req.query.horizon) || 30));

    const market = await fetchMarket(provider, coin, days);
    const analysis = analyzeMarket(market, { forecastHorizon: horizon });
    res.status(200).json({ source: analysis.source, analysis });
  } catch (e) {
    const status = e.response?.status === 404 ? 404 : 400;
    res.status(status).json({
      error: e.response?.data?.error || e.message || 'Errore di analisi',
    });
  }
}
