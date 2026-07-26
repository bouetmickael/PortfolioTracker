const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { demarrerServeurDeTest, creerUtilisateur } = require('./support/helpers');

const serveur = demarrerServeurDeTest('sections');
let baseUrl;

before(async () => {
  await serveur.start();
  baseUrl = serveur.getBaseUrl();
});

after(async () => {
  await serveur.stop();
});

test('un nouvel utilisateur a une section par defaut "General"', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'sections-defaut@test.local');

  const res = await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);

  const sections = await res.json();
  assert.equal(sections.length, 1);
  assert.equal(sections[0].nom, 'General');
  assert.equal(sections[0].ordre, 0);
});

test('creer et renommer une section', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'sections-crud@test.local');

  const create = await fetch(`${baseUrl}/api/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ nom: 'Actions US' })
  });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.equal(created.nom, 'Actions US');
  assert.equal(created.ordre, 1);

  const rename = await fetch(`${baseUrl}/api/sections/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ nom: 'Tech US' })
  });
  assert.equal(rename.status, 200);

  const list = await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: cookie } });
  const sections = await list.json();
  assert.equal(sections.length, 2);
  assert.ok(sections.some((s) => s.nom === 'Tech US'));
});

test('creation refusee sans nom', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'sections-invalid@test.local');

  const res = await fetch(`${baseUrl}/api/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ nom: '   ' })
  });
  assert.equal(res.status, 400);
});

test('impossible de supprimer la derniere section', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'sections-last@test.local');

  const list = await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: cookie } });
  const [defaut] = await list.json();

  const del = await fetch(`${baseUrl}/api/sections/${defaut.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookie }
  });
  assert.equal(del.status, 400);
});

test('supprimer une section reassigne ses valeurs a une section restante', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'sections-delete@test.local');

  const createSection = await fetch(`${baseUrl}/api/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ nom: 'A supprimer' })
  });
  const section = await createSection.json();

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', sectionId: section.id })
  });

  const del = await fetch(`${baseUrl}/api/sections/${section.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookie }
  });
  assert.equal(del.status, 200);
  const body = await del.json();

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  assert.equal(valeurs.find((v) => v.ticker === 'AAPL').sectionId, body.fallbackSectionId);
});

test('supprimer une section fusionne (sans erreur) une valeur deja presente dans la section de repli', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'sections-delete-doublon@test.local');

  const [sectionDefaut] = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: cookie } })).json();
  const section = await (
    await fetch(`${baseUrl}/api/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ nom: 'A supprimer' })
    })
  ).json();

  // AAPL suivi a la fois dans la section a supprimer et dans la section de
  // repli (la premiere section, ordre le plus bas) : sans traitement
  // particulier, le deplacement violerait UNIQUE(user_id, ticker, section_id).
  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', sectionId: sectionDefaut.id })
  });
  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'MSFT', sectionId: section.id })
  });
  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', sectionId: section.id })
  });

  const del = await fetch(`${baseUrl}/api/sections/${section.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookie }
  });
  assert.equal(del.status, 200);

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  const occurrencesAAPL = valeurs.filter((v) => v.ticker === 'AAPL');
  assert.equal(occurrencesAAPL.length, 1);
  assert.equal(occurrencesAAPL[0].sectionId, sectionDefaut.id);
  assert.equal(valeurs.find((v) => v.ticker === 'MSFT').sectionId, sectionDefaut.id);
});

test('isolation stricte : un utilisateur ne peut pas renommer ou supprimer la section d un autre', async () => {
  const userA = await creerUtilisateur(baseUrl, 'sections-iso-a@test.local');
  const userB = await creerUtilisateur(baseUrl, 'sections-iso-b@test.local');

  const listA = await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: userA.cookie } });
  const [sectionA] = await listA.json();

  const rename = await fetch(`${baseUrl}/api/sections/${sectionA.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
    body: JSON.stringify({ nom: 'Hack' })
  });
  assert.equal(rename.status, 404);

  const del = await fetch(`${baseUrl}/api/sections/${sectionA.id}`, {
    method: 'DELETE',
    headers: { Cookie: userB.cookie }
  });
  assert.equal(del.status, 404);
});

test('reorder persiste l ordre des sections et des valeurs', async () => {
  const { cookie } = await creerUtilisateur(baseUrl, 'sections-reorder@test.local');

  const listInit = await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: cookie } });
  const [sectionDefaut] = await listInit.json();

  const createSection = await fetch(`${baseUrl}/api/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ nom: 'Deuxieme' })
  });
  const section2 = await createSection.json();

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'AAPL', sectionId: sectionDefaut.id })
  });
  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ticker: 'MSFT', sectionId: sectionDefaut.id })
  });

  const valeursAvant = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  const idAvant = (ticker) => valeursAvant.find((v) => v.ticker === ticker).id;

  const reorder = await fetch(`${baseUrl}/api/sections/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      sections: [
        { id: section2.id, ordre: 0, valeurIds: [] },
        { id: sectionDefaut.id, ordre: 1, valeurIds: [idAvant('MSFT'), idAvant('AAPL')] }
      ]
    })
  });
  assert.equal(reorder.status, 200);

  const sections = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: cookie } })).json();
  assert.equal(sections[0].id, section2.id);
  assert.equal(sections[0].ordre, 0);
  assert.equal(sections[1].id, sectionDefaut.id);
  assert.equal(sections[1].ordre, 1);

  const valeurs = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: cookie } })).json();
  assert.equal(valeurs.find((v) => v.ticker === 'MSFT').ordre, 0);
  assert.equal(valeurs.find((v) => v.ticker === 'AAPL').ordre, 1);
});

test('reorder refuse une section n appartenant pas a l utilisateur', async () => {
  const userA = await creerUtilisateur(baseUrl, 'sections-reorder-iso-a@test.local');
  const userB = await creerUtilisateur(baseUrl, 'sections-reorder-iso-b@test.local');

  const listA = await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: userA.cookie } });
  const [sectionA] = await listA.json();

  const res = await fetch(`${baseUrl}/api/sections/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
    body: JSON.stringify({ sections: [{ id: sectionA.id, ordre: 0, valeurIds: [] }] })
  });
  assert.equal(res.status, 403);
});

test('les routes de sections exigent une authentification', async () => {
  const res = await fetch(`${baseUrl}/api/sections`);
  assert.equal(res.status, 401);
});
