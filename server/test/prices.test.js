const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { fetchYahooFinance } = require('../jobs/prices');

// meta (endpoint /v8/finance/chart) ne porte aucun pourcentage de variation
// pre-calcule (regularMarketChangePercent n'existe que sur /v7/finance/quote)
// : ces tests couvrent directement le calcul a partir de regularMarketPrice/
// previousClose, sans passer par un serveur complet - voir server/jobs/
// prices.js et CLAUDE.md § Historique des revues pour le bug corrige.

const fetchOriginal = global.fetch;
after(() => {
  global.fetch = fetchOriginal;
});

function mockMeta(meta) {
  global.fetch = () =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ chart: { result: [{ meta }] } })
    });
}

test('la variation est calculee a partir du cours et de la cloture precedente (hausse)', async () => {
  mockMeta({ regularMarketPrice: 101.5, previousClose: 100, regularMarketVolume: 1000, currency: 'EUR' });

  const priceData = await fetchYahooFinance('TEST.PA');

  assert.equal(priceData.price, 101.5);
  assert.equal(priceData.changePct, 1.5);
});

test('la variation est calculee a partir du cours et de la cloture precedente (baisse)', async () => {
  mockMeta({ regularMarketPrice: 95, previousClose: 100, regularMarketVolume: 1000, currency: 'EUR' });

  const priceData = await fetchYahooFinance('TEST.PA');

  assert.equal(priceData.changePct, -5);
});

test('previousClose absent (champ chartPreviousClose utilise a la place)', async () => {
  mockMeta({ regularMarketPrice: 110, chartPreviousClose: 100, regularMarketVolume: 1000, currency: 'EUR' });

  const priceData = await fetchYahooFinance('TEST.PA');

  assert.equal(priceData.changePct, 10);
});

test('aucune cloture precedente disponible : variation a 0 plutot qu une erreur', async () => {
  mockMeta({ regularMarketPrice: 100, regularMarketVolume: 1000, currency: 'EUR' });

  const priceData = await fetchYahooFinance('TEST.PA');

  assert.equal(priceData.changePct, 0);
});

test('marketState PRE avec preMarketPrice : cours et variation avant-bourse renseignes', async () => {
  mockMeta({
    regularMarketPrice: 100,
    previousClose: 98,
    regularMarketVolume: 1000,
    currency: 'USD',
    marketState: 'PRE',
    preMarketPrice: 99
  });

  const priceData = await fetchYahooFinance('TEST');

  assert.equal(priceData.avantBourseCours, 99);
  assert.equal(priceData.avantBourseVariation, ((99 - 98) / 98) * 100);
});

test('marketState REGULAR : avant-bourse absent meme si preMarketPrice encore present (donnee perimee)', async () => {
  mockMeta({
    regularMarketPrice: 100,
    previousClose: 98,
    regularMarketVolume: 1000,
    currency: 'USD',
    marketState: 'REGULAR',
    preMarketPrice: 99
  });

  const priceData = await fetchYahooFinance('TEST');

  assert.equal(priceData.avantBourseCours, null);
  assert.equal(priceData.avantBourseVariation, null);
});

test('marketState PRE sans preMarketPrice : avant-bourse absent', async () => {
  mockMeta({
    regularMarketPrice: 100,
    previousClose: 98,
    regularMarketVolume: 1000,
    currency: 'USD',
    marketState: 'PRE'
  });

  const priceData = await fetchYahooFinance('TEST');

  assert.equal(priceData.avantBourseCours, null);
  assert.equal(priceData.avantBourseVariation, null);
});

test('marche sans session avant-bourse (ex. Euronext Paris) : marketState absent, avant-bourse absent', async () => {
  mockMeta({ regularMarketPrice: 101.5, previousClose: 100, regularMarketVolume: 1000, currency: 'EUR' });

  const priceData = await fetchYahooFinance('TEST.PA');

  assert.equal(priceData.avantBourseCours, null);
  assert.equal(priceData.avantBourseVariation, null);
});
