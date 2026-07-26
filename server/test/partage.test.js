const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { demarrerServeurDeTest, creerUtilisateur } = require('./support/helpers');

const serveur = demarrerServeurDeTest('partage');
let baseUrl;

before(async () => {
  await serveur.start();
  baseUrl = serveur.getBaseUrl();
});

after(async () => {
  await serveur.stop();
});

async function partagerSection(cookieProprietaire, sectionId, email, role) {
  return fetch(`${baseUrl}/api/sections/${sectionId}/partages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieProprietaire },
    body: JSON.stringify({ email, role })
  });
}

test('GET /api/users exclut l utilisateur courant et liste les autres comptes connus', async () => {
  const userA = await creerUtilisateur(baseUrl, 'users-a@test.local');
  await creerUtilisateur(baseUrl, 'users-b@test.local');

  const res = await fetch(`${baseUrl}/api/users`, { headers: { Cookie: userA.cookie } });
  assert.equal(res.status, 200);

  const users = await res.json();
  assert.ok(users.some((u) => u.email === 'users-b@test.local'));
  assert.ok(!users.some((u) => u.email === 'users-a@test.local'));
});

test('une section non partagee est invisible pour un autre utilisateur', async () => {
  const proprio = await creerUtilisateur(baseUrl, 'partage-invisible-proprio@test.local');
  const tiers = await creerUtilisateur(baseUrl, 'partage-invisible-tiers@test.local');

  const sections = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: proprio.cookie } })).json();
  const [section] = sections;

  const sectionsTiers = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: tiers.cookie } })).json();
  assert.ok(!sectionsTiers.some((s) => s.id === section.id));

  const valeurs = await fetch(`${baseUrl}/api/sections/${section.id}/valeurs`, { headers: { Cookie: tiers.cookie } });
  assert.equal(valeurs.status, 404);
});

test('partage en lecture : consultation possible, ecriture refusee', async () => {
  const proprio = await creerUtilisateur(baseUrl, 'partage-lecture-proprio@test.local');
  const invite = await creerUtilisateur(baseUrl, 'partage-lecture-invite@test.local');

  const [section] = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: proprio.cookie } })).json();

  await fetch(`${baseUrl}/api/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: proprio.cookie },
    body: JSON.stringify({ ticker: 'AAPL', sectionId: section.id })
  });

  const partage = await partagerSection(proprio.cookie, section.id, 'partage-lecture-invite@test.local', 'lecture');
  assert.equal(partage.status, 201);

  const sectionsInvite = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: invite.cookie } })).json();
  const sectionVue = sectionsInvite.find((s) => s.id === section.id);
  assert.ok(sectionVue);
  assert.equal(sectionVue.role, 'lecture');
  assert.equal(sectionVue.proprietaireEmail, 'partage-lecture-proprio@test.local');

  const valeurs = await (await fetch(`${baseUrl}/api/sections/${section.id}/valeurs`, { headers: { Cookie: invite.cookie } })).json();
  assert.ok(valeurs.AAPL);

  const ajout = await fetch(`${baseUrl}/api/sections/${section.id}/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: invite.cookie },
    body: JSON.stringify({ ticker: 'MSFT' })
  });
  assert.equal(ajout.status, 403);

  const suppression = await fetch(`${baseUrl}/api/sections/${section.id}/valeurs/AAPL`, {
    method: 'DELETE',
    headers: { Cookie: invite.cookie }
  });
  assert.equal(suppression.status, 403);

  const renommer = await fetch(`${baseUrl}/api/sections/${section.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: invite.cookie },
    body: JSON.stringify({ nom: 'Hack' })
  });
  assert.equal(renommer.status, 404);

  const supprimerSection = await fetch(`${baseUrl}/api/sections/${section.id}`, {
    method: 'DELETE',
    headers: { Cookie: invite.cookie }
  });
  assert.equal(supprimerSection.status, 404);

  const gererPartages = await partagerSection(invite.cookie, section.id, 'partage-lecture-tiers@test.local', 'lecture');
  assert.equal(gererPartages.status, 404);
});

test('partage en ecriture : ajout et suppression de valeurs dans la section partagee', async () => {
  const proprio = await creerUtilisateur(baseUrl, 'partage-ecriture-proprio@test.local');
  const invite = await creerUtilisateur(baseUrl, 'partage-ecriture-invite@test.local');

  const [section] = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: proprio.cookie } })).json();

  const partage = await partagerSection(proprio.cookie, section.id, 'partage-ecriture-invite@test.local', 'ecriture');
  assert.equal(partage.status, 201);

  const ajout = await fetch(`${baseUrl}/api/sections/${section.id}/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: invite.cookie },
    body: JSON.stringify({ ticker: 'AAPL' })
  });
  assert.equal(ajout.status, 201);

  // La valeur ajoutee par l'invite reste rattachee au proprietaire de la
  // section (c'est la section qui est partagee, pas une copie chez l'invite).
  const valeursProprio = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: proprio.cookie } })).json();
  assert.ok(valeursProprio.AAPL);

  const valeursInvite = await (await fetch(`${baseUrl}/api/valeurs`, { headers: { Cookie: invite.cookie } })).json();
  assert.ok(!valeursInvite.AAPL);

  const suppression = await fetch(`${baseUrl}/api/sections/${section.id}/valeurs/AAPL`, {
    method: 'DELETE',
    headers: { Cookie: invite.cookie }
  });
  assert.equal(suppression.status, 200);

  const valeursApres = await (await fetch(`${baseUrl}/api/sections/${section.id}/valeurs`, { headers: { Cookie: proprio.cookie } })).json();
  assert.ok(!valeursApres.AAPL);
});

test('partage en ecriture : un ticker introuvable sur Yahoo Finance est rejete', async () => {
  const proprio = await creerUtilisateur(baseUrl, 'partage-introuvable-proprio@test.local');
  const invite = await creerUtilisateur(baseUrl, 'partage-introuvable-invite@test.local');

  const [section] = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: proprio.cookie } })).json();
  await partagerSection(proprio.cookie, section.id, 'partage-introuvable-invite@test.local', 'ecriture');

  const ajout = await fetch(`${baseUrl}/api/sections/${section.id}/valeurs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: invite.cookie },
    body: JSON.stringify({ ticker: 'LVMH/SGE WT 26' })
  });
  assert.equal(ajout.status, 400);

  const valeurs = await (await fetch(`${baseUrl}/api/sections/${section.id}/valeurs`, { headers: { Cookie: proprio.cookie } })).json();
  assert.equal(Object.keys(valeurs).length, 0);
});

test('revoquer un partage retire l acces a la section', async () => {
  const proprio = await creerUtilisateur(baseUrl, 'partage-revoke-proprio@test.local');
  const invite = await creerUtilisateur(baseUrl, 'partage-revoke-invite@test.local');

  const [section] = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: proprio.cookie } })).json();
  await partagerSection(proprio.cookie, section.id, 'partage-revoke-invite@test.local', 'lecture');

  const listeAvant = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: invite.cookie } })).json();
  assert.ok(listeAvant.some((s) => s.id === section.id));

  const partages = await (await fetch(`${baseUrl}/api/sections/${section.id}/partages`, { headers: { Cookie: proprio.cookie } })).json();
  const [partageInvite] = partages;

  const revoke = await fetch(`${baseUrl}/api/sections/${section.id}/partages/${partageInvite.userId}`, {
    method: 'DELETE',
    headers: { Cookie: proprio.cookie }
  });
  assert.equal(revoke.status, 200);

  const listeApres = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: invite.cookie } })).json();
  assert.ok(!listeApres.some((s) => s.id === section.id));
});

test('partager refuse un role invalide, un email inconnu et un partage avec soi-meme', async () => {
  const proprio = await creerUtilisateur(baseUrl, 'partage-invalide-proprio@test.local');
  await creerUtilisateur(baseUrl, 'partage-invalide-cible@test.local');

  const [section] = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: proprio.cookie } })).json();

  const roleInvalide = await partagerSection(proprio.cookie, section.id, 'partage-invalide-cible@test.local', 'admin');
  assert.equal(roleInvalide.status, 400);

  const emailInconnu = await partagerSection(proprio.cookie, section.id, 'inconnu@test.local', 'lecture');
  assert.equal(emailInconnu.status, 404);

  const soiMeme = await partagerSection(proprio.cookie, section.id, 'partage-invalide-proprio@test.local', 'lecture');
  assert.equal(soiMeme.status, 400);
});

test('seul le proprietaire peut lister ou creer des partages', async () => {
  const proprio = await creerUtilisateur(baseUrl, 'partage-gestion-proprio@test.local');
  const tiers = await creerUtilisateur(baseUrl, 'partage-gestion-tiers@test.local');

  const [section] = await (await fetch(`${baseUrl}/api/sections`, { headers: { Cookie: proprio.cookie } })).json();

  const liste = await fetch(`${baseUrl}/api/sections/${section.id}/partages`, { headers: { Cookie: tiers.cookie } });
  assert.equal(liste.status, 404);
});

test('les routes de partage et de valeurs de section exigent une authentification', async () => {
  const res1 = await fetch(`${baseUrl}/api/users`);
  assert.equal(res1.status, 401);

  const res2 = await fetch(`${baseUrl}/api/sections/1/partages`);
  assert.equal(res2.status, 401);

  const res3 = await fetch(`${baseUrl}/api/sections/1/valeurs`);
  assert.equal(res3.status, 401);
});
