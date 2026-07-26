const path = require('path');
const os = require('os');
const fs = require('fs');

// Un ticker Yahoo Finance valide ne contient que lettres/chiffres/points/
// tirets/carets (ex. AAPL, MC.PA, ^GSPC) ; simule ici la reponse Yahoo
// Finance sans appel reseau reel, pour que les tests d'ajout de valeur
// (POST /api/valeurs, POST /api/sections/:id/valeurs) restent
// deterministes et hors ligne. Voir server/valeurs.js (verifierTickerExiste).
const TICKER_YAHOO_VALIDE = /^[A-Z0-9.\-^]+$/;

// Jeu fixe pour simuler GET /api/valeurs/recherche (server/valeurs.js,
// rechercherTickers) sans appel reseau reel : seule la requete "schneider"
// (insensible a la casse) renvoie un resultat, toute autre requete renvoie
// une liste vide (comme une recherche Yahoo Finance sans correspondance).
const RECHERCHE_RESULTATS = {
  schneider: [
    { symbol: 'SU.PA', longname: 'Schneider Electric SE', shortname: 'SCHNEIDER ELECTRIC', exchDisp: 'Paris' }
  ]
};

function mockFetchYahooFinance() {
  const fetchOriginal = global.fetch;

  global.fetch = (url, options) => {
    if (typeof url === 'string' && url.includes('query1.finance.yahoo.com/v1/finance/search')) {
      const query = new URL(url).searchParams.get('q') || '';
      const quotes = RECHERCHE_RESULTATS[query.toLowerCase()] || [];
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ quotes }) });
    }
    if (typeof url === 'string' && url.includes('query1.finance.yahoo.com')) {
      const ticker = decodeURIComponent(url.split('/chart/')[1].split('?')[0]);
      if (!TICKER_YAHOO_VALIDE.test(ticker)) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          chart: {
            result: [
              {
                meta: { regularMarketPrice: 100, regularMarketChangePercent: 1.5, regularMarketVolume: 1000, currency: 'USD' }
              }
            ]
          }
        })
      });
    }
    return fetchOriginal(url, options);
  };
}

function demarrerServeurDeTest(nomFichier) {
  const dbFile = path.join(os.tmpdir(), `portfolio-test-${nomFichier}-${Date.now()}-${process.pid}.db`);
  process.env.DB_PATH = dbFile;
  process.env.SESSION_SECRET = 'test-secret';

  mockFetchYahooFinance();

  // eslint-disable-next-line global-require
  const app = require('../../app');

  let server;
  let baseUrl;

  async function start() {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  }

  async function stop() {
    await new Promise((resolve) => server.close(resolve));
    for (const suffix of ['', '-wal', '-shm']) {
      fs.rmSync(dbFile + suffix, { force: true });
    }
  }

  function getBaseUrl() {
    return baseUrl;
  }

  return { start, stop, getBaseUrl };
}

function extraireCookie(res) {
  const setCookie = res.headers.get('set-cookie');
  return setCookie ? setCookie.split(';')[0] : null;
}

async function creerUtilisateur(baseUrl, email, password = 'password123') {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const cookie = extraireCookie(res);
  return { res, cookie };
}

module.exports = { demarrerServeurDeTest, extraireCookie, creerUtilisateur };
