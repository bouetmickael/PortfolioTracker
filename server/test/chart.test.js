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
