// Funzione serverless Vercel: GET /api/market/backtest
import { fetchMarket } from '../../backend/src/providers.js';
import { backtest } from '../../backend/src/backtest.js';

export default async function handler(req, res) {
  try {
    const coin = req.query.coin || 'bitcoin';
    const provider = req.query.provider || process.env.MARKET_PROVIDER || 'coingecko';
    const days = Math.min(1000, Math.max(60, Number(req.query.days) || 365));
    const currency = req.query.currency || 'usd';

    const market = await fetchMarket(provider, coin, days, currency);
    const result = backtest(market);
    res.status(200).json(result);
  } catch (e) {
    const status = e.statusCode || (e.response?.status === 404 ? 404 : 400);
    res.status(status).json({
      error: e.response?.data?.error || e.message || 'Errore di backtest',
    });
  }
}
