const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const period = req.query.period || '1M';

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

    const start = Math.floor(startDate.getTime() / 1000);
    const end = Math.floor(endDate.getTime() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${start}&period2=${end}&interval=1d`;

    const response = await fetch(url);
    const json = await response.json();

    if (!json.chart || !json.chart.result) {
      throw new Error('Donnees historiques indisponibles');
    }

    const result = json.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    const chartData = timestamps.map((timestamp, i) => ({
      date: new Date(timestamp * 1000).toISOString(),
      close: quotes.close[i],
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      volume: quotes.volume[i]
    }));

    res.json({ success: true, ticker, period, data: chartData });
  } catch (error) {
    console.error('Erreur chart:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
