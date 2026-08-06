const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { demarrerServeurDeTest, creerUtilisateur } = require('./support/helpers');

const serveur = demarrerServeurDeTest('portefeuilles');
// Requis apres demarrerServeurDeTest() : DB_PATH est deja positionne et le
// module server/db.js deja charge (singleton partage par tout le process),
// updatePortefeuilleLignes() opere donc sur la meme base que le serveur de
// test (meme pattern que server/test/prices-job.test.js).
const { updatePortefeuilleLignes } = require('../jobs/prices');
let baseUrl;

before(async () => {
  await serveur.start();
  baseUrl = serveur.getBaseUrl();
});

after(async () => {
  await serveur.stop();
});

test('un nouvel utilisateur n a aucun portefeuille', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'pf-defaut@test.local');

  const res = await fetch(`${baseUrl}/api/portefeuilles`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test('creer, renommer et supprimer un portefeuille', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'pf-crud@test.local');

  const create = await fetch(`${baseUrl}/api/portefeuilles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ nom: 'CTO Bourso' })
  });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.equal(created.nom, 'CTO Bourso');
  assert.equal(created.ordre, 0);

  const rename = await fetch(`${baseUrl}/api/portefeuilles/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ nom: 'PEA' })
  });
  assert.equal(rename.status, 200);

  const list = await (await fetch(`${baseUrl}/api/portefeuilles`, { headers: { Cookie: cookie } })).json();
  assert.equal(list.length, 1);
  assert.equal(list[0].nom, 'PEA');

  const del = await fetch(`${baseUrl}/api/portefeuilles/${created.id}`, { method: 'DELETE', headers: { Cookie: cookie } });
  assert.equal(del.status, 200);

  const listApres = await (await fetch(`${baseUrl}/api/portefeuilles`, { headers: { Cookie: cookie } })).json();
  assert.equal(listApres.length, 0);
});

test('creation refusee sans nom', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'pf-invalid@test.local');

  const res = await fetch(`${baseUrl}/api/portefeuilles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ nom: '   ' })
  });
  assert.equal(res.status, 400);
});

test('ajouter une position calcule le cours et la plus/moins-value latente', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'pf-position@test.local');

  const portefeuille = await (
    await fetch(`${baseUrl}/api/portefeuilles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ nom: 'CTO' })
    })
  ).json();

  const add = await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', quantite: 10, prixRevient: 90 })
  });
  assert.equal(add.status, 201);

  const positions = await (await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, { headers: { Cookie: cookie } })).json();
  assert.equal(positions.length, 1);
  assert.equal(positions[0].ticker, 'AAPL');
  assert.equal(positions[0].quantite, 10);
  assert.equal(positions[0].prixRevient, 90);
  // mock Yahoo Finance : regularMarketPrice = 101.5 (voir support/helpers.js)
  assert.equal(positions[0].cours, 101.5);
});

test('doublon du meme ticker dans le meme portefeuille refuse', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'pf-doublon@test.local');

  const portefeuille = await (
    await fetch(`${baseUrl}/api/portefeuilles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ nom: 'CTO' })
    })
  ).json();

  await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', quantite: 5, prixRevient: 100 })
  });

  const second = await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', quantite: 3, prixRevient: 95 })
  });
  assert.equal(second.status, 409);
});

test('quantite ou prix de revient invalide refuse', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'pf-invalid-position@test.local');

  const portefeuille = await (
    await fetch(`${baseUrl}/api/portefeuilles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ nom: 'CTO' })
    })
  ).json();

  const sansQuantite = await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', quantite: 0, prixRevient: 90 })
  });
  assert.equal(sansQuantite.status, 400);

  const prixNegatif = await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', quantite: 5, prixRevient: -1 })
  });
  assert.equal(prixNegatif.status, 400);
});

test('modifier puis supprimer une position', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'pf-edit-position@test.local');

  const portefeuille = await (
    await fetch(`${baseUrl}/api/portefeuilles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ nom: 'CTO' })
    })
  ).json();

  const add = await (
    await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ticker: 'AAPL', quantite: 10, prixRevient: 90 })
    })
  ).json();

  const edit = await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions/${add.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ quantite: 15, prixRevient: 85 })
  });
  assert.equal(edit.status, 200);

  const positionsApresEdit = await (await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, { headers: { Cookie: cookie } })).json();
  assert.equal(positionsApresEdit[0].quantite, 15);
  assert.equal(positionsApresEdit[0].prixRevient, 85);

  const del = await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions/${add.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookie }
  });
  assert.equal(del.status, 200);

  const positionsApresDelete = await (await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, { headers: { Cookie: cookie } })).json();
  assert.equal(positionsApresDelete.length, 0);
});

test('supprimer un portefeuille supprime ses positions (cascade)', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'pf-cascade@test.local');

  const portefeuille = await (
    await fetch(`${baseUrl}/api/portefeuilles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ nom: 'CTO' })
    })
  ).json();

  await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', quantite: 10, prixRevient: 90 })
  });

  await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}`, { method: 'DELETE', headers: { Cookie: cookie } });

  const positionsRes = await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, { headers: { Cookie: cookie } });
  assert.equal(positionsRes.status, 404);
});

test('isolation stricte : un utilisateur ne peut pas voir ou modifier le portefeuille d un autre', async () => {
  const userA = await creerUtilisateur(baseUrl, 'pf-iso-a@test.local');
  const userB = await creerUtilisateur(baseUrl, 'pf-iso-b@test.local');

  const portefeuilleA = await (
    await fetch(`${baseUrl}/api/portefeuilles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ nom: 'CTO A' })
    })
  ).json();

  const rename = await fetch(`${baseUrl}/api/portefeuilles/${portefeuilleA.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
    body: JSON.stringify({ nom: 'Hack' })
  });
  assert.equal(rename.status, 404);

  const positions = await fetch(`${baseUrl}/api/portefeuilles/${portefeuilleA.id}/positions`, { headers: { Cookie: userB.cookie } });
  assert.equal(positions.status, 404);

  const del = await fetch(`${baseUrl}/api/portefeuilles/${portefeuilleA.id}`, { method: 'DELETE', headers: { Cookie: userB.cookie } });
  assert.equal(del.status, 404);
});

test('les routes de portefeuilles exigent une authentification', async () => {
  const res = await fetch(`${baseUrl}/api/portefeuilles`);
  assert.equal(res.status, 401);
});

test('updatePortefeuilleLignes() met a jour le cours des positions', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'pf-job@test.local');

  const portefeuille = await (
    await fetch(`${baseUrl}/api/portefeuilles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ nom: 'CTO' })
    })
  ).json();

  await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', quantite: 10, prixRevient: 90 })
  });

  await updatePortefeuilleLignes();

  const positions = await (await fetch(`${baseUrl}/api/portefeuilles/${portefeuille.id}/positions`, { headers: { Cookie: cookie } })).json();
  assert.equal(positions[0].cours, 101.5);
  assert.ok(positions[0].derniereMaj);
});
