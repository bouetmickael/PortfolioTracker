const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { demarrerServeurDeTest, creerUtilisateur } = require('./support/helpers');

const serveur = demarrerServeurDeTest('indices');
let baseUrl;

before(async () => {
  await serveur.start();
  baseUrl = serveur.getBaseUrl();
});

after(async () => {
  await serveur.stop();
});

test('GET /api/indices requiert une authentification', async () => {
  const res = await fetch(`${baseUrl}/api/indices`);
  assert.equal(res.status, 401);
});

test('GET /api/indices renvoie les 3 indices suivis dans un ordre stable', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'indices-liste@test.local');

  const indices = await (await fetch(`${baseUrl}/api/indices`, { headers: { Cookie: cookie } })).json();

  assert.equal(indices.length, 3);
  assert.deepEqual(
    indices.map((i) => i.ticker),
    ['^SBF120', '^NDX', '^GSPC']
  );
  assert.deepEqual(
    indices.map((i) => i.nom),
    ['SBF 120', 'Nasdaq-100', 'S&P 500']
  );
});

test("GET /api/indices n'est pas propre a un utilisateur (donnees de marche globales)", async () => {
  const userA = await creerUtilisateur(baseUrl, 'indices-a@test.local');
  const userB = await creerUtilisateur(baseUrl, 'indices-b@test.local');

  const indicesA = await (await fetch(`${baseUrl}/api/indices`, { headers: { Cookie: userA.cookie } })).json();
  const indicesB = await (await fetch(`${baseUrl}/api/indices`, { headers: { Cookie: userB.cookie } })).json();

  assert.deepEqual(
    indicesA.map((i) => i.ticker),
    indicesB.map((i) => i.ticker)
  );
});
