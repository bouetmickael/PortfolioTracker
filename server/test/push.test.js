const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { demarrerServeurDeTest, creerUtilisateur } = require('./support/helpers');

const serveur = demarrerServeurDeTest('push');
const push = require('../push');
const { checkAlerts } = require('../jobs/alerts');
const db = require('../db');
let baseUrl;
let envois;
let echec;

before(async () => {
  await serveur.start();
  baseUrl = serveur.getBaseUrl();
});

after(async () => {
  await serveur.stop();
});

beforeEach(() => {
  envois = [];
  echec = null;
  push.sender.envoyer = async (subscription, payload) => {
    if (echec) throw echec;
    envois.push({ subscription, payload: JSON.parse(payload) });
  };
});

const entetes = (cookie) => ({ 'Content-Type': 'application/json', Cookie: cookie });
const abo = (n) => ({ endpoint: `https://push.example/${n}`, keys: { p256dh: `p${n}`, auth: `a${n}` } });
const nbAbonnements = (email) =>
  db
    .prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = (SELECT id FROM users WHERE email = ?)')
    .get(email).n;

test('GET /api/push/cle exige une session puis renvoie une cle stable', async () => {
  assert.equal((await fetch(`${baseUrl}/api/push/cle`)).status, 401);
  const { cookie } = await creerUtilisateur(baseUrl, 'push-cle@test.local');
  const a = await (await fetch(`${baseUrl}/api/push/cle`, { headers: { Cookie: cookie } })).json();
  const b = await (await fetch(`${baseUrl}/api/push/cle`, { headers: { Cookie: cookie } })).json();
  assert.ok(a.publicKey.length > 20);
  assert.equal(a.publicKey, b.publicKey);
});

test('POST /api/push/abonnement enregistre l\'appareil et envoie la notification de confirmation', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'push-abo@test.local');
  const res = await fetch(`${baseUrl}/api/push/abonnement`, {
    method: 'POST',
    headers: entetes(cookie),
    body: JSON.stringify(abo(1))
  });
  assert.equal(res.status, 201);
  assert.equal(nbAbonnements('push-abo@test.local'), 1);
  assert.equal(envois.length, 1);
  assert.equal(envois[0].payload.title, 'Notifications activees');
});

test('POST /api/push/abonnement refuse un abonnement incomplet', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'push-invalide@test.local');
  const res = await fetch(`${baseUrl}/api/push/abonnement`, {
    method: 'POST',
    headers: entetes(cookie),
    body: JSON.stringify({ endpoint: 'https://push.example/x' })
  });
  assert.equal(res.status, 400);
});

test('re-abonner le meme endpoint ne cree pas de doublon et change de proprietaire', async () => {
  const a = await creerUtilisateur(baseUrl, 'push-a@test.local');
  const b = await creerUtilisateur(baseUrl, 'push-b@test.local');
  for (const { cookie } of [a, a, b]) {
    await fetch(`${baseUrl}/api/push/abonnement`, { method: 'POST', headers: entetes(cookie), body: JSON.stringify(abo(2)) });
  }
  assert.equal(nbAbonnements('push-a@test.local'), 0);
  assert.equal(nbAbonnements('push-b@test.local'), 1);
});

test('DELETE /api/push/abonnement ne supprime que l\'abonnement de l\'utilisateur', async () => {
  const a = await creerUtilisateur(baseUrl, 'push-del-a@test.local');
  const b = await creerUtilisateur(baseUrl, 'push-del-b@test.local');
  await fetch(`${baseUrl}/api/push/abonnement`, { method: 'POST', headers: entetes(a.cookie), body: JSON.stringify(abo(3)) });

  await fetch(`${baseUrl}/api/push/abonnement`, {
    method: 'DELETE',
    headers: entetes(b.cookie),
    body: JSON.stringify({ endpoint: abo(3).endpoint })
  });
  assert.equal(nbAbonnements('push-del-a@test.local'), 1);

  await fetch(`${baseUrl}/api/push/abonnement`, {
    method: 'DELETE',
    headers: entetes(a.cookie),
    body: JSON.stringify({ endpoint: abo(3).endpoint })
  });
  assert.equal(nbAbonnements('push-del-a@test.local'), 0);
});

test('un abonnement expire (410) est purge lors de l\'envoi', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'push-410@test.local');
  await fetch(`${baseUrl}/api/push/abonnement`, { method: 'POST', headers: entetes(cookie), body: JSON.stringify(abo(4)) });
  const userId = db.prepare('SELECT id FROM users WHERE email = ?').get('push-410@test.local').id;

  echec = Object.assign(new Error('Gone'), { statusCode: 410 });
  const envoyes = await push.envoyerPushUtilisateur(userId, { title: 't', body: 'b' });
  assert.equal(envoyes, 0);
  assert.equal(nbAbonnements('push-410@test.local'), 0);
});

test('une erreur d\'envoi temporaire conserve l\'abonnement', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'push-5xx@test.local');
  await fetch(`${baseUrl}/api/push/abonnement`, { method: 'POST', headers: entetes(cookie), body: JSON.stringify(abo(5)) });
  const userId = db.prepare('SELECT id FROM users WHERE email = ?').get('push-5xx@test.local').id;

  echec = Object.assign(new Error('Service indisponible'), { statusCode: 503 });
  await push.envoyerPushUtilisateur(userId, { title: 't', body: 'b' });
  assert.equal(nbAbonnements('push-5xx@test.local'), 1);
});

test('checkAlerts() envoie un push avec le nom de la valeur, a l\'utilisateur concerne uniquement', async () => {
  const proprio = await creerUtilisateur(baseUrl, 'push-alerte@test.local');
  const autre = await creerUtilisateur(baseUrl, 'push-autre@test.local');
  await fetch(`${baseUrl}/api/push/abonnement`, { method: 'POST', headers: entetes(proprio.cookie), body: JSON.stringify(abo(6)) });
  await fetch(`${baseUrl}/api/push/abonnement`, { method: 'POST', headers: entetes(autre.cookie), body: JSON.stringify(abo(7)) });
  envois = [];

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: entetes(proprio.cookie),
    body: JSON.stringify({ ticker: 'AAPL', nom: 'Apple Inc.' })
  });
  // Cours mocke a 101.5 (voir test/support/helpers.js) : seuil deja franchi.
  await fetch(`${baseUrl}/api/alertes`, {
    method: 'POST',
    headers: entetes(proprio.cookie),
    body: JSON.stringify({ ticker: 'AAPL', seuilHaut: 100 })
  });

  await checkAlerts();

  assert.equal(envois.length, 1);
  assert.equal(envois[0].subscription.endpoint, abo(6).endpoint);
  assert.equal(envois[0].payload.title, 'Alerte HAUTE : Apple Inc.');
  assert.match(envois[0].payload.body, /101\.50 EUR/);
});

test('checkAlerts() enregistre le declenchement meme si le push echoue', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'push-echec@test.local');
  await fetch(`${baseUrl}/api/push/abonnement`, { method: 'POST', headers: entetes(cookie), body: JSON.stringify(abo(8)) });
  await fetch(`${baseUrl}/api/valeurs`, { method: 'POST', headers: entetes(cookie), body: JSON.stringify({ ticker: 'AAPL' }) });
  await fetch(`${baseUrl}/api/alertes`, {
    method: 'POST',
    headers: entetes(cookie),
    body: JSON.stringify({ ticker: 'AAPL', seuilHaut: 100 })
  });

  echec = new Error('Reseau indisponible');
  await checkAlerts();

  const alertes = await (await fetch(`${baseUrl}/api/alertes`, { headers: { Cookie: cookie } })).json();
  assert.ok(alertes[0].derniereAlerte);
});
