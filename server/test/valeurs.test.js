const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { demarrerServeurDeTest, creerUtilisateur } = require('./support/helpers');

const serveur = demarrerServeurDeTest('valeurs');
let baseUrl;

before(async () => {
  await serveur.start();
  baseUrl = serveur.getBaseUrl();
});

after(async () => {
  await serveur.stop();
});

test('une valeur creee sans sectionId est rangee dans la section par defaut', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-defaut@test.local');

  const sections = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: cookie } })).json();
  const [defaut] = sections;

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  assert.equal(valeurs.AAPL.sectionId, defaut.id);
  assert.equal(valeurs.AAPL.ordre, 0);
});

test('deux valeurs ajoutees a la meme section recoivent un ordre croissant', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-ordre@test.local');

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });
  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'MSFT' })
  });

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  assert.equal(valeurs.AAPL.ordre, 0);
  assert.equal(valeurs.MSFT.ordre, 1);
});

test('un sectionId appartenant a un autre utilisateur est ignore (retombe sur la section par defaut)', async () => {
  const userA = await creerUtilisateur(baseUrl, 'valeurs-iso-a@test.local');
  const userB = await creerUtilisateur(baseUrl, 'valeurs-iso-b@test.local');

  const sectionsB = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: userB.cookie } })).json();
  const [sectionB] = sectionsB;

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
    body: JSON.stringify({ ticker: 'AAPL', sectionId: sectionB.id })
  });

  const sectionsA = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: userA.cookie } })).json();
  const valeursA = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: userA.cookie } })).json();
  assert.equal(valeursA.AAPL.sectionId, sectionsA[0].id);
});

test('un ticker introuvable sur Yahoo Finance est rejete et non ajoute', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-introuvable@test.local');

  const res = await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'PAS DE CONTROLE' })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error, 'Valeur introuvable sur Yahoo Finance');

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  assert.equal(Object.keys(valeurs).length, 0);
});

test('une valeur trouvee sur Yahoo Finance est ajoutee avec son cours reel', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-trouvee@test.local');

  const res = await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', type: 'Warrant' })
  });

  assert.equal(res.status, 201);

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  assert.equal(valeurs.AAPL.cours, 100);
  assert.equal(valeurs.AAPL.variation, 1.5);
  assert.equal(valeurs.AAPL.type, 'Warrant');
  assert.ok(valeurs.AAPL.derniereMaj > 0);
});
