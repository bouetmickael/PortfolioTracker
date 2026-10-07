const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { demarrerServeurDeTest, creerUtilisateur } = require('./support/helpers');

const serveur = demarrerServeurDeTest('chart');
let baseUrl;

before(async () => {
  await serveur.start();
  baseUrl = serveur.getBaseUrl();
});

after(async () => {
  await serveur.stop();
});

test('GET /api/chart/:ticker met en cache les appels identiques (ticker+periode)', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'chart-cache@test.local');

  const fetchOriginal = global.fetch;
  let appelsChart = 0;
  global.fetch = (url, options) => {
    if (typeof url === 'string' && url.includes('/v8/finance/chart/')) appelsChart++;
    return fetchOriginal(url, options);
  };

  try {
    const res1 = await fetch(`${baseUrl}/api/chart/AAPL?period=1M`, { headers: { Cookie: cookie } });
    assert.equal(res1.status, 200);
    const body1 = await res1.json();

    const res2 = await fetch(`${baseUrl}/api/chart/AAPL?period=1M`, { headers: { Cookie: cookie } });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();

    assert.equal(appelsChart, 1);
    assert.deepEqual(body2, body1);

    // Une periode differente n'est pas servie par le meme cache.
    const res3 = await fetch(`${baseUrl}/api/chart/AAPL?period=1Y`, { headers: { Cookie: cookie } });
    assert.equal(res3.status, 200);
    assert.equal(appelsChart, 2);
  } finally {
    global.fetch = fetchOriginal;
  }
});

test('GET /api/chart/:ticker renvoie la cloture de la veille (previousClose)', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'chart-previousclose@test.local');

  const res = await fetch(`${baseUrl}/api/chart/AAPL?period=1M`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  const body = await res.json();

  // Mock Yahoo Finance (server/test/support/helpers.js) : meta.previousClose = 100.
  assert.equal(body.previousClose, 100);
});

test('GET /api/chart/:ticker renvoie 404 propre quand Yahoo ne fournit aucune bougie', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'chart-sansdonnees@test.local');

  const fetchOriginal = global.fetch;
  global.fetch = (url, options) => {
    if (typeof url === 'string' && url.includes('/v8/finance/chart/SANSBOUGIE')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ chart: { result: [{ meta: { previousClose: 100 }, indicators: { quote: [{}] } }] } })
      });
    }
    return fetchOriginal(url, options);
  };

  try {
    const res = await fetch(`${baseUrl}/api/chart/SANSBOUGIE?period=1W`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'Aucune donnee disponible pour cette periode');
  } finally {
    global.fetch = fetchOriginal;
  }
});
