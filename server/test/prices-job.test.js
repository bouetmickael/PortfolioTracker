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

// Simule un marche en pre-ouverture pour un ticker donne, en plus du mock
// Yahoo Finance standard installe par demarrerServeurDeTest() (qui ne porte
// jamais marketState/preMarketPrice - voir server/test/support/helpers.js).
function mockPreMarketPour(tickerCible, meta) {
  const fetchAvant = global.fetch;
  global.fetch = (url, options) => {
    if (typeof url === 'string' && url.includes(`/chart/${tickerCible}?`)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ chart: { result: [{ meta }] } })
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
    regularMarketVolume: 1000,
    currency: 'USD',
    marketState: 'PRE',
    preMarketPrice: 99
  });
  try {
    await updatePrices();
  } finally {
    restaurerFetch();
  }

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  const aapl = parTicker(valeurs, 'AAPL');

  assert.equal(aapl.avantBourseCours, 99);
  assert.equal(aapl.avantBourseVariation, ((99 - 98) / 98) * 100);
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
    regularMarketVolume: 1000,
    currency: 'USD',
    marketState: 'PRE',
    preMarketPrice: 99
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
    regularMarketVolume: 1000,
    currency: 'USD',
    marketState: 'REGULAR',
    preMarketPrice: 99
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
    regularMarketVolume: 0,
    currency: 'USD',
    marketState: 'PRE',
    preMarketPrice: 19900
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
  assert.equal(ndx.avantBourseVariation, ((19900 - 19800) / 19800) * 100);
});
