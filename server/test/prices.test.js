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

// Cours avant-bourse : correctif suite a un retour utilisateur (NVDA
// n'affichait jamais de cours avant-bourse malgre une fenetre de
// pre-ouverture reelle). meta.marketState/meta.preMarketPrice, utilises par
// l'implementation initiale, n'existent PAS sur /v8/finance/chart (verifie
// via le schema ChartMeta de yahoo-finance2, voir server/jobs/prices.js et
// TODO.md) : le mecanisme correct repose sur meta.currentTradingPeriod.pre
// (horaires Unix de la session avant-bourse du jour, bien present sur cet
// endpoint) et un second appel a interval=1m&includePrePost=true pour lire
// le dernier prix reellement echange.
function mockMetaEtPreMarket(meta, closesPreMarket) {
  global.fetch = (url) => {
    if (typeof url === 'string' && url.includes('interval=1m')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ chart: { result: [{ indicators: { quote: [{ close: closesPreMarket }] } }] } })
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ chart: { result: [{ meta }] } })
    });
  };
}

test('fenetre avant-bourse active et dernier prix disponible : cours et variation avant-bourse renseignes', async () => {
  const maintenant = Math.floor(Date.now() / 1000);
  mockMetaEtPreMarket(
    {
      regularMarketPrice: 100,
      previousClose: 98,
      regularMarketVolume: 1000,
      currency: 'USD',
      currentTradingPeriod: { pre: { start: maintenant - 60, end: maintenant + 3600 } }
    },
    [null, 99]
  );

  const priceData = await fetchYahooFinance('TEST');

  assert.equal(priceData.avantBourseCours, 99);
  assert.equal(priceData.avantBourseVariation, ((99 - 98) / 98) * 100);
});

test('en dehors de la fenetre avant-bourse : avant-bourse absent, aucun appel supplementaire', async () => {
  const maintenant = Math.floor(Date.now() / 1000);
  let appelsInterval1m = 0;
  global.fetch = (url) => {
    if (typeof url === 'string' && url.includes('interval=1m')) appelsInterval1m += 1;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 100,
                previousClose: 98,
                regularMarketVolume: 1000,
                currency: 'USD',
                // Fenetre avant-bourse deja terminee il y a une heure.
                currentTradingPeriod: { pre: { start: maintenant - 7200, end: maintenant - 3600 } }
              }
            }
          ]
        }
      })
    });
  };

  const priceData = await fetchYahooFinance('TEST');

  assert.equal(priceData.avantBourseCours, null);
  assert.equal(priceData.avantBourseVariation, null);
  assert.equal(appelsInterval1m, 0);
});

test('fenetre avant-bourse active mais aucune bougie valide : avant-bourse absent', async () => {
  const maintenant = Math.floor(Date.now() / 1000);
  mockMetaEtPreMarket(
    {
      regularMarketPrice: 100,
      previousClose: 98,
      regularMarketVolume: 1000,
      currency: 'USD',
      currentTradingPeriod: { pre: { start: maintenant - 60, end: maintenant + 3600 } }
    },
    [null, null]
  );

  const priceData = await fetchYahooFinance('TEST');

  assert.equal(priceData.avantBourseCours, null);
  assert.equal(priceData.avantBourseVariation, null);
});

test("l'appel avant-bourse echoue : le cours normal reste renseigne, avant-bourse absent sans lever d'erreur", async () => {
  const maintenant = Math.floor(Date.now() / 1000);
  global.fetch = (url) => {
    if (typeof url === 'string' && url.includes('interval=1m')) {
      return Promise.resolve({ ok: false, status: 500 });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 100,
                previousClose: 98,
                regularMarketVolume: 1000,
                currency: 'USD',
                currentTradingPeriod: { pre: { start: maintenant - 60, end: maintenant + 3600 } }
              }
            }
          ]
        }
      })
    });
  };

  const priceData = await fetchYahooFinance('TEST');

  assert.equal(priceData.price, 100);
  assert.equal(priceData.avantBourseCours, null);
  assert.equal(priceData.avantBourseVariation, null);
});

test('marche sans session avant-bourse (ex. Euronext Paris) : currentTradingPeriod absent, avant-bourse absent', async () => {
  mockMeta({ regularMarketPrice: 101.5, previousClose: 100, regularMarketVolume: 1000, currency: 'EUR' });

  const priceData = await fetchYahooFinance('TEST.PA');

  assert.equal(priceData.avantBourseCours, null);
  assert.equal(priceData.avantBourseVariation, null);
});
