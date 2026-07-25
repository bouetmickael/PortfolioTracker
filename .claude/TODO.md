# TODO.md — Journal de sessions

> Journal détaillé, append-only, des sessions de travail. Pour l'état
> courant (compteur, fonctionnalité en cours), voir `BACKLOG.md` — ne pas
> dupliquer ici ce qui y est déjà tenu à jour. Voir `CLAUDE.md` pour le
> point d'entrée.

Aucun historique de sessions détaillé n'existait avant cette
restructuration : l'entrée ci-dessous est une **entrée rétrospective
unique** résumant l'état du projet à ce jour, reconstituée à partir de
`README.md`/`TROUBLESHOOTING.md` (aujourd'hui répartis dans les fichiers
`.claude/`), plutôt qu'un historique session par session inventé.

## 2026-07 (rétrospectif) — État du projet avant mise en place de la méthode

- **Origine** : le projet reposait initialement sur Firebase (Hosting,
  Cloud Functions, Realtime Database, Cloud Messaging, authentification
  Google).
- **Migration hors Firebase** : suite à une suppression accidentelle du
  compte/projet Firebase, l'application a été entièrement réécrite pour
  fonctionner en auto-hébergement, sans aucun service Firebase :
  Node.js/Express à la place de Cloud Functions, SQLite à la place de
  Realtime Database, sessions locales email/mot de passe (bcrypt) à la
  place de Firebase Auth (authentification Google retirée, jugée
  disproportionnée pour 2-3 utilisateurs connus), email SMTP optionnel à la
  place des notifications push FCM, polling HTTP à la place des listeners
  temps réel. Le code Firebase (`functions/`, `firebase.json`,
  `database.rules.json`, `.firebaserc`, `public/firebase-config.js`,
  `public/firebase-messaging-sw.js`) a été supprimé du dépôt.
  Un prompt de diagnostic de l'époque (`prompt-claude-code-diagnostic.md`,
  bug de mise à jour des cours via les Cloud Functions Firebase) a motivé
  cette réécriture ; il référençait du code aujourd'hui supprimé et n'a pas
  été conservé tel quel.
- **Packaging Home Assistant Add-on** : le seul Raspberry Pi disponible
  tournant sous Home Assistant OS (HAOS, hôte entièrement géré par le
  Supervisor), l'application a été packagée en plus comme Home Assistant
  Add-on (`config.yaml`, `repository.yaml`), en complément du mode Docker
  Compose conservé pour un usage sur un Linux générique (voir `DOCKER.md`).
- **Contrainte de style notée à cette période** : aucun émoji ni symbole
  spécial dans le code, y compris commentaires, chaînes de caractères et
  HTML (voir `ARCHITECTURE.md` §4).
- **État fonctionnel au moment de cette rétrospective** : authentification
  locale, suivi de valeurs (actions/warrants), alertes de seuil par email,
  graphiques historiques (Chart.js), PWA installable — voir
  `SPECIFICATION_FONCTIONNELLE.md`.

## 2026-07-24 — Restructuration de la documentation Claude Code

Mise en place de l'architecture `.claude/` (un fichier par sujet, référencé
par pointeur depuis `CLAUDE.md`, jamais dupliqué) : `METHOD.md` (méthode
générique), `CLAUDE.md` (point d'entrée), `ARCHITECTURE.md`,
`BUSINESS_RULES.md`, `SPECIFICATION_FONCTIONNELLE.md`, `BACKLOG.md`,
`DOCKER.md`, ce fichier. Contenu de `TROUBLESHOOTING.md` réparti dans ces
fichiers (historique ci-dessus, points de vigilance dans
`ARCHITECTURE.md` §5, règles dans `BUSINESS_RULES.md`).

## 2026-07-24 — Triage de bugs post-migration, redesign liste des valeurs

Première session de développement sous le cycle `METHOD.md` (compteur
`BACKLOG.md` : 0/3 -> 1/3). Point de départ : l'utilisateur signalait des
fonctionnalités « cassées ou différentes » sans les avoir encore listées ;
un seul point precis est remonté (le reste n'a pas été signalé).

- **Bug corrigé** : graphique 1J/1S n'affichait que 2 points (ligne
  droite) — `server/routes/chart.js` demandait `interval=1d` à Yahoo
  Finance quelle que soit la période sélectionnée. Bug préexistant dans la
  Cloud Function Firebase d'origine, pas une régression de la migration.
  Intervalle désormais adapté à la période (5 min pour 1J, 15 min pour
  1S), points sans cours filtrés, labels d'axe X avec heure pour 1J/1S.
- **Redesign de la liste des valeurs suivies** (demande explicite
  utilisateur, inspiration TradingView) : liste plate au lieu de cartes
  par valeur, avatar coloré (initiales du ticker), cours/variation
  empilés à droite en texte coloré simple, clic sur la ligne entière pour
  ouvrir le graphique (bouton `G` supprimé, `A`/`X` conservés).
  `DESIGN.md` mis à jour en conséquence.
- **Version affichée dans l'app** : `GET /api/version` (source :
  `server/package.json`) affiché dans le header, pour que l'utilisateur
  vérifie qu'il consulte bien la dernière version déployée sur son
  Raspberry Pi. `server/package.json` et `config.yaml` doivent être
  incrémentés ensemble à chaque release (documenté dans `DOCKER.md`) —
  bump fait cette session (1.1.0 -> 1.1.1) à l'occasion du correctif de
  graphique.
- **Règle de méthode ajoutée** (`CLAUDE.md`, pas ici — spécifique au
  projet) : l'utilisateur a demandé de ne plus attendre de feu vert
  explicite avant de fusionner `claude/...` vers `main` en fast-forward,
  contrairement au défaut de `METHOD.md` §5.
- **Reporté, non traité** : `README.md` ne documente que la mise à jour
  manuelle SSH/rsync, alors que l'utilisateur utilise désormais le
  magasin d'add-ons Home Assistant (dépôt ajouté par URL) — voir
  `BACKLOG.md`.

## 2026-07-24 — Finalisation du redesign de la liste des valeurs, README

Deuxième session de développement sous le cycle `METHOD.md` (compteur
`BACKLOG.md` : 1/3 -> 2/3).

- **Finalisation du redesign de la liste des valeurs** (session
  précédente marquée WIP, en attente de revue visuelle) : à partir d'une
  capture d'écran fournie par l'utilisateur, le nom de la valeur devient
  la première ligne (`.valeur-nom`, en avant, remplace le ticker en tête),
  `ticker · type` passe en seconde ligne secondaire (`.valeur-sousligne`,
  remplace les anciennes `.valeur-ligne1`/`.valeur-ticker`/`.valeur-type`).
  Couleur de fond des lignes/avatars inchangée (demande explicite).
  Vérifié par capture d'écran (Playwright, page HTML statique réutilisant
  `public/styles.css`) faute de pouvoir lancer l'app complète (auth/DB/SMTP)
  dans cet environnement. `DESIGN.md` mis à jour en conséquence.
- **README.md — méthode de mise à jour de l'add-on** : traité l'item
  reporté en session précédente. Section « Mettre à jour l'add-on plus
  tard » documente désormais les deux méthodes (magasin d'add-ons Home
  Assistant recommandé si le dépôt y a été ajouté par URL, ou méthode
  manuelle SSH/rsync conservée pour les installations existantes), sans
  modifier la section d'installation initiale (hors périmètre de cette
  session).
- **Non fait** : pas de vérification sur le Raspberry Pi réel (déploiement
  et `docker compose logs` / journal de l'add-on) — cet environnement de
  session (Claude Code sur le web) n'a pas accès au Pi de l'utilisateur.
  Vérification limitée à `node --check` sur les fichiers serveur/JS
  modifiés et à la capture d'écran ci-dessus.

## 2026-07-24 — Session A : socle Alpine.js (refonte ergonomie)

Troisième session de développement sous le cycle `METHOD.md` (compteur
`BACKLOG.md` : 2/3 -> 3/3, revue de dette technique obligatoire à la
session suivante). Première étape d'un plan multi-sessions approuvé par
l'utilisateur pour une refonte ergonomique majeure (drag-and-drop,
sections, badges d'alerte, partage RW de section) — voir le plan complet
dans `/root/.claude/plans/fluttering-spinning-swing.md` et le découpage
en sessions dans `BACKLOG.md`.

- **Choix technique** : Alpine.js (v3.15.12) plutôt que React/Preact,
  vendorisé localement (`public/vendor/alpine.min.js`, téléchargé depuis
  `registry.npmjs.org` — `cdn.jsdelivr.net` est bloqué par la politique
  réseau de cet environnement de session, contournement sans impact sur
  le choix technique lui-même). Raison principale : le build de l'add-on
  Home Assistant s'exécute sur le Raspberry Pi lui-même, un pipeline
  npm/bundler y serait disproportionné ; Alpine s'installe comme un
  simple `<script defer>`, sans build step, compatible avec les fonctions
  globales/`onclick=` déjà en place.
- **Migration (Session A uniquement)** : la liste des valeurs suivies
  (`#valeursListe` dans `public/index.html`) passe d'un rendu impératif
  (`innerHTML` reconstruit en entier à chaque poll de 30s, fonction
  `createValeurCard` supprimée) à un rendu réactif Alpine (`x-for` sur
  `Alpine.store('portfolio').valeurs`, store déclaré dans `public/app.js`
  via l'évènement `alpine:init`). Aucun changement fonctionnel visible
  (parité stricte voulue pour cette première session, isoler le risque de
  migration du risque fonctionnel) — mêmes classes CSS, même structure de
  ligne. Effet de bord positif : le texte (nom, ticker) passe de
  `innerHTML` (template string interpolée) à `x-text` (`textContent`),
  ce qui supprime au passage une surface d'injection HTML théorique sur
  ces champs.
  `public/sw.js` : ajout de `vendor/alpine.min.js` à la liste de cache
  offline (`CACHE_NAME` bump v2 -> v3). `ARCHITECTURE.md` mis à jour
  (stack frontend, arborescence).
- **Vérification** : `node --check` sur `app.js` ; test de bout en bout
  réel (pas seulement une maquette statique) — serveur Express lancé
  localement avec une base SQLite de test, utilisateur créé et connecté
  via l'API, 3 valeurs ajoutées, puis parcours Playwright dans un
  vrai navigateur (login réel, capture d'écran, clic sur une ligne
  -> ouverture du graphique, clic sur le bouton `A` -> ouverture de la
  modale d'alerte avec `stopPropagation` toujours effectif, pas d'erreur
  console liée au changement). Les seules erreurs console observées
  viennent de Yahoo Finance / Chart.js CDN bloqués par la politique
  réseau de cet environnement, sans rapport avec la migration Alpine.
- **Rappel important** : le compteur `BACKLOG.md` atteint 3/3 avec cette
  session. Conformément à `METHOD.md` §0.2, la session suivante doit être
  la revue de dette technique obligatoire, avant de reprendre avec la
  Session B (sections + drag-and-drop) du plan en cours.

## 2026-07-24 — Revue de dette technique n°1

Compteur `BACKLOG.md` à 3/3 : cycle de revue obligatoire (`METHOD.md`
§0.2), première revue du projet (aucune n'avait eu lieu jusqu'ici). Détail
complet (portée, correctifs appliqués, correctifs reportés) consigné dans
`CLAUDE.md` § Historique des revues de dette technique — non dupliqué ici.

- **Méthode** : `/simplify` sur `git diff 527d37d..HEAD` (diff cumulé
  depuis le premier commit, soit l'intégralité du code applicatif actuel,
  `server/`/`public/` hors vendor) — 4 agents de revue en parallèle
  (réutilisation, simplification, efficacité, altitude).
- **Appliqué** : `GET /api/auth/me` utilise `requireAuth` au lieu d'une
  vérification de session dupliquée ; extraction de `normalizeTicker()`
  (`server/ticker.js`) réutilisée dans `routes/valeurs.js` et
  `routes/alertes.js` ; simplification de `checkAuthAndRedirect`
  (`public/auth.js`, une seule branche de redirection).
- **Vérification** : `node --check` sur tous les fichiers modifiés ;
  serveur Express lancé localement (SQLite de test) et parcours API réel
  (register, login, `GET /me` avec/sans session, `POST`/`GET`/`DELETE`
  `/api/valeurs` et `/api/alertes` avec ticker en minuscules/espaces) —
  réponses identiques à avant les correctifs (ticker normalisé en
  `AAPL`, mêmes codes HTTP, mêmes formes de réponse JSON).
- **Reporté** (documenté dans `CLAUDE.md`, pas traité cette session) :
  format de réponse API en map hérité de Firebase, liste des alertes non
  migrée sur le store Alpine, duplication de la logique de fetch Yahoo
  Finance entre `jobs/prices.js` et `routes/chart.js`, appels réseau/SMTP
  séquentiels dans les jobs cron, absence de cache sur
  `GET /api/chart/:ticker`, absence de middleware d'erreur Express
  centralisé.
- Compteur `BACKLOG.md` réinitialisé à 0/3. Prochaine session : reprise de
  la Session B (sections + drag-and-drop) du plan en cours.

## 2026-07-25 — Session B : sections + glisser-deposer (refonte ergonomie)

Deuxieme etape du plan multi-sessions (voir plan reference dans
`BACKLOG.md`), apres la revue de dette technique n1. Perimetre : sections
personnelles (sans partage entre utilisateurs, prevu Session D) et
glisser-deposer, en s'appuyant sur le store Alpine mis en place Session A.

- **Migration DB** (`server/db.js`) : nouvelle table `sections` (`id`,
  `user_id`, `nom`, `ordre`) et colonnes `section_id`/`ordre` ajoutees a
  `valeurs` via `ALTER TABLE` (guarde par `PRAGMA table_info`, `CREATE
  TABLE IF NOT EXISTS` ne suffit pas pour des colonnes ajoutees apres
  coup). Backfill automatique au demarrage : une section "General" est
  creee pour tout utilisateur qui n'en a encore aucune, puis les valeurs
  sans `section_id` y sont rattachees dans leur ordre d'ajout actuel
  (`ajoute_le`). Les nouveaux comptes recoivent leur section "General"
  directement a l'inscription (`server/routes/auth.js`, transaction),
  la migration seule ne suffisant pas pour un utilisateur cree apres le
  demarrage du process.
- **API** (`server/routes/sections.js`, montee sur `/api/sections`,
  `requireAuth` sur tout le routeur) : `GET /` (liste triee par `ordre`),
  `POST /` (creation en fin de liste), `PUT /:id` (renommage), `DELETE
  /:id` (refuse si derniere section de l'utilisateur ; sinon reassigne
  ses valeurs vers une autre section restante dans la meme transaction),
  `PUT /reorder` (persiste en une transaction l'ordre des sections et,
  pour chacune, l'ordre + le rattachement de ses valeurs, apres
  verification que toutes les sections visees appartiennent bien a
  l'utilisateur). `server/routes/valeurs.js` : `GET /` expose desormais
  `sectionId`/`ordre` par valeur ; `POST /` accepte un `sectionId`
  optionnel (ignore et retombe sur la section par defaut de
  l'utilisateur s'il ne lui appartient pas, isolation stricte) et calcule
  un `ordre` sequentiel au sein de la section cible.
- **UI** (`public/index.html`/`public/app.js`/`public/styles.css`) : la
  liste des valeurs suivies est decoupee en cartes `.valeurs-section`
  (une par section, en-tete avec nom + boutons lettre unique `M`
  modifier/renommer et `X` supprimer, ce dernier masque s'il ne reste
  qu'une section). Renommage et creation via `prompt()` navigateur
  (coherent avec le `confirm()` deja utilise pour les suppressions,
  pas de nouvelle modale). Glisser-deposer via SortableJS (v1.15.7,
  vendorise dans `public/vendor/sortable.min.js`, meme raison qu'Alpine :
  pas de CDN, build sur le Raspberry Pi) : une instance par section pour
  deplacer les valeurs entre/dans les sections (`group` SortableJS
  partage), une instance globale pour reordonner les sections
  elles-memes (poignee = nom de la section). Apres chaque `onEnd`, le DOM
  deja reordonne par SortableJS est relu pour resynchroniser
  `Alpine.store('portfolio')` avant persistance API (`PUT /api/sections/
  reorder`), ce qui evite tout conflit entre la reconciliation Alpine
  (`x-for` garde par cle) et les mutations DOM directes de SortableJS.
  `DESIGN.md`/`ARCHITECTURE.md`/`BUSINESS_RULES.md` mis a jour en
  consequence (nouveau composant, nouvelle dependance vendorisee,
  nouvelle regle d'isolation par section).
- **Tests** : premiere introduction d'un framework de test dans le projet
  (`node:test`, natif Node.js, aucune dependance ajoutee ; script `npm
  test` -> `node --test test/` dans `server/`). 13 tests
  (`server/test/sections.test.js`, `server/test/valeurs.test.js`) : CRUD
  sections, refus de supprimer la derniere section, reassignation des
  valeurs a la suppression d'une section, `PUT /reorder` (sections +
  valeurs), isolation stricte entre deux comptes (renommage/suppression/
  reorder refuses sur une section d'un autre utilisateur, `sectionId`
  etranger ignore a la creation d'une valeur), section par defaut a
  l'inscription. Chaque fichier de test demarre une instance Express
  isolee sur une base SQLite temporaire (`server/test/support/
  helpers.js`).
- **Verification reelle** : suite `node --test` (13/13 verts) ; parcours
  API complet via `curl` sur un serveur local (inscription, section par
  defaut, creation/renommage/suppression de section avec reassignation,
  `PUT /reorder`, refus de suppression de la derniere section) ; parcours
  navigateur reel via Playwright (Chromium local) - connexion, capture
  d'ecran de la liste avec sections, glisser-depose reel d'une valeur
  vers une autre section (verifie en base via l'API apres le drag), clic
  sur une ligne restee fonctionnel apres le drag (ouverture de la modale
  graphique, pas d'interference entre clic et glisser-depose). Les seules
  erreurs console observees viennent de Yahoo Finance/Chart.js CDN
  bloques par la politique reseau de cet environnement de session, sans
  rapport avec cette session.
- Version : `server/package.json`/`config.yaml` 1.1.1 -> 1.2.0
  (increment mineur, fonctionnalite utilisateur significative plutot
  qu'un correctif), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 0/3 -> 1/3. Prochaine session : Session C
  (badges d'alerte) du plan en cours.

## 2026-07-25 — Session hors plan : refonte visuelle + theme clair/sombre

L'utilisateur a fourni des captures d'ecran de l'ancienne version du
projet (avant la refonte Material sobre des sessions precedentes) et a
demande explicitement d'en retrouver le style, tout en gardant l'avatar
rond + la hierarchie de texte actuels pour chaque valeur (juste corriger
le retour a la ligne du volume). Avant de coder, clarification en 3
questions (AskUserQuestion) vu l'ampleur du changement (contredit
plusieurs regles de `DESIGN.md` etablies avec l'utilisateur au fil des
sessions precedentes) : refonte complete confirmee, bascule clair/sombre
fonctionnelle demandee, mais ordre du backlog conserve (Session C avant
Session D "portefeuilles partages", vue elle aussi sur les captures mais
pas implementee cette session).

- **Direction visuelle** (`DESIGN.md` entierement revu, ancienne regle
  "sobre, sans icone" barree et remplacee) : en-tete bleu marine fixe
  (`--header-bg: #1b2438`, inchange entre themes), accent or/gold
  (`--primary: #c9a227`, remplace le bleu `#1a73e8` partout : boutons
  primaires, FAB, ligne de graphique Chart.js, sélecteur de periode),
  cartes statistiques a bordure superieure coloree (navy/vert/rouge),
  sections repliables (chevron pivotant, etat local Alpine
  `x-data="{ ouvert: true }"`, non persiste) a la fois sur les blocs
  top-level ("Valeurs suivies"/"Alertes actives") et sur chaque
  sous-section de valeurs.
- **Icones SVG inline** : jeu d'icones ecrites a la main (refresh, user,
  moon, sun, bell, trash, pencil, chevron-down, x, plus), definies une
  seule fois comme `<symbol>` dans un sprite cache en tete de
  `public/index.html`, reference partout via `<use href="#icon-xxx">` —
  aucune police d'icones ni bibliotheque externe, coherent avec la
  philosophie zero-dependance/zero-CDN deja appliquee a Alpine/
  SortableJS. Remplacent tous les boutons lettre unique (R/U/A/X/M/+)
  sauf le "+" texte des boutons d'ajout de section (deja un simple
  caractere dans l'ancienne version aussi).
- **Theme clair/sombre fonctionnel** : variables CSS + attribut
  `data-theme` sur `<html>`, bascule via un nouveau bouton lune/soleil
  dans l'en-tete (`initTheme()` dans `public/app.js`), persistance
  `localStorage`, script inline synchrone en tete de `public/index.html`
  pour appliquer le theme avant le premier rendu (anti-FOUC). Chart.js
  (grille/ticks/courbe) et l'overlay du loader plein ecran adaptent aussi
  leurs couleurs au theme actif.
- **Ligne de valeur** : avatar rond + hierarchie de texte conserves
  (nom, puis ticker + badge pilule du type au lieu du texte brut "ticker
  · type"), mais le footer passe de "MAJ: hh:mm · Vol: xxx" sur une seule
  ligne (pouvait couper "Vol: xxx" au milieu par un retour a la ligne
  intempestif) a deux lignes distinctes ("MAJ: hh:mm" puis "Vol: xxx"
  entierement sur sa propre ligne, jamais coupee).
- **Explicitement hors perimetre** (documente dans `DESIGN.md` § Hors
  perimetre de cette revision et `BACKLOG.md`) : badges de recommandation
  ACHAT/NEUTRE (aucune donnee correspondante dans le modele, pas demande
  comme fonctionnalite), portefeuilles partages (Session D deja
  planifiee, ordre du backlog conserve sur demande explicite).
- **Verification reelle** : aucune route API modifiee cette session
  (changement frontend uniquement) — suite `node --test` deja existante
  re-executee (13/13 verts, aucune regression backend). Verification
  principale via Playwright (Chromium local) : capture theme clair et
  theme sombre, bascule fonctionnelle avec persistance verifiee apres
  rechargement de page, sections repliables (4 chevrons detectes,
  repli/depli visuel confirme), glisser-depose d'une valeur entre
  sections toujours fonctionnel avec la nouvelle structure de markup
  (verifie en base via l'API apres le drag), clic sur une ligne toujours
  fonctionnel (ouverture de la modale graphique, pas d'interference avec
  le glisser-depose), creation d'alerte avec icone de suppression
  correcte sur la carte alerte, rendu correct a 360px (mobile etroit).
- Version : `server/package.json`/`config.yaml` 1.2.0 -> 1.3.0
  (increment mineur, changement visuel majeur sur l'ensemble de
  l'application), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 1/3 -> 2/3. Prochaine session : Session C
  (badges d'alerte) du plan en cours.

## 2026-07-25 — Correctif : poignee de glisser-depose (v1.3.1)

Retour utilisateur immediat apres verification visuelle de la session
precedente (captures d'ecran demandees pour confirmer l'absence de
l'icone "article de presse" de l'ancienne version - confirmee absente,
seuls les icones `icon-bell`/`icon-trash` sont presentes sur chaque
ligne). En testant, l'utilisateur a signale un probleme d'ergonomie non
anticipe : le glisser-depose d'une valeur (SortableJS, toute la ligne
`.valeur-row` comme source de glisser-depose depuis la Session B) genait
le scroll tactile de la page sur mobile, puisque n'importe quel toucher
sur une ligne pouvait etre interprete comme un debut de glisser-depose
plutot qu'un scroll. L'utilisateur a suggere une poignee a gauche, a
moins d'avoir une meilleure idee.

- **Correctif** (`public/index.html`/`public/app.js`/`public/styles.css`)
  : nouvelle icone `icon-grip` (6 points, `fill="currentColor"`, seule
  exception au style trait des autres icones) dans une poignee dediee
  (`.valeur-drag-handle`) ajoutee tout a gauche de chaque ligne, avant
  l'avatar. `initSortableValeurs()` restreint desormais le glisser-
  depose a cette poignee (`handle: '.valeur-drag-handle'` au lieu de
  toute la ligne). La poignee porte `touch-action: none` (empeche le
  navigateur de capturer le geste tactile comme un debut de glisser-
  depose plutot qu'un scroll) ; le reste de la ligne n'a aucune
  restriction de `touch-action` et scrolle normalement. La poignee a
  aussi `@click.stop` pour ne pas declencher l'ouverture du graphique
  sur un simple tap (elle n'est pas un raccourci vers le graphique,
  seulement une poignee de glisser-depose).
- **Verification reelle** : suite `node --test` re-executee (13/13
  verts, changement frontend uniquement). Playwright : (1) un glisser-
  depose initie depuis le corps de la ligne (nom de la valeur) ne
  declenche plus aucune reorganisation (verifie en relisant le DOM apres
  le geste) ; (2) un clic simple sur le corps de la ligne ouvre toujours
  la modale graphique ; (3) un clic simple sur la poignee n'ouvre plus la
  modale graphique ; (4) un glisser-depose initie depuis la poignee
  deplace bien la valeur vers une autre section (verifie en base via
  l'API apres le geste). Capture d'ecran du rendu de la poignee envoyee
  a l'utilisateur pour confirmation visuelle.
- Version : `server/package.json`/`config.yaml` 1.3.0 -> 1.3.1
  (correctif, comportement de glisser-depose corrige suite a un retour
  utilisateur reel), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 2/3 -> 3/3. **Revue de dette technique
  obligatoire a la prochaine session** (`METHOD.md` §0.2), avant de
  reprendre la Session C (badges d'alerte) du plan en cours.

## 2026-07-25 — Correctif : modales prompt/confirm stylees (v1.3.2)

Nouveau retour utilisateur, capture d'ecran a l'appui : la popup
navigateur native (`window.prompt()`, utilisee pour nommer une nouvelle
section) gardait l'apparence brute du systeme (fond gris clair, coins
carres) au-dessus de l'en-tete bleu marine de l'application, hors charte
graphique. Meme probleme pour `window.confirm()` (suppression de
section/valeur/alerte) : aucune des deux ne suit le theme clair/sombre.

- **Correctif** (`public/index.html`/`public/app.js`/`public/styles.css`)
  : deux nouvelles modales generiques reutilisables, sur le meme patron
  que les modales existantes (`.modal`/`.modal-content`/`openModal()`/
  `closeAllModals()`) :
  - `#modalPrompt` (titre dynamique, champ texte, boutons `Annuler`/
    `OK`) ;
  - `#modalConfirm` (titre + message dynamiques, boutons `Annuler`/
    `Confirmer`, `Confirmer` en nouvelle classe `.btn-danger` pour les
    actions destructives).
  Cote JS, `showPrompt(titre, valeurDefaut)` et `showConfirm(message,
  titre)` retournent une `Promise` resolue par clic sur OK/Confirmer
  (valeur saisie / `true`), ou par clic sur Annuler/le fond semi-
  transparent/l'icone de fermeture/la touche Echap (`null`/`false`) - le
  handler global `keydown` Echap existant a ete etendu pour resoudre en
  annulation la modale prompt/confirm ouverte avant de fermer, plutot que
  de la fermer sans jamais resoudre la promesse (ce qui aurait bloque
  indefiniment l'appelant `await`). Les 5 appels a `window.prompt()`/
  `window.confirm()` (`ajouterSection`, `renommerSection`,
  `supprimerSection`, `supprimerValeur`, `supprimerAlerte`) sont
  remplaces par des `await showPrompt(...)`/`await showConfirm(...)`.
- **Verification reelle** : suite `node --test` re-executee (13/13
  verts, changement frontend uniquement). Playwright : creation de
  section via la modale prompt avec soumission au clavier (touche
  Entree, comme le `prompt()` natif) ; annulation d'une suppression de
  valeur via clic sur le fond semi-transparent (valeur toujours
  presente) ; confirmation reelle de la suppression (valeur supprimee) ;
  fermeture propre d'une modale prompt ouverte via la touche Echap (pas
  de blocage). Captures d'ecran clair et sombre envoyees a l'utilisateur
  pour confirmation visuelle.
- `DESIGN.md` mis a jour (§ Liste des valeurs suivies et § Modales).
- Version : `server/package.json`/`config.yaml` 1.3.1 -> 1.3.2
  (correctif), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : reste a 3/3 (ce correctif est regroupe avec la
  session hors plan du meme jour plutot que compte comme une session
  distincte - iteration continue sur le meme retour utilisateur, pas une
  nouvelle fonctionnalite). **Revue de dette technique toujours
  obligatoire a la prochaine session** (`METHOD.md` §0.2) avant la
  Session C.

## 2026-07-25 — Revue de dette technique n°2 (`METHOD.md` §0.2)

- **Portee** : `git diff bb0790f..HEAD -- server/ public/` (hors
  `public/vendor/` et `.claude/*.md`), depuis la revue n°1 (2026-07-24)
  jusqu'a `HEAD` : Session B (sections + glisser-deposer), refonte
  visuelle + theme clair/sombre, et les deux correctifs directs (poignee
  de glisser-depose dediee, modales prompt/confirm). Outillage : skill
  `/simplify`, 4 agents en parallele (reutilisation, simplification,
  efficacite, altitude) sur le diff cumule.
- **Correctifs appliques** (risque faible, comportement inchange) :
  - `server/ordre.js` (nouveau) : extraction de `nextOrdre(db, table,
    whereSql, params)`, remplace trois occurrences du calcul `SELECT
    MAX(ordre)... + 1` dans `server/routes/sections.js` (creation de
    section, repli lors d'une suppression) et `server/routes/valeurs.js`
    (creation de valeur).
  - `server/db.js` : `backfillSectionsParDefaut()` enveloppee dans
    `db.transaction(...)` (alignee sur le pattern deja utilise dans
    `sections.js`) - evite un commit disque implicite par ligne a chaque
    demarrage du serveur.
  - `public/app.js` : extraction de `getTheme()` (remplace trois lectures
    directes de `data-theme` sur `document.documentElement`) et de
    `marquerSortableInit()` (garde d'initialisation dupliquee entre
    `initSortableSections()`/`initSortableValeurs()`). Dans
    `initSortableValeurs()`, remplacement d'un `store.valeurs.find(...)`
    par ticker (O(n) par ticker deplace) par une `Map` construite une
    fois par `onEnd`.
- **Verification reelle** : `npm test` (12/12 verts) ; serveur demarre en
  local (`DB_PATH` temporaire) sans erreur au demarrage (backfill en
  transaction) ; parcours API reel (register/login, creation de deux
  sections, ajout de deux valeurs avec verification de l'`ordre`
  sequentiel attribue, suppression d'une section avec verification du
  repli et de l'`ordre` recalcule, `PUT /sections/reorder`) ; parcours
  navigateur (Playwright, Chromium local) : connexion, bascule du theme
  clair/sombre (`getTheme()`), sections et poignees de glisser-depose
  rendues, `sortableInit` correctement pose sur les trois conteneurs
  triables (liste des sections + deux listes de valeurs).
  Aucun changement de comportement observable pour l'utilisateur : pas
  d'incrementation de version (`METHOD.md` §5.5, un correctif purement
  interne n'en necessite pas).
- **Correctifs reportes** (voir le detail complet dans `CLAUDE.md` §
  Historique des revues de dette technique, Revue n°2) : poignee de
  glisser-depose dediee manquante sur l'en-tete de section (meme risque
  de conflit tactile mobile que le correctif deja applique aux lignes de
  valeurs, mais necessite une modification visuelle documentee dans
  `DESIGN.md`) ; duplication de forme entre `showPrompt()`/
  `showConfirm()` (deux resolveurs de `Promise` a emplacement unique) ;
  duplication de forme entre `ajouterSection()`/`renommerSection()`/
  `supprimerSection()` et les fonctions CRUD deja existantes
  (`ajouterValeur()`, etc., convention etablie du projet) ;
  `valeursDeSection()` refiltre/retrie a chaque appel reactif Alpine
  (impact negligeable a l'echelle du projet) ; les six correctifs
  reportes de la revue n°1, toujours non traites.
- Compteur `BACKLOG.md` : reinitialise a 0/3. Prochaine session : Session
  C (badges d'alerte, voir `BACKLOG.md`).

## 2026-07-25 — Session C : badges d'alerte (v1.4.0)

Session fonctionnelle suivant le plan multi-sessions "Refonte ergonomie
liste des valeurs" (`BACKLOG.md`), troisieme etape apres le socle
Alpine.js (Session A) et les sections + glisser-depose (Session B) :
reperer visuellement, sur la liste des valeurs suivies, les valeurs ayant
au moins une alerte de seuil active, sans avoir a ouvrir la section des
alertes.

- **Migration DB** (`server/db.js`) : ajout de `alertes.valeur_id`
  (`INTEGER REFERENCES valeurs(id)`, `ALTER TABLE` sur les bases
  existantes, meme pattern que la migration `section_id`/`ordre` de la
  Session B). Backfill (`backfillValeurIdAlertes`, `db.transaction`) :
  pour chaque alerte existante sans `valeur_id`, resolution par
  correspondance `(user_id, ticker)` sur la table `valeurs` ; laisse
  `valeur_id` a `NULL` si aucune valeur ne correspond (alerte orpheline,
  cas deja possible avant cette session car `POST /api/alertes` n'a
  jamais impose qu'un `ticker` corresponde a une valeur suivie).
- **API** (`server/routes/alertes.js`, `server/routes/valeurs.js`) :
  `POST /api/alertes` resout desormais `valeur_id` a la creation (meme
  requete `(user_id, ticker)` que le backfill). `GET /api/valeurs`
  expose un nouveau champ `hasAlerte` (booleen), calcule par une
  sous-requete `EXISTS` correlee sur `alertes` filtree par
  `valeur_id = v.id AND a.user_id = v.user_id AND a.active = 1` -
  filtrage par `user_id` fait dans la requete SQL elle-meme
  (`BUSINESS_RULES.md`), pas de risque de fuite meme si `valeur_id`
  n'etait pas unique par construction.
- **UI** (`public/index.html`, `public/styles.css`) : nouveau badge
  pilule `.badge-alerte` (icone `icon-bell` existante, taille `.icon-xs`
  10x10 nouvellement introduite, fond `--primary` or, icone blanche),
  affiche via `x-show="valeur.hasAlerte"` juste apres le badge de type
  existant (`.badge-type`) dans `.valeur-sousligne` - meme patron visuel
  que ce badge existant plutot qu'un nouveau style, conformement a la
  consigne de session. `DESIGN.md` mis a jour (liste des tailles
  d'icones, composant Liste des valeurs suivies).
- **Tests** (`server/test/`) :
  - `db-migration.test.js` (nouveau) : pre-remplit une base au format
    "avant migration" (table `alertes` sans `valeur_id`) avant de
    `require('../db')`, verifie que le backfill resout bien `valeur_id`
    pour une alerte correspondant a une valeur existante et le laisse a
    `NULL` pour un ticker orphelin.
  - `alertes.test.js` (nouveau) : `hasAlerte` a `false` sans alerte,
    passe a `true` a la creation d'une alerte active, repasse a `false`
    apres suppression, et isolation stricte entre deux utilisateurs
    suivant le meme ticker (l'alerte de l'un ne marque pas la valeur de
    l'autre).
- **Verification reelle** : suite de tests executee via `node --test`
  (19 sous-tests verts, dont les 4 fichiers `test/*.test.js` existants
  inchanges) - `npm test` (`node --test test/`) echoue dans cet
  environnement sandbox avec une erreur `MODULE_NOT_FOUND` sans rapport
  avec ce changement (reproduit a l'identique sur `HEAD` avant toute
  modification de cette session, `git stash` a l'appui) ; `node --test`
  (sans argument, decouverte automatique) et `node --test test/*.test.js`
  executent la meme suite avec succes - a surveiller sur un environnement
  de deploiement reel (Docker) plutot qu'un correctif suppose dans cette
  session. Serveur demarre en local (`DB_PATH` temporaire) sans erreur
  au demarrage (nouvelle migration + backfill `valeur_id`).
- Version : `server/package.json`/`config.yaml`/`server/package-lock.json`
  1.3.2 -> 1.4.0 (increment MINEUR, nouvelle fonctionnalite utilisateur
  visible, meme ampleur que la Session B qui avait egalement recu un
  increment mineur), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 0/3 -> 1/3. Prochaine session : Session D
  (partage RW de section, voir `BACKLOG.md`).

## 2026-07-25 — Session D : partage de section (lecture/ecriture)

Derniere session du plan "Refonte ergonomie liste des valeurs" (Sessions
A a D, voir `BACKLOG.md`). Objectif : permettre au proprietaire d'une
section de la partager avec un autre compte connu, en lecture seule ou en
lecture/ecriture, sans casser l'isolation stricte par defaut.

- **Migration DB** (`server/db.js`) : nouvelle table `section_shares`
  (`section_id`, `user_id` du destinataire, `role` (`lecture`/`ecriture`),
  `cree_le`, `UNIQUE(section_id, user_id)`, `ON DELETE CASCADE` sur les
  deux cles etrangeres) - ajoutee directement dans le bloc `CREATE TABLE
  IF NOT EXISTS` principal (table neuve, pas de migration `ALTER TABLE`
  necessaire contrairement aux colonnes ajoutees aux Sessions B/C).
- **Controle d'acces** (`server/partage.js`, nouveau) : `rolesSection(db,
  userId)` retourne une `Map<sectionId, {role, proprietaireId}>` pour
  toutes les sections visibles par un utilisateur (les siennes, role
  `proprietaire`, et celles partagees avec lui) ; `peutEcrire(acces)`
  factorise le test `role === 'proprietaire' || role === 'ecriture'`.
  Reutilise par `server/routes/sections.js`.
- **API** :
  - `GET /api/users` (nouveau, `server/routes/users.js`) : liste
    restreinte (id/email/displayName) des autres comptes connus, pour la
    modale de partage.
  - `GET /api/sections` : etendue pour inclure les sections partagees en
    plus des sections possedees, chacune avec `role` et, si non
    proprietaire, `proprietaireEmail`. `POST/PUT/DELETE /api/sections(/:id)`
    et `PUT /api/sections/reorder` restent par ailleurs inchanges dans
    leur contrat (reorder accepte desormais aussi les sections partagees
    en ecriture, mais ne modifie l'ordre de la section elle-meme que pour
    son proprietaire - voir `BUSINESS_RULES.md`).
  - Nouvelles routes imbriquees, reservees au proprietaire :
    `GET/POST /api/sections/:id/partages` (lister/creer un partage) et
    `DELETE /api/sections/:id/partages/:userId` (revoquer).
  - Nouvelles routes imbriquees, accessibles avec le role adequat :
    `GET /api/sections/:id/valeurs` (lecture/ecriture) et `POST/DELETE
    /api/sections/:id/valeurs(/:ticker)` (ecriture uniquement) - exposent
    les valeurs d'**une seule section a la fois** (toujours un seul
    proprietaire, donc sans ambiguite de ticker), a la difference de
    `GET /api/valeurs` qui reste **strictement inchangee** (uniquement
    les valeurs propres de l'utilisateur courant, filtrees par `user_id`
    en SQL) - decision de conception cle pour ne pas casser le contrat
    existant ni introduire de collision de ticker entre comptes en
    fusionnant des valeurs de plusieurs proprietaires dans une seule
    reponse cle par ticker.
  - Une valeur ajoutee par un utilisateur en ecriture dans une section
    partagee est rattachee au `user_id` du **proprietaire** de la
    section, jamais a celui de l'utilisateur agissant (c'est la section
    qui est partagee, pas une copie de donnees cote invite) - verifie
    par test (`server/test/partage.test.js`).
  - `server/routes/valeurs.js` : seul changement, ajout du champ `id`
    (id numerique de la valeur) dans la reponse de `GET /api/valeurs`,
    necessaire cote client pour le nouveau contrat de
    `PUT /api/sections/reorder` (qui identifie desormais les valeurs par
    `id` plutot que par `ticker`, pour rester valide y compris sur une
    section partagee). Le reste de la route (cle du map par ticker,
    `POST`/`DELETE /:ticker`) est inchange.
- **UI** (`public/index.html`, `public/app.js`, `public/styles.css`) :
  - Bouton `icon-share` (nouvelle icone SVG) dans l'en-tete de chaque
    section possedee, ouvre la modale generique `#modalPartage` (liste
    des partages existants avec revocation, formulaire email + role avec
    autocompletion via `<datalist>` alimentee par `GET /api/users`).
  - Nouveau bloc repliable "Partage avec moi" (sous "Valeurs suivies"),
    visible uniquement si au moins une section est partagee avec
    l'utilisateur courant. Chaque section y reprend le gabarit
    `.valeurs-section`/`.valeur-row` existant, sans les actions
    reservees au proprietaire, avec un sous-titre indiquant qui a
    partage et avec quel role. En ecriture : bouton d'ajout dedie et
    glisser-deposer isole a l'interieur de cette seule section (groupe
    SortableJS unique par section partagee, pour qu'un glisser-depose ne
    puisse jamais faire passer une valeur d'un proprietaire a un autre).
  - `Alpine.store('portfolio')` : `store.sections`/`store.valeurs`
    restent strictement les sections/valeurs **possedees** (filtrage
    `role === 'proprietaire'` a la reception de `GET /api/sections`) -
    aucune regression sur le glisser-deposer/reordonnancement existant
    des sections personnelles. Les sections partagees vivent dans un
    etat separe (`store.sectionsPartagees`), peuple par un appel
    supplementaire a `GET /api/sections/:id/valeurs` par section
    partagee.
  - Correction securite en cours de session : premiere version de
    `createPartageRow()`/de la liste `<datalist>` construisait le HTML
    par interpolation de chaine (`innerHTML` avec l'email de
    l'utilisateur partage) - remplace par une construction DOM
    (`createElement`/`textContent`) avant commit, pour ne pas introduire
    de vecteur XSS stocke via un email de compte contenant des
    caracteres HTML.
- **BUSINESS_RULES.md** : nouvelle section "Partage de section
  (lecture/ecriture)", amendement explicite de la regle d'isolation
  stricte (regle historique inchangee par defaut, partage strictement
  opt-in par le proprietaire). `DESIGN.md` : nouveau composant "Partage
  de section", mise a jour de la liste des icones et du "Hors perimetre"
  de la revision visuelle (le partage, precedemment differe, est
  desormais implemente).
- **Tests** (`server/test/partage.test.js`, nouveau, 9 sous-tests) :
  `GET /api/users` exclut l'utilisateur courant, section non partagee
  invisible pour un tiers, role lecture (consultation OK, ecriture
  refusee sur toutes les routes concernees y compris gestion des
  partages), role ecriture (ajout/suppression de valeur OK, valeur
  rattachee au proprietaire), revocation d'un partage, validation
  (role invalide, email inconnu, partage avec soi-meme refuses),
  seul le proprietaire peut lister/creer des partages, authentification
  requise. `server/test/sections.test.js` : test de reorder adapte au
  nouveau contrat par `id` de valeur (au lieu de `ticker`).
- **Verification reelle** : suite complete verte (35 sous-tests,
  `node --test test/*.test.js` - `npm test`/`node --test test/` echoue
  toujours dans cet environnement sandbox avec la meme erreur
  `MODULE_NOT_FOUND` sans rapport avec le code, deja notee et reproduite
  a l'identique sur `HEAD` avant modification en Session C). Parcours API
  reel via `curl` avec deux comptes (partage ecriture, ajout/suppression
  de valeur croisee, reorder croise, revocation, verification des 403/404
  attendus). Parcours navigateur reel (Playwright + Chromium local,
  `chromium-cli` indisponible dans cet environnement) : ouverture de la
  modale de partage, partage effectif, verification visuelle du bloc
  "Partage avec moi" cote destinataire (captures d'ecran) - aucune erreur
  console applicative (seules des erreurs `401` attendues avant connexion
  et un blocage reseau du CDN Chart.js propre au bac a sable, sans lien
  avec cette session).
- Version : `server/package.json`/`config.yaml` 1.4.0 -> 1.5.0
  (increment MINEUR, nouvelle fonctionnalite utilisateur visible de
  premier plan), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 1/3 -> 2/3 (revue non due, seuil 3/3 pas
  atteint). Plan "Refonte ergonomie liste des valeurs" (Sessions A a D)
  desormais complet. Prochaine session : prochain point du backlog
  produit (tuiles d'indices boursiers, voir `BACKLOG.md`).

## 2026-07-25 — Session E : tuiles d'indices de marche (v1.6.0)

Point suivant du backlog produit (`BACKLOG.md`, demande explicite
utilisateur du 2026-07-24) : remplacer les 3 cartes statistiques du haut
(`#statTotal`/`#statHausse`/`#statBaisse`, comptage des valeurs suivies
en hausse/baisse) par le suivi de 3 indices de marche. Avant
implementation, arbitrage utilisateur demande via `AskUserQuestion`
(consigne explicite du prompt de session) sur trois points : source des
cours, frequence de rafraichissement, contenu de chaque tuile.

- **Arbitrage utilisateur** (les trois options recommandees ont ete
  retenues) :
  - Source : Yahoo Finance, meme mecanisme que les valeurs suivies
    (`server/jobs/prices.js`, `fetchYahooFinance`), tickers `^SBF120`
    (SBF 120), `^NDX` (Nasdaq-100), `^GSPC` (S&P 500).
  - Frequence : meme cron que les valeurs suivies (toutes les 2 minutes,
    `server/index.js`), pas de job separe.
  - Contenu de la tuile : nom de l'indice + cours + variation du jour.
  - **Limite connue de cette session** : l'acces reseau sortant vers
    `query1.finance.yahoo.com` est bloque par la politique reseau de cet
    environnement sandbox (403 sur le CONNECT, confirme via
    `curl`/`$HTTPS_PROXY/__agentproxy/status` avant implementation) - les
    3 tickers pressentis n'ont donc pas pu etre verifies en direct dans
    cette session (meme limite deja documentee pour le CDN Chart.js dans
    des sessions precedentes). Le code gere l'echec normalement (erreur
    loguee par ticker, rien ecrit en base, voir `BUSINESS_RULES.md` §
    Integrite des cours) - a verifier une fois deploye sur un environnement
    avec acces reseau reel (Raspberry Pi) que les 3 tickers renvoient
    effectivement des donnees.
- **Backend** :
  - `server/indices.js` (nouveau) : liste fixe des 3 indices suivis
    (ticker + nom).
  - `server/db.js` : nouvelle table `indices_marche` (ticker cle
    primaire, nom, cours, variation, devise, derniere_maj), amorcee au
    demarrage (`INSERT OR IGNORE`) a partir de `server/indices.js` -
    donnees de marche globales, pas de `user_id` (voir
    `BUSINESS_RULES.md` § Indices de marche, nouvelle exception
    documentee a la regle d'isolation par utilisateur).
  - `server/jobs/prices.js` : nouvelle fonction `updateIndices()`,
    reutilise `fetchYahooFinance()` existant (y compris la devise
    d'origine renvoyee par Yahoo, EUR pour le SBF 120, USD pour les deux
    indices americains) ; meme gestion d'erreur non bloquante par ticker
    que `updatePrices()`.
  - `server/index.js` : troisieme `cron.schedule('*/2 * * * *', ...)`
    appelant `updateIndices()`, meme timezone/pattern que les deux jobs
    existants.
  - `server/routes/indices.js` (nouveau) : `GET /api/indices`, protegee
    par `requireAuth` (coherence avec le reste de l'API) mais sans
    filtrage par utilisateur (donnee globale), renvoie un tableau ordonne
    des 3 indices (camelCase, meme convention de mapping explicite que
    les autres routes) plutot qu'une map par ticker (pas de cle naturelle
    a exposer, liste fixe et courte).
  - `server/app.js` : montage de la nouvelle route sous `/api/indices`.
- **Frontend** (`public/index.html`/`app.js`/`styles.css`) :
  - `Alpine.store('portfolio').indices` (nouvel etat), peuple par
    `chargerIndices()` (nouvelle fonction, meme patron que
    `chargerAlertes()`), appelee au demarrage, sur le meme polling 30s
    que les valeurs/alertes, et sur le bouton actualiser.
  - Tuiles statistiques reecrites en `<template x-for="indice in
    $store.portfolio.indices">` (`.stat-card` existant reutilise) :
    nom (`.stat-label`), cours avec devise d'origine
    (`formatCoursDevise()`, nouvelle fonction, distincte de
    `formatCours()` qui suppose EUR pour les valeurs suivies du
    portefeuille), variation du jour en dessous (nouvelle classe
    `.stat-variation`, meme convention `.success`/`.danger` que
    `.valeur-variation`). La bordure superieure coloree de la tuile
    (`.stat-success`/`.stat-danger`, classes existantes) suit desormais
    le signe de la variation de chaque indice au lieu d'etre fixee par
    colonne.
  - Suppression du code mort correspondant a l'ancien contenu :
    fonction `updateStats()` et son appel dans `chargerValeurs()`,
    markup `#statTotal`/`#statHausse`/`#statBaisse`, regles CSS
    `.stat-success .stat-value`/`.stat-danger .stat-value` (coloraient le
    cours lui-meme, plus pertinent avec des indices - seule la nouvelle
    ligne de variation est coloree, comme pour une valeur suivie).
- **Documentation** : `DESIGN.md` (composant "Cartes statistiques"
  reecrit, typographie `.stat-variation`), `ARCHITECTURE.md` (arborescence,
  flux §3, description du store Alpine), `BUSINESS_RULES.md` (nouvelle
  section "Indices de marche", extension de "Integrite des cours").
- **Tests** (`server/test/indices.test.js`, nouveau, 3 sous-tests) :
  authentification requise, les 3 indices sont renvoyes dans un ordre
  stable avec les bons tickers/noms, la reponse est identique pour deux
  utilisateurs differents (donnee non propre a un utilisateur).
- **Verification reelle** : `npm install` (dependances jamais installees
  dans ce checkout), puis suite de tests executee via `node --test
  test/*.test.js` (29/29 verts, memes 3 fichiers existants inchanges plus
  le nouveau) - `npm test` (`node --test test/`) echoue dans cet
  environnement sandbox avec la meme erreur `MODULE_NOT_FOUND` deja notee
  dans plusieurs sessions precedentes, sans rapport avec ce changement.
  Serveur demarre en local (`DB_PATH` temporaire) sans erreur au
  demarrage (nouvelle table + amorcage). Parcours API reel via `curl` :
  `GET /api/indices` sans cookie -> 401, avec cookie -> tableau des 3
  indices dans l'ordre attendu (cours/variation a 0, `derniereMaj` a
  `null`, aucune donnee inventee). Appel direct de `updateIndices()` en
  local : echec reseau attendu (403, meme blocage que documente
  ci-dessus) gere sans crash, aucune ligne ecrite en base. Parcours
  navigateur reel (Playwright + Chromium local, memes outils que les
  sessions precedentes) : connexion, capture d'ecran theme clair et
  sombre - les 3 tuiles s'affichent avec le nom de chaque indice, `-`
  pour le cours (coherent avec l'absence de donnee Yahoo Finance dans cet
  environnement) et `+0.00%` de variation, aucune erreur console
  applicative nouvelle (seules les erreurs `401`/blocage reseau deja
  documentees).
- Version : `server/package.json`/`config.yaml`/`server/package-lock.json`
  1.5.0 -> 1.6.0 (increment MINEUR, nouvelle fonctionnalite utilisateur
  visible de premier plan), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 2/3 -> 3/3 - **seuil atteint, la prochaine
  session est obligatoirement le cycle de revue de dette technique**
  (`METHOD.md` §0.2), pas un nouveau point du backlog produit.

## 2026-07-25 — Revue de dette technique n°3 (`METHOD.md` §0.2)

- **Portee** : `git diff d1c9718..HEAD -- server/ public/` (hors
  `public/vendor/` et `.claude/*.md`), depuis la revue n°2 (commit de
  cloture `d1c9718`, Session 10) jusqu'a `HEAD` : Session 11 (badges
  d'alerte), Session 12 (partage RW de section), Session 13 (tuiles
  d'indices de marche). Correction de perimetre par rapport au prompt de
  session initial (`358c510..HEAD`, en realite le commit de Session 12
  elle-meme, aurait exclu la Session 11) : borne basse corrigee sur
  `d1c9718`, le veritable commit de cloture de la revue n°2. Outillage :
  skill `/simplify`, 4 agents en parallele (reutilisation, simplification,
  efficacite, altitude) sur le diff cumule.
- **Correctifs appliques** (risque faible, comportement inchange) :
  - `server/valeurs.js` (nouveau) : extraction de `HAS_ALERTE_SUBQUERY`
    et `toValeurJson`/`toValeursMap`, remplace deux copies identiques
    (sous-requete SQL + fonction de mapping) entre `GET /api/valeurs`
    (`server/routes/valeurs.js`) et `GET /api/sections/:id/valeurs`
    (`server/routes/sections.js`).
  - `public/app.js`/`public/index.html` : fusion de
    `ouvrirAjoutValeurSection()`/`ouvrirAjoutValeurDefaut()` en une seule
    `ouvrirAjoutValeur(section = null)` ; listeners `addValeurBtn`/`fab`
    passes en fermeture (`() => ouvrirAjoutValeur()`) pour eviter que
    l'objet `Event` du listener natif ne soit recu comme parametre
    `section`. `formatCours()` delegue desormais a
    `formatCoursDevise(cours)` au lieu de dupliquer le meme corps.
  - `server/routes/indices.js` : `SELECT rowid, *` -> `SELECT *` (le tri
    `ORDER BY rowid` ne necessite pas de selectionner la colonne, jamais
    lue par le mapper de reponse).
  - `server/db.js` : extraction de `columnExists(table, column)`,
    remplace deux occurrences separees du motif `PRAGMA table_info(...)
    -> .map(name) -> .includes(...)`.
- **Verification reelle** : `npm install` (dependances jamais installees
  dans ce checkout), puis suite de tests executee via `node --test
  test/*.test.js` (29/29 verts) - `npm test` (`node --test test/`) echoue
  toujours dans cet environnement sandbox avec la meme erreur
  `MODULE_NOT_FOUND` deja notee en Session E, sans rapport avec ce
  changement. Serveur demarre en local (`DB_PATH` temporaire) sans erreur
  au demarrage. Parcours API reel via `curl` : deux comptes enregistres,
  creation d'une valeur puis d'une alerte avec verification de
  `hasAlerte` (`GET /api/valeurs`), partage d'une section en ecriture,
  `GET /api/sections/:id/valeurs` cote invite (meme forme de reponse
  qu'avant l'extraction), ajout d'une valeur par l'invite dans la section
  partagee, `GET /api/indices` (reponse inchangee malgre le retrait de
  `rowid`).
  Aucun changement de comportement observable pour l'utilisateur : pas
  d'incrementation de version (`METHOD.md` §5.5, un correctif purement
  interne n'en necessite pas).
- **Correctifs reportes** (voir le detail complet dans `CLAUDE.md` §
  Historique des revues de dette technique, Revue n°3) : trois
  verifications de propriete de section coexistant dans
  `server/routes/sections.js` (`sectionPossedee()` vs conditions inline
  de `PUT`/`DELETE /:id`, ces dernieres encodant la verification
  directement dans la requete de mutation) ; `rolesSection()` recalculant
  la carte d'acces complete pour ne lire qu'une seule entree sur les
  routes `/:id/valeurs*` ; `updateIndices()` (Session 13) dupliquant la
  boucle sequentielle par ticker de `updatePrices()` au lieu d'un helper
  commun, sans parallelisation (memes raisons de prudence que la Revue
  n°1 pour `prices.js`/`alerts.js`) ; duplication de forme entre
  `initSortableValeurs()`/`initSortableValeursPartagees()` et
  `persisterOrdre()`/`persisterOrdreSectionPartagee()` (Session 12,
  risque de regression sur une interaction de glisser-depose directe) ;
  branche defensive inatteignable dans `rolesSection()` (laissee telle
  quelle) ; les correctifs reportes des revues n°1 et n°2, toujours non
  traites.
- Compteur `BACKLOG.md` : reinitialise a 0/3. Prochaine session : a
  arbitrer avec l'utilisateur (aucun point supplementaire du backlog
  produit n'est encore priorise au-dela du plan livre).
