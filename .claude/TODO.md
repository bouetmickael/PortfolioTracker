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
