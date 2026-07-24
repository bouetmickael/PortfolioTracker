const db = require('../db');

async function fetchYahooFinance(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Yahoo Finance error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
    throw new Error('Donnees invalides Yahoo Finance');
  }

  const result = data.chart.result[0];
  const meta = result.meta;

  return {
    price: meta.regularMarketPrice || 0,
    changePct: meta.regularMarketChangePercent || 0,
    volume: meta.regularMarketVolume || 0,
    currency: meta.currency || 'USD'
  };
}

async function updatePrices() {
  console.log('Demarrage mise a jour des cours');

  const tickers = db.prepare('SELECT DISTINCT ticker FROM valeurs').all().map((row) => row.ticker);
  console.log(`${tickers.length} tickers a mettre a jour`);

  const update = db.prepare(
    'UPDATE valeurs SET cours = ?, variation = ?, volume = ?, derniere_maj = ? WHERE ticker = ?'
  );

  let updated = 0;

  for (const ticker of tickers) {
    try {
      const priceData = await fetchYahooFinance(ticker);
      const result = update.run(priceData.price, priceData.changePct, priceData.volume, Date.now(), ticker);
      updated += result.changes;

      console.log(`${ticker}: ${priceData.price} (${priceData.changePct.toFixed(2)}%)`);
    } catch (error) {
      console.error(`Erreur ${ticker}:`, error.message);
    }
  }

  console.log(`Mise a jour terminee : ${updated} valeurs`);
}

module.exports = { updatePrices, fetchYahooFinance };
