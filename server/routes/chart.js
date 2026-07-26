const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { fetchYahooFinanceJson } = require('../yahooFinance');

const router = express.Router();

router.use(requireAuth);

const INTERVAL_BY_PERIOD = {
  '1D': '5m',
  '1W': '15m',
  '1M': '1d',
  '1Y': '1d',
  MAX: '1d'
};

// Cache memoire par ticker+periode : chaque ouverture du graphique d'une
// meme valeur refaisait un appel Yahoo Finance identique (voir CLAUDE.md
// Historique des revues, Revue n°1). TTL cale sur la moitie de l'intervalle
// du job de mise a jour des cours (2 minutes, voir DOCKER.md) - assez court
// pour ne jamais servir un cours plus perime que ce que l'utilisateur
// verrait deja sur la liste des valeurs entre deux cycles du job.
const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

function lireCache(cle) {
  const entree = cache.get(cle);
  if (!entree) return null;
  if (Date.now() > entree.expiration) {
    cache.delete(cle);
    return null;
  }
  return entree.payload;
}

function ecrireCache(cle, payload) {
  cache.set(cle, { expiration: Date.now() + CACHE_TTL_MS, payload });
}

router.get('/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const period = req.query.period || '1M';

  const cacheKey = `${ticker}:${period}`;
  const dejaEnCache = lireCache(cacheKey);
  if (dejaEnCache) {
    return res.json(dejaEnCache);
  }

  try {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '1D':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '1Y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'MAX':
        startDate.setFullYear(startDate.getFullYear() - 10);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const interval = INTERVAL_BY_PERIOD[period] || '1d';
    const start = Math.floor(startDate.getTime() / 1000);
    const end = Math.floor(endDate.getTime() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${start}&period2=${end}&interval=${interval}`;

    const json = await fetchYahooFinanceJson(url);

    if (!json.chart || !json.chart.result) {
      throw new Error('Donnees historiques indisponibles');
    }

    const result = json.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    const chartData = timestamps
      .map((timestamp, i) => ({
        date: new Date(timestamp * 1000).toISOString(),
        close: quotes.close[i],
        open: quotes.open[i],
        high: quotes.high[i],
        low: quotes.low[i],
        volume: quotes.volume[i]
      }))
      .filter((point) => point.close !== null && point.close !== undefined);

    const payload = { success: true, ticker, period, data: chartData };
    ecrireCache(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    console.error('Erreur chart:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
