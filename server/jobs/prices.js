const db = require('../db');
const { INDICES } = require('../indices');
const { fetchYahooFinanceJson } = require('../yahooFinance');
const { traiterEnParallele } = require('./parallel');

async function fetchYahooFinance(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;

  const data = await fetchYahooFinanceJson(url);

  if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
    throw new Error('Donnees invalides Yahoo Finance');
  }

  const result = data.chart.result[0];
  const meta = result.meta;

  // meta ne porte pas de pourcentage de variation pre-calcule (ce champ
  // n'existe que sur l'endpoint /v7/finance/quote, pas sur /v8/finance/chart
  // utilise ici) : recalcule a partir du cours et de la cloture precedente.
  const price = meta.regularMarketPrice || 0;
  const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
  const changePct = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;

  // Cours avant-bourse : uniquement lorsque Yahoo Finance rapporte le
  // marche du ticker comme effectivement en pre-ouverture (marketState ===
  // 'PRE'). meta.preMarketPrice peut rester present et fige apres
  // l'ouverture du marche (derniere valeur connue), donc ne pas se fier a
  // sa seule presence - l'afficher hors pre-ouverture serait une donnee
  // perimee presentee comme actuelle (voir BUSINESS_RULES.md § Integrite
  // des cours). Absent pour les marches sans session avant-bourse (ex.
  // Euronext Paris) : Yahoo Finance ne renvoie alors jamais marketState
  // 'PRE' pour ces tickers.
  let avantBourseCours = null;
  let avantBourseVariation = null;
  if (meta.marketState === 'PRE' && meta.preMarketPrice) {
    avantBourseCours = meta.preMarketPrice;
    avantBourseVariation = previousClose ? ((avantBourseCours - previousClose) / previousClose) * 100 : 0;
  }

  return {
    price,
    changePct,
    volume: meta.regularMarketVolume || 0,
    currency: meta.currency || 'USD',
    avantBourseCours,
    avantBourseVariation
  };
}

async function updatePrices() {
  console.log('Demarrage mise a jour des cours');

  const tickers = db.prepare('SELECT DISTINCT ticker FROM valeurs').all().map((row) => row.ticker);
  console.log(`${tickers.length} tickers a mettre a jour`);

  const update = db.prepare(
    `UPDATE valeurs SET cours = ?, variation = ?, volume = ?, avant_bourse_cours = ?, avant_bourse_variation = ?,
     derniere_maj = ? WHERE ticker = ?`
  );

  const updated = await traiterEnParallele(
    tickers,
    async (ticker) => {
      const priceData = await fetchYahooFinance(ticker);
      const result = update.run(
        priceData.price,
        priceData.changePct,
        priceData.volume,
        priceData.avantBourseCours,
        priceData.avantBourseVariation,
        Date.now(),
        ticker
      );
      console.log(`${ticker}: ${priceData.price} (${priceData.changePct.toFixed(2)}%)`);
      return result.changes;
    },
    (ticker) => `Erreur ${ticker}`
  );

  console.log(`Mise a jour terminee : ${updated} valeurs`);
}

async function updateIndices() {
  console.log('Demarrage mise a jour des indices de marche');

  const update = db.prepare(
    `UPDATE indices_marche SET cours = ?, variation = ?, avant_bourse_cours = ?, avant_bourse_variation = ?,
     devise = ?, derniere_maj = ? WHERE ticker = ?`
  );

  const updated = await traiterEnParallele(
    INDICES,
    async (indice) => {
      const priceData = await fetchYahooFinance(indice.ticker);
      const result = update.run(
        priceData.price,
        priceData.changePct,
        priceData.avantBourseCours,
        priceData.avantBourseVariation,
        priceData.currency,
        Date.now(),
        indice.ticker
      );
      console.log(`${indice.ticker}: ${priceData.price} (${priceData.changePct.toFixed(2)}%)`);
      return result.changes;
    },
    (indice) => `Erreur ${indice.ticker}`
  );

  console.log(`Mise a jour des indices terminee : ${updated} indices`);
}

module.exports = { updatePrices, updateIndices, fetchYahooFinance };
