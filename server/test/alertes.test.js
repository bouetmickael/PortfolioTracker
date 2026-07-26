const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { demarrerServeurDeTest, creerUtilisateur } = require('./support/helpers');

const serveur = demarrerServeurDeTest('alertes');
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

test('une valeur suivie sans alerte a hasAlerte a false', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'alertes-sans@test.local');

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  assert.equal(parTicker(valeurs, 'AAPL').hasAlerte, false);
});

test('creer une alerte active fait passer hasAlerte a true sur la valeur correspondante', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'alertes-avec@test.local');

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });
  await fetch(`${baseUrl}/api/alertes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', seuilHaut: 200 })
  });

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  assert.equal(parTicker(valeurs, 'AAPL').hasAlerte, true);
});

test('supprimer l alerte fait repasser hasAlerte a false', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'alertes-suppr@test.local');

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });
  await fetch(`${baseUrl}/api/alertes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', seuilHaut: 200 })
  });

  const alertes = await (await fetch(`${baseUrl}/api/alertes`, { headers: { Cookie: cookie } })).json();
  const [alerteId] = Object.keys(alertes);

  await fetch(`${baseUrl}/api/alertes/${alerteId}`, { method: 'DELETE', headers: { Cookie: cookie } });

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  assert.equal(parTicker(valeurs, 'AAPL').hasAlerte, false);
});

test('une alerte creee pour un ticker suivi par un autre utilisateur ne marque pas sa valeur', async () => {
  const userA = await creerUtilisateur(baseUrl, 'alertes-iso-a@test.local');
  const userB = await creerUtilisateur(baseUrl, 'alertes-iso-b@test.local');

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });
  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });

  await fetch(`${baseUrl}/api/alertes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
    body: JSON.stringify({ ticker: 'AAPL', seuilHaut: 200 })
  });

  const valeursA = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: userA.cookie } })).json();
  const valeursB = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: userB.cookie } })).json();
  assert.equal(parTicker(valeursA, 'AAPL').hasAlerte, false);
  assert.equal(parTicker(valeursB, 'AAPL').hasAlerte, true);
});

test('une alerte marque toutes les occurrences de son ticker suivies dans plusieurs sections', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'alertes-multi-section@test.local');

  const [sectionDefaut] = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: cookie } })).json();
  const autreSection = await (
    await fetch(`${baseUrl}/api/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ nom: 'Autre' })
    })
  ).json();

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', sectionId: sectionDefaut.id })
  });
  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', sectionId: autreSection.id })
  });
  await fetch(`${baseUrl}/api/alertes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', seuilHaut: 200 })
  });

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  const occurrences = valeurs.filter((v) => v.ticker === 'AAPL');
  assert.equal(occurrences.length, 2);
  assert.ok(occurrences.every((v) => v.hasAlerte === true));
});
