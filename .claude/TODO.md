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

## 2026-07-25 — Correctif : tuiles d'indices de marche cliquables + compactage mobile (v1.6.1)

- **Retour utilisateur** (capture d'ecran de l'app en v1.6.0 sur mobile) :
  les tuiles `.stat-card` (SBF 120/Nasdaq-100/S&P 500, Session E) etaient
  disproportionnellement hautes sur mobile - le cours suivi de sa devise
  (ex. "28128.34 USD") repassait a la ligne a 24px - et ne reagissaient
  a aucun clic.
- **Correctifs** :
  - `public/index.html` : ajout de `@click="openGraphique(indice.ticker,
    indice.nom)"` sur `.stat-card`.
  - `public/app.js` : `openGraphique(ticker)` accepte desormais un
    second parametre optionnel `nom = null` (titre de la modale =
    `nom || ticker`), comportement des appels existants depuis les
    lignes de valeurs inchange (pas de `nom` passe, titre = ticker comme
    avant).
  - `public/styles.css` : `.stat-card` recoit `cursor: pointer` et un
    survol `--bg-secondary` (meme convention que `.valeur-row`) ; bloc
    mobile (`max-width: 640px`) recompacte `.stats-container`
    (`padding`/`gap` reduits), `.stat-card` (`padding: 8px 6px`),
    `.stat-label` (10px), `.stat-value` (16px, `white-space: nowrap`) et
    `.stat-variation` (11px).
  - `.claude/DESIGN.md` § Cartes statistiques mis a jour (tuiles
    cliquables + gabarit mobile compact).
- **Verification reelle** : `npm test` (`node --test test/*.test.js`,
  29/29 verts, aucune route serveur modifiee - `GET /api/chart/:ticker`
  est deja generique et fonctionnait deja pour n'importe quel ticker).
  Serveur demarre en local (`DB_PATH` temporaire), parcours navigateur
  reel (Playwright + Chromium local, viewport mobile 390x844) : capture
  avant/apres, clic sur une tuile ouvre bien la modale de graphique avec
  le titre "Graphique - SBF 120" (nom lisible, pas le ticker Yahoo brut
  `^SBF120`) ; donnees historiques bloquees par le meme blocage reseau
  Yahoo Finance deja documente dans cet environnement sandbox (sans
  rapport avec ce correctif). Valeurs d'indices injectees directement en
  base pour verifier le rendu avec des cours reels (memes valeurs que la
  capture utilisateur, 6338.08 EUR / 28128.34 USD / 7411.98 USD) : les
  trois tuiles tiennent desormais sur une seule ligne chacune, hauteur de
  carte mesuree a 80.5px (contre une hauteur bien plus importante avant
  correctif, valeur+devise passant sur deux lignes). Verification theme
  sombre : rendu coherent, mêmes proportions compactes.
- Version : `server/package.json`/`server/package-lock.json`/
  `config.yaml` 1.6.0 -> 1.6.1 (increment PATCH, correctif visible pour
  l'utilisateur), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 0/3 -> 1/3.

## 2026-07-25 — Precision de perimetre : usage exclusivement smartphone + simplification CSS responsive (v1.6.2)

- **Demande utilisateur** : l'application n'a pour unique but que d'etre
  accedee depuis un smartphone (PWA), jamais depuis un navigateur de
  bureau ou une tablette. Question posee a l'utilisateur sur la portee
  du changement (documentation seule vs. simplification du CSS) -
  reponse : simplifier le CSS aussi.
- **Documentation** : `CLAUDE.md` § Presentation du projet, nouveau
  paragraphe explicite (usage exclusivement smartphone, aucune mise en
  page desktop a preserver). `DESIGN.md` § Responsive reecrit : retrait
  du systeme a deux niveaux (style de base large + correctif `@media
  (max-width: 640px)`), les valeurs mobiles deviennent les valeurs par
  defaut, absence de tout `@media` de largeur documentee comme choix
  assume (ne pas en reintroduire sans nouvelle demande explicite).
- **Correctif** (`public/styles.css`) : fusion des regles du bloc
  `@media (max-width: 640px)` (retire) dans les regles de base -
  `.stats-container`/`.stat-card`/`.stat-label`/`.stat-value`/
  `.stat-variation` (tailles compactes desormais par defaut),
  `.modal-content` (largeur 95% au lieu de 90%), `#graphiqueContainer`
  (hauteur 300px au lieu de 400px), `.fab` (rapproche des bords, 16px au
  lieu de 24px - le bloc `@supports` de zones sures iOS mis a jour en
  consequence pour rester coherent, `max(16px, env(safe-area-inset-
  bottom))` au lieu de `max(24px, ...)`).
- **Verification reelle** : `npm test` (`node --test test/*.test.js`,
  29/29 verts, aucune route serveur modifiee). Parcours navigateur reel
  (Playwright + Chromium local) a deux largeurs de telephone distinctes
  (375px, iPhone SE-like, et 430px, iPhone Pro Max-like) : hauteur des
  tuiles d'indices identique aux deux largeurs (80.5px), coherente avec
  le rendu obtenu apres le correctif v1.6.1 (aucune regression) ;
  ouverture du graphique d'une valeur ajoutee (`AAPL`) : largeur de
  modale a 95% du viewport (408.5px sur 430px), hauteur du conteneur de
  graphique a 300px comme attendu, aucune erreur console applicative
  nouvelle.
- Version : `server/package.json`/`server/package-lock.json`/
  `config.yaml` 1.6.1 -> 1.6.2 (increment PATCH, `METHOD.md` §0.1 etape 4 :
  toute session fonctionnelle incremente la version meme pour un
  changement interne sans impact visuel), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 1/3 -> 2/3.

## 2026-07-25 — Alerte depuis le graphique, glisser-depose style TradingView (v1.7.0)

- **Demande utilisateur** : deux captures d'ecran de TradingView montrant
  la creation d'une alerte de seuil par glisser-depose direct sur le
  graphique (ligne pointillee + pastille de prix + bouton de validation).
  Session planifiee via `EnterPlanMode` (feature non triviale : nouvelle
  interaction canvas/pointer events, contrainte technique sur le perimetre
  autorise) - plan ecrit et approuve avant implementation.
- **Contrainte technique determinant le perimetre** : `checkAlerts()`
  (`server/jobs/alerts.js`) evalue une alerte via une jointure stricte
  `valeurs.user_id = alertes.user_id AND valeurs.ticker = alertes.ticker`
  - une alerte creee sur un ticker absent de `valeurs` pour l'utilisateur
  courant (indice de marche, valeur d'une section partagee appartenant a
  un autre compte) ne serait jamais evaluee. La fonctionnalite est donc
  restreinte aux valeurs de la liste "Valeurs suivies" propre a
  l'utilisateur (meme perimetre que le bouton cloche existant).
- **Implementation** :
  - `public/index.html` : nouvelle icone `icon-check` dans le sprite SVG ;
    `openGraphique(ticker, nom, alertable)` gagne un 3e parametre, passe
    `true` uniquement depuis la ligne de valeur de "Valeurs suivies" ;
    nouveaux elements overlay (`#alerteLigne`/`#alerteBadge`/
    `#alerteDeclencheur`/`#alerteAnnuler`/`#alerteConfirmer`) ajoutes
    comme freres de `#graphiqueContainer` (dans un nouveau
    `#graphiqueWrapper`) plutot qu'enfants, car `chargerGraphique()`
    remplace `innerHTML` de `#graphiqueContainer` a chaque chargement/
    changement de periode.
  - `public/app.js` : extraction de `creerAlerteAPI(ticker, seuilHaut,
    seuilBas)` depuis `creerAlerte()` (reutilisee par les deux voies de
    creation, pas de duplication de l'appel `POST /api/alertes`).
    Nouvelles fonctions `ouvrirPlacementAlerte()`/
    `confirmerPlacementAlerte()`/`annulerPlacementAlerte()` et gestion
    des `Pointer Events` (`pointerdown`/`pointermove`/`pointerup`,
    `setPointerCapture`) sur `#graphiqueContainer`. Positionnement de la
    ligne via les API publiques de l'echelle Chart.js
    (`getValueForPixel`/`getPixelForValue`), sans plugin d'annotation
    supplementaire. Determination automatique `seuilHaut`/`seuilBas` par
    comparaison de la valeur glissee au cours actuel de la valeur (issu
    du store Alpine). Repositionnement de la ligne si l'utilisateur
    change de periode en cours de placement (le chart est detruit/recree
    par `chargerGraphique()`).
  - `public/styles.css` : styles de l'overlay
    (`.alerte-drag-line`/`.alerte-drag-badge`/`.alerte-drag-trigger`/
    `.alerte-drag-cancel`/`.alerte-drag-confirm`).
  - `.claude/DESIGN.md` (§ Composants, nouveau paragraphe "Alerte depuis
    le graphique" + liste d'icones) et `.claude/BUSINESS_RULES.md` (§
    Alertes de seuil, note sur la portee technique de toute voie de
    creation) mis a jour.
- **Bug trouve et corrige pendant la verification** : les boutons
  `.alerte-drag-trigger`/`.alerte-drag-cancel`/`.alerte-drag-confirm`
  declaraient `display: flex` dans leur regle CSS commune, ce qui
  ecrasait la regle par defaut du navigateur pour l'attribut `hidden`
  (meme specificite, feuille de style chargee apres celle du navigateur)
  - un bouton marque `hidden` restait donc visuellement affiche et
  interceptait les clics. Corrige par une regle `[hidden] { display:
  none; }` explicite sur ces trois classes.
- **Verification reelle** : `npm test` (`node --test test/*.test.js`,
  29/29 verts, aucune route serveur modifiee). Parcours navigateur reel
  (Playwright + Chromium local, viewport mobile 390px) : Yahoo Finance
  et le CDN Chart.js sont tous deux bloques dans cet environnement
  sandbox, donc interception des requetes (`page.route`) pour servir des
  donnees de graphique synthetiques et une copie de Chart.js installee
  localement via npm (uniquement pour ce test, rien vendorise dans le
  depot). Sequence testee : bouton `icon-bell` visible sur le graphique
  d'une valeur suivie -> clic -> mode placement affiche (ligne + pastille
  + boutons annuler/valider) -> glissement vers le haut -> pastille
  affiche le bon prix -> validation -> `GET /api/alertes` confirme
  `seuilHaut` correct ; meme sequence vers le bas -> confirme `seuilBas`
  correct ; annulation -> aucune alerte supplementaire creee, bouton
  cloche reaffiche ; graphique d'un indice de marche -> bouton d'ajout
  d'alerte absent. Capture d'ecran du mode placement verifiee en theme
  clair et sombre (ligne/pastille/boutons lisibles dans les deux).
- Version : `server/package.json`/`server/package-lock.json`/
  `config.yaml` 1.6.2 -> 1.7.0 (increment MINEUR, nouvelle fonctionnalite
  utilisateur visible de premier plan, meme ampleur que les sessions
  precedentes versionnees en MINEUR), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 2/3 -> 3/3 - **seuil atteint, la prochaine
  session est obligatoirement le cycle de revue de dette technique**
  (`METHOD.md` §0.2), pas un nouveau point du backlog produit.

## 2026-07-25 — Revue de dette technique n°4 (`METHOD.md` §0.2)

- **Portee** : `git diff 31b310f..HEAD -- server/ public/` (hors
  `public/vendor/` et `.claude/*.md`), depuis la revue n°3 (commit de
  cloture `31b310f`, Session 14) jusqu'a `HEAD` : Session 15 (tuiles
  d'indices cliquables/compactes), Session 16 (perimetre smartphone-only
  + CSS responsive simplifiee), Session 17 (alerte depuis le graphique).
  Correction de perimetre par rapport au prompt de session initial
  (`e55b83a..HEAD`, en realite le commit de Session 16 elle-meme, aurait
  exclu les Sessions 15 et 16) : borne basse corrigee sur `31b310f`, le
  veritable commit de cloture de la revue n°3 (meme type de correction
  deja applique en Revue n°3). Outillage : skill `/simplify`, 4 agents en
  parallele (reutilisation, simplification, efficacite, altitude) sur le
  diff cumule.
- **Correctifs appliques** (risque faible, comportement inchange - sauf
  le dernier, correctif d'etat interne sans impact observable en usage
  normal) :
  - `public/app.js` : suppression de `annulerPlacementAlerte()` (relais
    pur vers `fermerPlacementAlerte()`, un seul appelant) ; le bouton
    Annuler (`public/index.html`) appelle desormais `fermerPlacementAlerte()`
    directement.
  - `public/app.js` (`mettreAJourPlacementDepuisEvent()`) : suppression
    du double clampage (pixel puis valeur) - mathematiquement redondant
    pour une echelle Chart.js lineaire, conserve uniquement le clampage
    en espace valeur.
  - `public/app.js` (`alerteOnPointerDown/Move/Up`) : le rectangle du
    conteneur du graphique (`getBoundingClientRect()`) est desormais
    calcule une seule fois par geste de glisser-depose au lieu d'a chaque
    `pointermove`.
  - `public/app.js` (`closeAllModals()`) appelle desormais
    `fermerPlacementAlerte()` - fermer la modale graphique via l'icone
    `icon-x`/le fond semi-transparent pendant le mode placement laissait
    auparavant les ecouteurs pointer et `placementAlerteActif` actifs ;
    sans impact observable en usage normal (`openGraphique()`
    reinitialise deja l'etat a la reouverture), corrige par coherence
    defensive.
- **Verification reelle** : `npm install` (dependances jamais installees
  dans ce checkout), suite de tests via `node --test test/*.test.js`
  (29/29 verts) - `npm test` (`node --test test/`) echoue toujours dans
  cet environnement sandbox avec la meme erreur `MODULE_NOT_FOUND` deja
  notee en Revue n°3, sans rapport avec ce changement. Serveur demarre en
  local (`DB_PATH` temporaire) sans erreur, `GET /`/`GET /login.html` ->
  200. Correctifs limites a du JS/HTML non visuel (pas de changement de
  gabarit/couleur/disposition) : pas de test manuel navigateur du geste
  de glisser-depose lui-meme cette session.
  Aucun changement de comportement observable pour l'utilisateur : pas
  d'incrementation de version (`METHOD.md` §5.5).
- **Correctifs reportes** (voir le detail complet dans `CLAUDE.md` §
  Historique des revues de dette technique, Revue n°4) : duplication CSS
  entre `.alerte-drag-trigger`/`.alerte-drag-cancel`/`.alerte-drag-confirm`
  et `.btn-icon-small`/`.btn-icon-gold` (fusion risquant un leger
  changement de gabarit visuel, a verifier au navigateur) ; double
  mecanisme de visibilite du mode placement (classe CSS + cinq attributs
  `hidden` togliges manuellement) ; branche specifique a l'alerte dans
  `chargerGraphique()` (fonction generique de rendu du graphique) plutot
  qu'un evenement generique, avec un effet de bord repere au passage
  (ligne d'alerte non re-clampee lors d'un changement de periode en cours
  de placement) ; les correctifs reportes des revues n°1/n°2/n°3, toujours
  non traites.
- Compteur `BACKLOG.md` : reinitialise a 0/3. Prochaine session : a
  arbitrer avec l'utilisateur (aucun point supplementaire du backlog
  produit n'est encore priorise au-dela du plan livre).

## 2026-07-25 — Session 19 - alertes existantes affichees sur le graphique (v1.8.0)

- **Demande explicite utilisateur** : afficher sur le graphique historique
  d'une valeur les alertes de seuil deja posees (ligne fine + prix), et ne
  pas les afficher (ou signaler qu'elles sont hors limites) quand le seuil
  tombe hors de la plage de valeurs affichee par le graphique.
- **Implementation** :
  - `public/app.js` : cache `alertesParTicker` (ticker -> tableau de
    `{seuilHaut, seuilBas}`) construit dans `displayAlertes()` a partir de
    la reponse `GET /api/alertes` deja chargee (aucun nouvel appel reseau).
  - Nouvelle fonction `afficherAlertesGraphique(ticker)` appelee a chaque
    (re)chargement du graphique (`chargerGraphique()`, ouverture + tout
    changement de periode) : pour chaque seuil actif du ticker courant, si
    `graphiqueState.alertable` (memes restrictions que le mode placement
    de la Session 17 - jamais sur un indice ou une valeur d'une section
    partagee) et si le seuil tombe dans `chartInstance.scales.y.min/max`,
    rend une ligne pointillee + une pastille de prix
    (`.alerte-existante-ligne`/`.alerte-existante-badge`) via les memes
    API publiques d'echelle Chart.js que la Session 17
    (`getPixelForValue`, pas de plugin d'annotation). Un seuil hors de
    cette plage rend a la place un repere compact `.alerte-hors-limite`
    (fleche + prix) epingle en haut ou en bas du graphique.
  - `public/index.html` : nouveau conteneur `#alertesGraphiqueOverlay`
    dans `#graphiqueWrapper`, vide/repeuple a chaque appel de
    `chargerGraphique()`.
  - `public/styles.css` : nouvelles classes `.alerte-existante-ligne`
    (pointille 1px `--danger`, volontairement distinct du pointille or
    `--primary` du mode placement pour ne pas confondre un seuil deja
    pose avec celui en cours de glissement), `.alerte-existante-badge`
    (ancree a droite du graphique, cote oppose a la pastille doree du
    mode placement ancree a gauche) et `.alerte-hors-limite`.
  - `.claude/DESIGN.md` : nouveau composant « Alertes existantes sur le
    graphique » documente sous « Alerte depuis le graphique ».
- **Verification reelle** : `npm test` (`node --test test/*.test.js`,
  29/29 verts, aucune route serveur modifiee). Parcours navigateur reel
  (Playwright + Chromium local, viewport mobile 390px, meme contournement
  qu'en Session 17 pour Yahoo Finance/CDN Chart.js bloques dans ce
  sandbox : donnees de graphique synthetiques + copie locale de Chart.js
  via npm, non vendorisee dans le depot) : trois alertes creees via l'API
  sur un ticker dont le graphique synthetique couvre 100-200 (seuil haut
  150 dans la plage, seuil haut 500 au-dessus, seuil bas 50 en dessous) ->
  ligne + pastille "150.00 EUR" correctement positionnees sur l'axe,
  reperes "▲ 500.00 EUR" et "▼ 50.00 EUR" affiches en haut/bas sans ligne
  tracee hors plage ; mode placement d'une nouvelle alerte (Session 17)
  ouvert en parallele -> pastilles gauche (nouvelle alerte, or) et droite
  (alertes existantes, rouge) coexistent sans chevauchement, aucune erreur
  console ; graphique d'un indice de marche (`stat-card`, non alertable)
  -> overlay vide malgre les alertes existantes en cache pour d'autres
  tickers. Capture d'ecran verifiee en theme sombre egalement.
- Version : `server/package.json`/`config.yaml` 1.7.0 -> 1.8.0 (increment
  MINEUR, nouvelle fonctionnalite utilisateur visible, meme ampleur que
  les sessions precedentes versionnees en MINEUR), journalise dans
  `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 0/3 -> 1/3.

## 2026-07-25 — Session 20 - densite de la liste des valeurs suivies (v1.8.1)

- **Demande explicite utilisateur** : reduire la taille des polices pour
  voir au moins 8 valeurs sur un meme ecran sans avoir a scroller.
- **Implementation** (`public/styles.css`, uniquement `.valeur-row` et son
  contenu - reste de l'application inchange) :
  - `.valeur-row` : padding vertical 12px -> 3px (padding complet `12px
    16px 12px 8px` -> `3px 8px 3px 6px`), `gap` 8px -> 6px.
  - `.valeur-avatar` : 40px -> 28px, police 14px -> 10px.
  - `.valeur-nom` : 15px -> 13px, `line-height: 1.25` explicite (au lieu
    de l'interligne global 1.5 du `body`, qui aurait annule une partie du
    gain de place).
  - `.valeur-sousligne` : 12px -> 10px, meme traitement `line-height`.
  - `.badge-type`/`.badge-alerte` : police 10px -> 9px, padding et
    margin-left legerement reduits.
  - `.valeur-footer` (deux lignes `MAJ:`/`Vol:`, voir Session 7) : 11px ->
    9px, `line-height: 1.25`.
  - `.valeur-cours` : 15px -> 13px ; `.valeur-variation` : 13px -> 10px.
  - `.valeur-actions .btn-icon-small` (boutons `icon-bell`/`icon-trash` de
    la ligne) : padding 6px -> 4px, regle scopee a `.valeur-actions` pour
    ne pas affecter les autres usages de `.btn-icon-small` (en-tetes de
    section, carte alerte, modale de partage).
  - `.claude/DESIGN.md` : nouvelle sous-section « Densite de la liste des
    valeurs suivies » sous le composant « Liste des valeurs suivies »,
    tableau de typographie mis a jour (`valeur-cours`/`valeur-variation`).
- **Verification reelle** : `npm test` (`node --test test/*.test.js`,
  29/29 verts, aucun fichier serveur modifie). Mesure reelle au navigateur
  (Playwright + Chromium local) avec 10 valeurs suivies dans la section
  par defaut : sur un viewport 375x667 (iPhone SE, le plus petit gabarit
  de smartphone couramment cible), 8 lignes desormais pleinement visibles
  sans scroll (contre 4 avant ce correctif, meme jeu de donnees) ; sur un
  viewport 390x844, les 10 lignes tiennent entierement a l'ecran avec le
  bouton "+ Nouvelle section" visible en dessous. Capture d'ecran verifiee
  en theme clair et sombre (lisibilite conservee aux tailles reduites).
  Fonctionnellement : clic sur l'icone cloche d'une ligne ouvre bien la
  modale de creation d'alerte avec le bon ticker (le `stopPropagation` et
  la zone cliquable des boutons d'action restent fonctionnels malgre le
  padding reduit).
- Version : `server/package.json`/`server/package-lock.json`/
  `config.yaml` 1.8.0 -> 1.8.1 (increment PATCH - reduction de gabarit
  visuel, pas de nouvelle fonctionnalite), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 1/3 -> 2/3.

## 2026-07-25 — Session 21 - zoom desactive + tuiles d'indices recompactees (v1.8.2)

- **Demandes explicites utilisateur** (memes session) : (1) desactiver
  toute forme de zoom, la page se retrouvant parfois zoomee sans action
  volontaire, cachant une partie de l'ecran ; (2) les 3 tuiles d'indices
  de marche sont trop grosses.
- **Diagnostic du zoom intempestif** : deux causes distinctes.
  1. Le meta viewport (`public/index.html`/`public/login.html`) n'avait ni
     `maximum-scale` ni `user-scalable`, laissant le pincement-zoom actif.
  2. Cause la plus probable du zoom **subi** (pas un geste volontaire de
     pincement) : `.input` (`public/styles.css`) etait en police 14px.
     iOS Safari/WKWebView zoome automatiquement la page au focus de tout
     champ de formulaire dont la police calculee est sous 16px,
     independamment du meta viewport - comportement natif du moteur, pas
     un bug applicatif. Tous les champs de l'app partagent cette classe
     (connexion, ajout de valeur, creation d'alerte, modales prompt/
     partage), donc un seul point de correction.
- **Implementation** :
  - `public/index.html`/`public/login.html` : meta viewport `width=
    device-width, initial-scale=1.0` -> ajout de `maximum-scale=1.0,
    user-scalable=no`.
  - `public/styles.css` : `html { touch-action: manipulation }` (nouveau)
    desactive le double-tap-zoom au niveau moteur, independamment du meta
    viewport. `.input` : police 14px -> 16px (seuil sous lequel iOS
    declenche le zoom automatique au focus).
  - `public/styles.css` (`.stats-container`/`.stat-card`) : deuxieme
    reduction des tuiles d'indices (apres celle deja actee en v1.6.1) -
    padding `10px 12px`/`8px 6px` -> `8px 10px`/`5px 4px`, coins 8px ->
    6px, bordure superieure 3px -> 2px, `.stat-label` 10px -> 9px,
    `.stat-value` 16px -> 13px, `.stat-variation` 11px -> 9px,
    `line-height: 1.2` explicite sur les trois.
  - `.claude/DESIGN.md` : § PWA (nouveau point "Zoom desactive") et §
    Cartes statistiques mis a jour avec les nouvelles tailles ; au passage,
    suppression d'une mention obsolete de breakpoint `max-width: 640px`
    dans ce paragraphe (retire depuis v1.6.2, jamais corrige dans la doc).
- **Verification reelle** : `npm test` (`node --test test/*.test.js`,
  29/29 verts, aucun fichier serveur modifie). Parcours navigateur reel
  (Playwright + Chromium local, viewport 375x667) : meta viewport et
  police des champs de formulaire verifies par lecture directe du DOM
  (`getComputedStyle`) sur la page de connexion et sur la modale d'ajout
  de valeur - `font-size` de `#email`/`#inputTicker` confirme a 16px apres
  correctif. Hauteur de tuile d'indice mesuree avant/apres : 80.5px ->
  52.2px (~35% de reduction). Capture d'ecran des tuiles recompactees
  verifiee en theme clair et sombre (lisibilite conservee, cours avec
  devise du type "28128.34 USD" toujours affiche sur une seule ligne).
- Version : `server/package.json`/`server/package-lock.json`/
  `config.yaml` 1.8.1 -> 1.8.2 (increment PATCH - correctifs visuels/UX,
  pas de nouvelle fonctionnalite), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 2/3 -> 3/3 - **seuil atteint, la prochaine
  session est obligatoirement le cycle de revue de dette technique**
  (`METHOD.md` §0.2), pas un nouveau point du backlog produit.

## 2026-07-26 — Revue de dette technique n°5 (voir CLAUDE.md pour le detail complet)

- Voir `.claude/CLAUDE.md` § Historique des revues de dette technique
  (section "2026-07-26 — Revue n°5") pour la portee, les correctifs
  appliques et reportes. Compteur `BACKLOG.md` : 3/3 -> 0/3.

## 2026-07-26 — Session 23 - logo de l'application (v1.8.3)

- **Demande explicite utilisateur** : ajouter le logo fourni (piece
  jointe) de sorte qu'il soit visible en haut a gauche de la page
  principale, et qu'il soit utilise comme icone lors d'un "Ajouter a
  l'ecran d'accueil" depuis iPhone.
- **Traitement de l'image source** (script Python/Pillow, hors depot) :
  le fichier fourni etait un export d'icone d'app classique (carre
  1254x1254, coins arrondis, marge noire autour du rectangle a coins
  arrondis, aucune transparence - mode RGB). Recadre sur la boite
  englobante du contenu utile (suppression de la marge noire), puis les
  quatre coins residuels (rendus noirs par le decoupage des coins
  arrondis) combles avec la couleur de fond du logo (bleu marine,
  echantillonnee sur l'image elle-meme, tres proche de `--header-bg`)
  plutot que laisses transparents ou noirs - resultat : une image carree
  pleine, sans liseré, adaptee a un usage manifeste `purpose: any
  maskable` comme au rendu compact dans le header.
- **Fichiers generes** (`public/icons/`) : `icon-192.png`/`icon-512.png`
  remplaces (ecrasent les anciennes icones provisoires "PT" generees
  automatiquement) ; nouveau fichier `apple-touch-icon.png` (180x180,
  taille exacte recommandee par Apple pour eviter un redimensionnement
  flou automatique) plutot que de continuer a reutiliser `icon-192.png`
  pour l'`apple-touch-icon` comme avant cette session.
- **Implementation** :
  - `public/index.html` : `<link rel="apple-touch-icon">` pointe
    desormais vers `icons/apple-touch-icon.png` (au lieu de
    `icons/icon-192.png`) ; ajout d'un `<img class="header-logo">`
    (source `icons/icon-192.png`) dans `.header-titre`, avant le `<h1>`.
  - `public/login.html` : ajout du `<link rel="apple-touch-icon">`
    manquant (seul le favicon existait), pour que l'icone soit correcte
    meme si l'utilisateur ajoute l'app a l'ecran d'accueil depuis la page
    de connexion plutot que depuis la page principale.
  - `public/styles.css` : nouvelle classe `.header-logo` (28x28, coins
    arrondis 6px) ; `.header-titre` passe de `align-items: baseline` a
    `align-items: center` (necessaire pour aligner proprement l'image
    avec le titre et le badge de version, la baseline n'ayant de sens
    que pour du texte).
  - `.claude/DESIGN.md` : § Header (mention du logo) et § PWA (origine
    des fichiers, remplace l'ancienne note "icones provisoires")
    mis a jour.
- **Verification reelle** : `npm test` (`node --test test/*.test.js`,
  29/29 verts, aucun fichier serveur modifie - changement limite au
  front-end statique et aux icones). Serveur demarre localement
  (`GET /`/`GET /login.html`/`GET /icons/icon-192.png`/
  `GET /icons/apple-touch-icon.png` -> 200). Capture d'ecran Playwright
  (Chromium local, viewport 390 px, compte de test reel) du header en
  theme clair et en theme sombre : logo carre net, sans liseré ni
  artefact noir, bien aligné avec le titre "Portfolio" et le badge de
  version.
- Version : `server/package.json`/`server/package-lock.json`/
  `config.yaml` 1.8.2 -> 1.8.3 (increment PATCH - ajout visuel, pas de
  nouvelle fonctionnalite metier), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 0/3 -> 1/3.

## 2026-07-26 — Session 24 - correctif densite des cartes d'alerte (v1.8.4)

- **Retour utilisateur** (capture d'ecran reelle sur iPhone, suite
  immediate de la Session 23) : le logo est valide, mais les cartes de
  la section "Alertes actives" restent trop imposantes - demande
  explicite qu'elles soient au maximum equivalentes aux lignes de la
  liste des valeurs suivies (`.valeur-row`, deja compactee en v1.8.1),
  idealement plus petites.
- **Implementation** (`public/styles.css`, `.alerte-card` et alentours) :
  - `.alertes-liste` : espacement entre cartes 8px -> 4px.
  - `.alerte-card` : padding `12px 16px` -> `4px 10px`.
  - `.alerte-ticker` : pas de taille explicite (heritait des 15-16px du
    corps de page) -> 13px/500 explicite, aligne sur `.valeur-nom` ;
    `line-height: 1.25` ajoute (meme convention que les selecteurs
    `.valeur-*` compactes en v1.8.1) ; marge basse 4px -> 1px.
  - `.alerte-seuils` : 13px -> 10px, aligne sur `.valeur-sousligne` ;
    `line-height: 1.25` ajoute.
  - Nouvelle regle `.alerte-card .btn-icon-small { padding: 4px; }`
    (bouton `icon-trash`), meme reduction que celle deja appliquee a
    `.valeur-actions .btn-icon-small` en v1.8.1.
- **Verification reelle** : `npm test` (`node --test test/*.test.js`,
  29/29 verts, aucun fichier serveur modifie). Serveur demarre
  localement, compte de test avec 2 valeurs et 3 alertes creees via
  l'API pour reproduire l'ecran de la capture utilisateur ; capture
  d'ecran Playwright (Chromium local, viewport 390 px) confirmant le
  nouveau rendu compact. Hauteur mesuree par lecture directe du DOM
  (`getBoundingClientRect()`) : `.alerte-card` 37.75px contre
  `.valeur-row` 47.75px - strictement plus compacte que demande, pas
  seulement egale.
- Version : `server/package.json`/`server/package-lock.json`/
  `config.yaml` 1.8.3 -> 1.8.4 (increment PATCH - correctif visuel, pas
  de nouvelle fonctionnalite), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 1/3 -> 2/3.

## 2026-07-26 — Sessions 25 a 27 (v1.8.5 a v1.8.8) + correctifs same-day v1.8.6/v1.8.9

- Non detaillees individuellement ici (lacune de journalisation
  preexistante a la Revue n6, non comblee retroactivement pour ne pas
  reconstruire a posteriori des details non verifies) : voir
  `BACKLOG.md` §§ Sessions hors plan pour le detail complet de chaque
  session (validation du ticker Yahoo Finance, encodage URL du ticker,
  recherche de valeur a l'ajout, une meme valeur dans plusieurs
  sections).
- Compteur `BACKLOG.md` : 2/3 -> 3/3 (Session 25) puis maintenu a 3/3
  malgre le depassement (Sessions 26/27 livrees sur demande explicite de
  l'utilisateur avant la revue, voir arbitrage documente dans
  `BACKLOG.md`).

## 2026-07-26 — Revue de dette technique n°6 (voir CLAUDE.md pour le detail complet)

- Voir `.claude/CLAUDE.md` § Historique des revues de dette technique
  (section "2026-07-26 — Revue n°6") pour la portee, les correctifs
  appliques et reportes. Compteur `BACKLOG.md` : 3/3 -> 0/3.

## 2026-07-26 — Session 30 - resolution complete de la dette reportee (v1.9.0), puis reset du compteur/seuil

- Voir `.claude/CLAUDE.md` § Historique des revues de dette technique
  (section "2026-07-26 — Session 30") pour le detail correctif par
  correctif (traitement complet, sur demande explicite de l'utilisateur,
  de la dette reportee cumulee depuis les Revues n1 a n6). Session 29
  (factorisation Yahoo Finance, v1.8.10) traitee juste avant, non
  detaillee individuellement ici (meme lacune de journalisation deja
  signalee pour les Sessions 25-27, non comblee retroactivement).
- Juste apres, sur demande explicite de l'utilisateur : compteur remis a
  0/5 et seuil de declenchement porte de 3 a 5 sessions (`METHOD.md`
  §0.2 mis a jour en consequence). Voir `BACKLOG.md` pour le detail de
  cet arbitrage.

## 2026-07-27 — Session 31 - correctif FAB recouvrant le dernier element scrolle (v1.9.1)

- **Retour utilisateur** (capture d'ecran reelle sur iPhone) : le bouton
  flottant d'ajout (FAB, `position: fixed` en bas a droite) recouvrait le
  bouton de suppression de la derniere alerte active une fois la page
  scrollee tout en bas, le rendant inaccessible.
- **Diagnostic** : `body` (`public/styles.css`) ne reservait aucun espace
  en bas de page pour le FAB (56px + 16px de marge) — en scrollant
  jusqu'au bout, le dernier element restait sous le bouton flottant, qui
  reste toujours a la meme position ecran.
- **Implementation** (`public/styles.css`) : `padding-bottom: 88px` sur
  `body`, plus une variante dans le bloc `@supports (padding: max(0px))`
  existant (`max(88px, calc(72px + env(safe-area-inset-bottom)))`) pour
  les iPhone a encoche — meme convention que celle deja utilisee pour le
  FAB lui-meme.
- **Ergonomie discutee avec l'utilisateur** : alternative d'un pied de
  page fixe avec le bouton evoquee puis explicitement ecartee par
  l'utilisateur (« le correctif actuel me convient, laisse comme ca ») —
  le FAB reste le composant documente dans `DESIGN.md`, pas de
  changement de pattern visuel.
- **Verification reelle** : `node --test test/*.test.js` (45/45 verts,
  aucun fichier serveur modifie). Serveur demarre localement, compte de
  test avec des valeurs et 2 alertes actives inserees directement en
  base (memes tickers/seuils que la capture utilisateur, sans appel
  reseau) ; capture d'ecran Playwright (Chromium local, viewport 390 px,
  page scrollee tout en bas) confirmant que le bouton poubelle de la
  derniere alerte n'est plus recouvert par le FAB — puis re-verifie que
  le bug se reproduisait bien sans le correctif (`git stash`) avant de le
  restaurer, pour confirmer que c'est bien ce changement qui resout le
  probleme.
- Version : `server/package.json`/`config.yaml` 1.9.0 -> 1.9.1
  (increment PATCH - correctif visuel, pas de nouvelle fonctionnalite),
  journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 0/5 -> 1/5.

## 2026-07-27 — Session 32 - correctif variation du jour bloquee a +0.00% (v1.9.2)

- **Retour utilisateur** (capture d'ecran reelle, marches ouverts,
  version deployee 1.9.1) : toutes les valeurs suivies affichent
  `+0.00%` de variation malgre des cours a jour (`MAJ` recente, prix
  plausibles), sur des tickers/marches varies simultanement - pas un cas
  isole d'un seul ticker.
- **Diagnostic** (`server/jobs/prices.js`, `fetchYahooFinance`) :
  `changePct` etait lu depuis `meta.regularMarketChangePercent`, un champ
  qui n'existe que sur l'endpoint Yahoo Finance `/v7/finance/quote` - pas
  sur `/v8/finance/chart`, l'endpoint reellement appele ici. Le champ
  etait donc systematiquement `undefined`, ramene a `0` par le
  `|| 0` de secours. `regularMarketPrice` (le cours), lui, existe bien
  dans `meta` sur cet endpoint - d'ou des cours a jour mais une variation
  toujours nulle. Root cause jamais verifiee en direct auparavant :
  l'acces reseau vers Yahoo Finance est bloque dans ce bac a sable
  (politique reseau, confirme via `curl`/`$HTTPS_PROXY/__agentproxy/
  status`), documente comme limite connue depuis la session d'origine des
  indices de marche (v1.6.0) - le bug n'a donc pu se reveler que sur le
  Raspberry Pi en production.
- **Implementation** (`server/jobs/prices.js`) : `changePct` recalcule a
  partir de `meta.regularMarketPrice` et de `meta.previousClose` (repli
  sur `meta.chartPreviousClose` si absent, aucune cloture precedente
  disponible -> `0` plutot qu'une erreur, meme convention que le reste de
  la fonction). Reutilise par `updatePrices()`, `updateIndices()` et
  `verifierTickerExiste()` (creation d'une valeur), tous bases sur
  `fetchYahooFinance()`.
- **Tests** :
  - Nouveau `server/test/prices.test.js` (4 sous-tests unitaires, mock de
    `global.fetch` direct sans serveur complet) : variation en hausse,
    en baisse, repli sur `chartPreviousClose`, absence totale de cloture
    precedente (`0` sans erreur).
  - `server/test/support/helpers.js` (mock partage par tous les tests
    serveur) : le faux `meta` simulait `regularMarketChangePercent`, un
    champ qui n'existe pas reellement - remplace par
    `regularMarketPrice`/`previousClose` (101.5/100, variation exacte de
    1.5% en flottant, valeur deja attendue par `valeurs.test.js`) pour
    que les tests exercent le vrai calcul plutot qu'un champ fictif qui
    masquait le bug depuis l'origine.
  - `valeurs.test.js` : assertion `aapl.cours` mise a jour de `100` a
    `101.5` (nouveau cours du mock), `aapl.variation` inchangee (`1.5`).
- **Verification reelle** : `node --test test/*.test.js` (49/49 verts -
  45 existants + 4 nouveaux). Pas de verification navigateur
  supplementaire (correctif limite au calcul serveur, deja couvert par
  les tests unitaires directs sur `fetchYahooFinance`).
- Version : `server/package.json`/`config.yaml` 1.9.1 -> 1.9.2
  (increment PATCH - correctif de donnees, pas de nouvelle
  fonctionnalite), journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 1/5 -> 2/5.

## 2026-07-27 — Session 33 - fusion des endpoints d'ajout, retrait de alertes.valeur_id, volume echange sur le graphique (v1.9.3)

- **Demande explicite utilisateur** : traiter les deux derniers points de
  dette technique reportes depuis la Revue n°6/Session 30 (voir
  `CLAUDE.md` § Historique des revues, `BACKLOG.md` § Backlog produit) et
  ajouter un graphique du volume echange dans la fenetre de graphique
  d'evolution d'une valeur.
- **Fusion `POST /api/valeurs`/`POST /api/sections/:id/valeurs`**
  (`server/routes/valeurs.js`, `server/routes/sections.js`) :
  - Nouveau helper `sectionCibleEcriture(userId, sectionIdBrut)`
    (`server/routes/valeurs.js`) : `sectionId` fourni -> resolu via
    `roleSection()`/`peutEcrire()` (`server/partage.js`), rejette (403,
    aucun `sectionId` retourne) si la section n'est ni possedee ni
    partagee en ecriture ; `sectionId` absent -> repli sur la premiere
    section possedee (comportement historique inchange). Remplace
    l'ancien `sectionCible()` qui ne verifiait que la propriete directe
    et retombait silencieusement sur la section par defaut en cas
    d'echec.
  - `POST /:id/valeurs` retiree de `server/routes/sections.js` (`GET`/
    `DELETE` conserves, seule l'ecriture etait dupliquee) ; imports
    devenus inutiles (`verifierTickerExiste`, `creerValeur`,
    `asyncHandler`) retires.
  - Client (`public/app.js`, `ajouterValeur()`) : appelle desormais
    toujours `POST /api/valeurs` avec `sectionId` dans le corps de la
    requete si une section est ciblee, sans plus decider lui-meme de la
    route selon `section.role` (variable `sectionCibleAjout` renommee en
    consequence dans son commentaire).
  - **Changement de comportement mineur assume** : un `sectionId` fourni
    sans droit d'ecriture est desormais explicitement rejete (403,
    `Section invalide`) plutot que silencieusement ignore au profit de
    la section par defaut - comportement plus previsible, deja celui de
    l'ancienne route dediee aux sections partagees. Test
    `valeurs.test.js` mis a jour en consequence (nouveau titre, assertion
    403 au lieu d'un repli silencieux) ; 4 sites `partage.test.js`
    migres de `POST /api/sections/:id/valeurs` vers `POST /api/valeurs`
    avec `sectionId`.
- **Retrait de `alertes.valeur_id`** (`server/db.js`) : l'ancienne
  migration `ALTER TABLE ADD COLUMN valeur_id` + backfill remplacee par
  une migration de recreation de table (meme technique que la migration
  `UNIQUE(user_id, ticker, section_id)` de `valeurs`, Session 27 -
  SQLite ne permet pas de retirer une colonne portant une contrainte FK
  via `ALTER TABLE`), executee seulement si la colonne existe encore
  (base ayant deja subi l'ancienne migration). `server/routes/alertes.js`
  (`POST /`) : `INSERT` a 9 colonnes au lieu de 10, plus de recherche
  prealable de la valeur correspondante (devenue inutile).
  `server/valeurs.js` : `supprimerValeurEtDetacherAlertes()` renommee
  `supprimerValeur()` et simplifiee (suppression directe, sans plus
  detacher une FK qui n'existe plus) - un bug de shadowing de variable a
  ete introduit puis corrige en cours de session par un remplacement
  global trop large (`sed`) qui avait renomme aussi la variable locale
  `const supprimerValeur = db.transaction(...)` portant le meme nom que
  la fonction importee dans les 2 routes qui l'utilisent
  (`server/routes/valeurs.js` `DELETE /:id`, `server/routes/sections.js`
  `DELETE /:id/valeurs/:ticker`) : la transaction locale s'appelait alors
  elle-meme au lieu d'appeler le helper importe ; renommee
  `executerSuppression` dans les deux cas pour lever l'ombrage, verifie
  par la suite complete de tests avant de considerer le correctif acquis.
  `server/test/db-migration.test.js` entierement reecrit (l'ancien
  testait le backfill de `valeur_id`, desormais sans objet) pour tester
  la migration de retrait de colonne sur une base "avant migration"
  simulee (table `alertes` avec `valeur_id`), verifiant la disparition de
  la colonne et la preservation des autres colonnes des alertes
  existantes.
- **Volume echange sur le graphique** (`public/app.js`, `public/
  index.html`, `public/styles.css`) : `GET /api/chart/:ticker`
  (`server/routes/chart.js`) exposait deja `volume` par point sans
  jamais l'exploiter cote client. Nouveau graphique Chart.js separe en
  barres (`#graphiqueVolumeContainer`/`#volumeCanvas`, 70px, sous
  `#graphiqueContainer`), construit par `chargerGraphiqueVolume()`,
  appele a chaque `chargerGraphique()` (ouverture, changement de
  periode) - instance Chart.js distincte du graphique de cours (pas un
  axe secondaire du meme graphique) pour rester independante de son
  echelle de prix. Barres colorees `--success`/`--danger` selon que le
  cours du point est en hausse/baisse par rapport au point precedent
  (calcule cote client a partir des `close` deja recuperes, aucun appel
  API supplementaire), premier point neutre (gris) faute de reference ;
  axe Y en libelles compacts via `formatVolume()` (deja utilise par le
  footer de la liste des valeurs suivies, `4.0K`/`1.2M`). Alignement
  horizontal des deux graphiques (barres de volume sous la courbe de
  cours correspondante) assure par une largeur d'axe Y fixe partagee
  (`afterFit`, constante `LARGEUR_AXE_Y_GRAPHIQUE`) plutot que la largeur
  auto-calculee de Chart.js a partir des libelles de CET axe (qui aurait
  divergé entre les deux graphiques : prix en EUR vs volumes compacts).
  Voir `DESIGN.md` § Volume echange sur le graphique.
- **Verification reelle** :
  - `node --test test/*.test.js` : 49/49 verts (contrat inchange en
    nombre de tests, 1 test renomme/reecrit pour le nouveau comportement
    403, 4 sites de test migres vers le nouvel endpoint unique,
    `db-migration.test.js` entierement reecrit).
  - Demarrage reel du serveur (`GET /`/`GET /login.html`/`GET /app.js`/
    `GET /styles.css` -> 200).
  - Parcours Playwright reel (Chromium local, viewport 390x844, Chart.js
    servi depuis un paquet npm local le temps du test via interception
    de requete - le CDN `jsdelivr` est bloque par la politique reseau du
    bac a sable, meme limite que la Session 30) : inscription, ajout
    d'une valeur, ouverture de son graphique, verification DOM que
    `#volumeCanvas` existe et que les rectangles de
    `#graphiqueContainer`/`#graphiqueVolumeContainer` partagent
    exactement les memes bornes gauche/droite (alignement pixel-perfect
    confirme, pas seulement visuel), capture d'ecran en periode 1M puis
    apres bascule vers 1A (le graphique de volume se met a jour sans
    erreur), meme parcours rejoue en `colorScheme: 'dark'` pour verifier
    la lisibilite des couleurs de barres sur le theme sombre. Aucune
    erreur console sur l'ensemble du parcours.
- Version : `server/package.json`/`config.yaml` 1.9.2 -> 1.9.3
  (increment PATCH - defaut de la regle, aucune demande explicite
  d'increment MINEUR malgre la nouvelle fonctionnalite visible),
  journalise dans `CHANGELOG.md`.
- Compteur `BACKLOG.md` : 2/5 -> 3/5.
