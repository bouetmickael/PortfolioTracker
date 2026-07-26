const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { demarrerServeurDeTest, creerUtilisateur } = require('./support/helpers');

const serveur = demarrerServeurDeTest('valeurs');
const db = require('../db');
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

// Reproduit un ticker "legacy" ajoute avant la validation Yahoo Finance
// (ex. "LVMH/SGE WT 26", voir DESIGN.md/BACKLOG.md) : insere directement en
// base (impossible a recreer via l'API desormais, voir tests ci-dessus) pour
// verifier que la suppression fonctionne malgre le "/" dans le ticker, qui
// casserait le routage Express si l'URL n'etait pas encodee cote client.
test('un ticker contenant un "/" (ajoute avant la validation) reste supprimable', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-slash@test.local');

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get('valeurs-slash@test.local');
  const section = db.prepare('SELECT id FROM sections WHERE user_id = ?').get(user.id);
  db.prepare(
    `INSERT INTO valeurs (user_id, ticker, type, nom, cours, variation, volume, derniere_maj, ajoute_le, section_id, ordre)
     VALUES (?, 'LVMH/SGE WT 26', 'Warrant', '', 0, 0, 0, NULL, ?, ?, 0)`
  ).run(user.id, Date.now(), section.id);

  const res = await fetch(`${baseUrl}/api/valeurs/${encodeURIComponent('LVMH/SGE WT 26')}`, {
    method: 'DELETE',
    headers: { Cookie: cookie }
  });
  assert.equal(res.status, 200);

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  assert.equal(Object.keys(valeurs).length, 0);
});
