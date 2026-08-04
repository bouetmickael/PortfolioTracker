const db = require('../db');
const { INDICES } = require('../indices');
const { fetchYahooFinanceJson } = require('../yahooFinance');
const { traiterEnParallele } = require('./parallel');

// Vrai si l'instant present tombe dans la fenetre de pre-ouverture du jour
// (meta.currentTradingPeriod.pre, timestamps Unix en secondes).
function estDansFenetre(fenetre) {
  const maintenant = Math.floor(Date.now() / 1000);
  return maintenant >= fenetre.start && maintenant < fenetre.end;
}

// Variation en pourcentage par rapport a une reference (cloture precedente),
// 0 si la reference est absente/nulle - partage entre le cours normal et le
// cours avant-bourse, tous deux calcules par rapport a la meme cloture.
function pctChange(price, ref) {
  return ref ? ((price - ref) / ref) * 100 : 0;
}

// Extrait le premier resultat d'une reponse /v8/finance/chart, ou null si la
// reponse ne porte aucun resultat exploitable - partage entre le cours
// normal et le cours avant-bourse, qui interrogent le meme endpoint.
function extraireResultatChart(data) {
  return data.chart && data.chart.result && data.chart.result.length > 0 ? data.chart.result[0] : null;
}

// Dernier prix connu pendant la session avant-bourse : contrairement au
// cours quotidien (interval=1d, une seule bougie), les bougies a la minute
// (interval=1m) incluent les transactions avant-bourse quand
// includePrePost=true - le dernier point valide de la serie est donc le
// dernier prix reellement echange avant l'ouverture. Meme endpoint que
// fetchYahooFinance() (aucun jeton de session requis), simple appel
// supplementaire, uniquement declenche quand la fenetre avant-bourse est
// active (voir appelant).
async function fetchDernierPrixPreMarket(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d&includePrePost=true`;

  const data = await fetchYahooFinanceJson(url);
  const result = extraireResultatChart(data);
  if (!result) {
    return null;
  }

  const quotes = result.indicators.quote[0];
  const closesValides = (quotes.close || []).filter((c) => c !== null && c !== undefined);
  return closesValides.length > 0 ? closesValides[closesValides.length - 1] : null;
}

async function fetchYahooFinance(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;

  const data = await fetchYahooFinanceJson(url);

  const result = extraireResultatChart(data);
  if (!result) {
    throw new Error('Donnees invalides Yahoo Finance');
  }

  const meta = result.meta;

  // meta ne porte pas de pourcentage de variation pre-calcule (ce champ
  // n'existe que sur l'endpoint /v7/finance/quote, pas sur /v8/finance/chart
  // utilise ici) : recalcule a partir du cours et de la cloture precedente.
  const price = meta.regularMarketPrice || 0;
  const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
  const changePct = pctChange(price, previousClose);

  // Cours avant-bourse : correctif suite a un retour utilisateur (NVDA
  // n'affichait jamais de cours avant-bourse alors que le marche etait bien
  // en pre-ouverture au moment constate). L'implementation initiale se
  // fiait a meta.marketState === 'PRE' et meta.preMarketPrice, mais ces deux
  // champs n'existent PAS sur l'endpoint /v8/finance/chart utilise ici -
  // verifie via le schema ChartMeta de la bibliotheque yahoo-finance2 (voir
  // TODO.md pour la source) : ils appartiennent a un endpoint different
  // (/v7/finance/quote), qui necessite un jeton de session ("crumb") que ce
  // projet n'implemente pas (voir ARCHITECTURE.md § Points de vigilance,
  // deja identifie comme un risque). meta.currentTradingPeriod.pre en
  // revanche EST bien present sur /v8/finance/chart (horaires de la session
  // avant-bourse du jour, en timestamp Unix) : utilise pour determiner si
  // le marche est actuellement en pre-ouverture, sans jeton de session.
  let avantBourseCours = null;
  let avantBourseVariation = null;
  const fenetrePreMarket = meta.currentTradingPeriod && meta.currentTradingPeriod.pre;
  if (fenetrePreMarket && estDansFenetre(fenetrePreMarket)) {
    try {
      const dernierPrix = await fetchDernierPrixPreMarket(ticker);
      if (dernierPrix) {
        avantBourseCours = dernierPrix;
        avantBourseVariation = pctChange(dernierPrix, previousClose);
      }
    } catch (error) {
      // Best-effort : l'absence de cours avant-bourse ne doit jamais faire
      // echouer la mise a jour du cours normal (voir BUSINESS_RULES.md §
      // Integrite des cours - pas de valeur inventee en cas d'echec).
      console.log(`Avant-bourse indisponible pour ${ticker}: ${error.message}`);
    }
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
