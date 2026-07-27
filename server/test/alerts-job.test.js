const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { demarrerServeurDeTest, creerUtilisateur } = require('./support/helpers');

const serveur = demarrerServeurDeTest('alerts-job');
// Requis apres demarrerServeurDeTest() : DB_PATH est deja positionne et le
// module server/db.js deja charge (singleton partage par tout le process),
// checkAlerts() opere donc sur la meme base que le serveur de test.
const { checkAlerts } = require('../jobs/alerts');
let baseUrl;

before(async () => {
  await serveur.start();
  baseUrl = serveur.getBaseUrl();
});

after(async () => {
  await serveur.stop();
});

function parTicker(alertes, ticker) {
  return alertes.find((a) => a.ticker === ticker);
}

// Regression pour le retour utilisateur du 2026-07-27 : deux seuils franchis
// sans aucune notification visible (SMTP non configure sur le deploiement -
// voir BUSINESS_RULES.md § Alertes de seuil, l'email est optionnel et non
// bloquant). Ce test verifie le mecanisme independamment de l'envoi
// d'email : checkAlerts() doit ecrire derniere_alerte/dernier_cours_alerte
// des qu'un seuil est franchi, meme quand aucun SMTP n'est configure (cas
// par defaut de cet environnement de test - voir server/mailer.js).
test('checkAlerts() declenche une alerte haute et renseigne derniereAlerte, meme sans SMTP configure', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'alerts-job-haute@test.local');

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });
  // Cours mocke a 101.5 (voir server/test/support/helpers.js) : seuil haut
  // en dessous du cours pour forcer un declenchement immediat.
  await fetch(`${baseUrl}/api/alertes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', seuilHaut: 100 })
  });

  const avant = parTicker(await (await fetch(`${baseUrl}/api/alertes`, { headers: { Cookie: cookie } })).json(), 'AAPL');
  assert.equal(avant.derniereAlerte, null);

  await checkAlerts();

  const apres = parTicker(await (await fetch(`${baseUrl}/api/alertes`, { headers: { Cookie: cookie } })).json(), 'AAPL');
  assert.ok(apres.derniereAlerte, 'derniereAlerte doit etre renseignee des le franchissement du seuil');
  assert.equal(apres.dernierCoursAlerte, 101.5);
});

test('checkAlerts() ne redeclenche pas tant que le cours reste au-dela du seuil (anti-repetition)', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'alerts-job-repeat@test.local');

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });
  await fetch(`${baseUrl}/api/alertes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', seuilHaut: 100 })
  });

  await checkAlerts();
  const premiereAlerte = parTicker(await (await fetch(`${baseUrl}/api/alertes`, { headers: { Cookie: cookie } })).json(), 'AAPL');

  await checkAlerts();
  const deuxiemeVerification = parTicker(
    await (await fetch(`${baseUrl}/api/alertes`, { headers: { Cookie: cookie } })).json(),
    'AAPL'
  );

  assert.equal(deuxiemeVerification.derniereAlerte, premiereAlerte.derniereAlerte);
});

test('checkAlerts() ne declenche rien quand le cours reste dans les seuils', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'alerts-job-neutre@test.local');

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });
  // Cours mocke a 101.5 : seuil haut au-dessus et seuil bas en dessous,
  // aucun des deux n'est franchi.
  await fetch(`${baseUrl}/api/alertes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', seuilHaut: 200, seuilBas: 50 })
  });

  await checkAlerts();

  const alerte = parTicker(await (await fetch(`${baseUrl}/api/alertes`, { headers: { Cookie: cookie } })).json(), 'AAPL');
  assert.equal(alerte.derniereAlerte, null);
});
