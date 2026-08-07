const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { demarrerServeurDeTest, creerUtilisateur } = require('./support/helpers');

const serveur = demarrerServeurDeTest('prices-job');
// Requis apres demarrerServeurDeTest() : DB_PATH est deja positionne et le
// module server/db.js deja charge (singleton partage par tout le process),
// updatePrices()/updateIndices() operent donc sur la meme base que le
// serveur de test (meme pattern que server/test/alerts-job.test.js).
const { updatePrices, updateIndices } = require('../jobs/prices');
let baseUrl;

before(async () => {
  await serveur.start();
  baseUrl = serveur.getBaseUrl();
});

after(async () => {
  await serveur.stop();
});

function parTicker(valeurs, ticker) {
  return valeurs.find((v) => v.ticker === ticker);
}

// Simule un marche en pre-ouverture (ou non) pour un ticker donne, en plus
// du mock Yahoo Finance standard installe par demarrerServeurDeTest() (voir
// server/test/support/helpers.js). meta.currentTradingPeriod.pre pilote la
// fenetre avant-bourse (voir server/jobs/prices.js § estDansFenetre) ; si
// `dernierPrixPreMarket` est fourni, le second appel (interval=1m) le
// renvoie comme dernier point de la serie.
function mockPreMarketPour(tickerCible, { previousClose, regularMarketPrice, currency, enPreMarket, dernierPrixPreMarket }) {
  const fetchAvant = global.fetch;
  const maintenant = Math.floor(Date.now() / 1000);
  const currentTradingPeriod = enPreMarket
    ? { pre: { start: maintenant - 60, end: maintenant + 3600 } }
    : { pre: { start: maintenant - 7200, end: maintenant - 3600 } };

  global.fetch = (url, options) => {
    if (typeof url === 'string' && url.includes(`/chart/${tickerCible}?`) && url.includes('interval=1m')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ chart: { result: [{ indicators: { quote: [{ close: [null, dernierPrixPreMarket] }] } }] } })
      });
    }
    if (typeof url === 'string' && url.includes(`/chart/${tickerCible}?`)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          chart: {
            result: [
              {
                meta: {
                  regularMarketPrice,
                  previousClose,
                  regularMarketVolume: 1000,
                  currency,
                  currentTradingPeriod
                }
              }
            ]
          }
        })
      });
    }
    return fetchAvant(url, options);
  };
  return () => {
    global.fetch = fetchAvant;
  };
}

test('updatePrices() renseigne le cours avant-bourse quand le marche du ticker est en pre-ouverture', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'prices-job-premarket@test.local');

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });

  const restaurerFetch = mockPreMarketPour('AAPL', {
    regularMarketPrice: 100,
    previousClose: 98,
    currency: 'USD',
    enPreMarket: true,
    dernierPrixPreMarket: 99
  });
  try {
    await updatePrices();
  } finally {
    restaurerFetch();
  }

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  const aapl = parTicker(valeurs, 'AAPL');

  assert.equal(aapl.avantBourseCours, 99);
  // Variation par rapport a regularMarketPrice (100, le "Cours" affiche),
  // pas previousClose (98, une seance plus tot) - voir server/jobs/prices.js.
  assert.equal(aapl.avantBourseVariation, ((99 - 100) / 100) * 100);
});

test('updatePrices() efface le cours avant-bourse des que le marche repasse en seance normale', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'prices-job-clear@test.local');

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'MSFT' })
  });

  const restaurerPre = mockPreMarketPour('MSFT', {
    regularMarketPrice: 100,
    previousClose: 98,
    currency: 'USD',
    enPreMarket: true,
    dernierPrixPreMarket: 99
  });
  try {
    await updatePrices();
  } finally {
    restaurerPre();
  }

  const avant = parTicker(await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json(), 'MSFT');
  assert.equal(avant.avantBourseCours, 99);

  const restaurerRegular = mockPreMarketPour('MSFT', {
    regularMarketPrice: 101,
    previousClose: 98,
    currency: 'USD',
    enPreMarket: false
  });
  try {
    await updatePrices();
  } finally {
    restaurerRegular();
  }

  const apres = parTicker(await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json(), 'MSFT');
  assert.equal(apres.avantBourseCours, null);
  assert.equal(apres.avantBourseVariation, null);
});

test('updateIndices() renseigne le cours avant-bourse des indices US (ex. Nasdaq-100) en pre-ouverture', async () => {
  const restaurerFetch = mockPreMarketPour('^NDX', {
    regularMarketPrice: 20000,
    previousClose: 19800,
    currency: 'USD',
    enPreMarket: true,
    dernierPrixPreMarket: 19900
  });
  try {
    await updateIndices();
  } finally {
    restaurerFetch();
  }

  const { cookie } = await creerUtilisateur(baseUrl, 'prices-job-indices@test.local');
  const indices = await (await fetch(`${baseUrl}/api/indices`, { headers: { Cookie: cookie } })).json();
  const ndx = indices.find((i) => i.ticker === '^NDX');

  assert.equal(ndx.avantBourseCours, 19900);
  // Variation par rapport a regularMarketPrice (20000), pas previousClose
  // (19800) - voir server/jobs/prices.js.
  assert.equal(ndx.avantBourseVariation, ((19900 - 20000) / 20000) * 100);
});
