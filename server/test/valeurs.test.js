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

// GET /api/valeurs renvoie un tableau (pas une map indexee par ticker,
// devenu ambigu depuis qu'un ticker peut apparaitre dans plusieurs
// sections - voir BUSINESS_RULES.md § Valeurs suivies).
function parTicker(valeurs, ticker) {
  return valeurs.find((v) => v.ticker === ticker);
}

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
  assert.equal(parTicker(valeurs, 'AAPL').sectionId, defaut.id);
  assert.equal(parTicker(valeurs, 'AAPL').ordre, 0);
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
  assert.equal(parTicker(valeurs, 'AAPL').ordre, 0);
  assert.equal(parTicker(valeurs, 'MSFT').ordre, 1);
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
  assert.equal(parTicker(valeursA, 'AAPL').sectionId, sectionsA[0].id);
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
  assert.equal(valeurs.length, 0);
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
  const aapl = parTicker(valeurs, 'AAPL');
  assert.equal(aapl.cours, 100);
  assert.equal(aapl.variation, 1.5);
  assert.equal(aapl.type, 'Warrant');
  assert.ok(aapl.derniereMaj > 0);
});

// Reproduit un ticker "legacy" ajoute avant la validation Yahoo Finance
// (ex. "LVMH/SGE WT 26", voir DESIGN.md/BACKLOG.md) : insere directement en
// base (impossible a recreer via l'API desormais, voir tests ci-dessus) pour
// verifier que la suppression fonctionne malgre le "/" dans le ticker.
test('une valeur au ticker contenant un "/" (ajoutee avant la validation) reste supprimable', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-slash@test.local');

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get('valeurs-slash@test.local');
  const section = db.prepare('SELECT id FROM sections WHERE user_id = ?').get(user.id);
  const insertion = db
    .prepare(
      `INSERT INTO valeurs (user_id, ticker, type, nom, cours, variation, volume, derniere_maj, ajoute_le, section_id, ordre)
       VALUES (?, 'LVMH/SGE WT 26', 'Warrant', '', 0, 0, 0, NULL, ?, ?, 0)`
    )
    .run(user.id, Date.now(), section.id);

  const res = await fetch(`${baseUrl}/api/valeurs/${insertion.lastInsertRowid}`, {
    method: 'DELETE',
    headers: { Cookie: cookie }
  });
  assert.equal(res.status, 200);

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  assert.equal(valeurs.length, 0);
});

test('une meme valeur peut etre suivie dans deux sections differentes', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-multi-section@test.local');

  const sections = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: cookie } })).json();
  const [sectionDefaut] = sections;

  const nouvelleSection = await (
    await fetch(`${baseUrl}/api/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ nom: 'Watchlist' })
    })
  ).json();

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', sectionId: sectionDefaut.id })
  });
  const ajoutDeuxiemeSection = await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', sectionId: nouvelleSection.id })
  });
  assert.equal(ajoutDeuxiemeSection.status, 201);

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  const occurrences = valeurs.filter((v) => v.ticker === 'AAPL');
  assert.equal(occurrences.length, 2);
  assert.deepEqual(
    occurrences.map((v) => v.sectionId).sort(),
    [sectionDefaut.id, nouvelleSection.id].sort()
  );
});

test('la meme valeur deux fois dans la meme section est refusee (409)', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-doublon-section@test.local');

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });
  const res = await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });

  assert.equal(res.status, 409);
});

test('supprimer une occurrence d une valeur dupliquee ne supprime pas l autre', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-suppr-partielle@test.local');

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

  const valeursAvant = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  const occurrenceDefaut = valeursAvant.find((v) => v.ticker === 'AAPL' && v.sectionId === sectionDefaut.id);

  const suppression = await fetch(`${baseUrl}/api/valeurs/${occurrenceDefaut.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookie }
  });
  assert.equal(suppression.status, 200);

  const valeursApres = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  const occurrencesRestantes = valeursApres.filter((v) => v.ticker === 'AAPL');
  assert.equal(occurrencesRestantes.length, 1);
  assert.equal(occurrencesRestantes[0].sectionId, autreSection.id);
});

test('supprimer la derniere occurrence d une valeur supprime ses alertes, mais pas tant qu il en reste une autre', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-suppr-alerte@test.local');

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
  const occurrenceDefaut = valeurs.find((v) => v.ticker === 'AAPL' && v.sectionId === sectionDefaut.id);
  const occurrenceAutre = valeurs.find((v) => v.ticker === 'AAPL' && v.sectionId === autreSection.id);

  await fetch(`${baseUrl}/api/valeurs/${occurrenceDefaut.id}`, { method: 'DELETE', headers: { Cookie: cookie } });

  const alertesApresPremiereSuppression = await (
    await fetch(`${baseUrl}/api/alertes`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(alertesApresPremiereSuppression.length, 1);

  await fetch(`${baseUrl}/api/valeurs/${occurrenceAutre.id}`, { method: 'DELETE', headers: { Cookie: cookie } });

  const alertesApresSecondeSuppression = await (
    await fetch(`${baseUrl}/api/alertes`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(alertesApresSecondeSuppression.length, 0);
});

test('la recherche de valeur renvoie les tickers correspondant a un nom', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-recherche@test.local');

  const res = await fetch(`${baseUrl}/api/valeurs/recherche?q=schneider`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);

  const resultats = await res.json();
  assert.equal(resultats.length, 1);
  assert.equal(resultats[0].ticker, 'SU.PA');
  assert.equal(resultats[0].nom, 'Schneider Electric SE');
  assert.equal(resultats[0].bourse, 'Paris');
});

test('la recherche de valeur sans correspondance renvoie une liste vide', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-recherche-vide@test.local');

  const res = await fetch(`${baseUrl}/api/valeurs/recherche?q=inconnu`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test('la recherche de valeur exige au moins 2 caracteres', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'valeurs-recherche-court@test.local');

  const res = await fetch(`${baseUrl}/api/valeurs/recherche?q=s`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test('la recherche de valeur exige une authentification', async () => {
  const res = await fetch(`${baseUrl}/api/valeurs/recherche?q=schneider`);
  assert.equal(res.status, 401);
});
