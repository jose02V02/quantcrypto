// Funzione serverless Vercel: GET /api/health
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    runtime: 'vercel-serverless',
    supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    defaultProvider: process.env.MARKET_PROVIDER || 'coingecko',
    time: new Date().toISOString(),
  });
}
