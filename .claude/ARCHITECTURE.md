# ARCHITECTURE.md — Stack technique, couches, conventions

> Fichier propriétaire de tout ce qui concerne la stack technique telle
> qu'implémentée, le découpage en couches, l'arborescence réelle du code et
> les conventions de développement. Voir `CLAUDE.md` pour le point d'entrée
> et `DOCKER.md` pour le déploiement.

## 1. Stack technique réelle

- **Backend** : Node.js (>=20), Express 4, CommonJS (`require`/`module.exports`,
  pas d'ESM, pas de TypeScript, pas de bundler/transpileur).
- **Base de données** : SQLite via `better-sqlite3` (accès synchrone, fichier
  unique, mode `WAL`, `foreign_keys = ON`).
- **Sessions** : `express-session`, store en mémoire du process (par défaut de
  la librairie, pas de store externe — voir §4 Points de vigilance).
- **Authentification** : comptes locaux email/mot de passe, hash `bcryptjs`.
  Pas d'OAuth/Google (retiré lors de la migration hors Firebase, voir
  `TODO.md`).
- **Tâches planifiées** : `node-cron` (deux jobs toutes les 2 minutes, voir
  §3).
- **Email** : `nodemailer` (SMTP optionnel).
- **Configuration** : `dotenv` (mode Docker Compose) ou traduction de
  `/data/options.json` (mode Home Assistant Add-on) — voir
  `server/load-addon-options.js` et `DOCKER.md`.
- **Frontend** : PWA en JavaScript vanilla + Alpine.js (v3, `public/vendor/
  alpine.min.js`, vendorisé localement — pas de CDN, pas de build step,
  pas de React/Vue/bundler). Choix motivé par le build de l'add-on qui
  s'exécute sur le Raspberry Pi lui-même (voir `DOCKER.md`) : Alpine
  s'installe comme un simple `<script defer>`, sans pipeline npm côté
  frontend. Le store central `Alpine.store('portfolio', ...)` (déclaré
  dans `public/app.js` via l'évènement `alpine:init`) pilote le rendu
  réactif (`x-for`/`x-show`/`x-text`) de la liste des valeurs suivies,
  désormais groupée par sections (`store.sections`, méthode
  `valeursDeSection()`), ainsi que des 3 tuiles d'indices de marché
  (`store.indices`, peuplé par `GET /api/indices`). La liste des alertes
  reste rendue en manipulation DOM directe (`displayAlertes`/
  `createAlerteCard`, `document.getElementById`, `innerHTML`) plutôt que
  par un `x-for` Alpine, mais les alertes elles-mêmes vivent désormais sur
  le store (`store.alertes`, peuplé par `chargerAlertes()`) avec un getter
  dérivé (`alertesActivesPour(ticker)`, utilisé par le composant « Alertes
  existantes sur le graphique » de `DESIGN.md`) plutôt qu'une variable
  globale reconstruite en effet de bord — migration partielle, la carte
  d'alerte elle-même n'est pas encore un `x-for`.
- **Glisser-déposer** : SortableJS (v1.15.7, `public/vendor/
  sortable.min.js`, vendorisé localement pour la même raison qu'Alpine —
  build sur le Raspberry Pi, pas de CDN). Deux instances par page :
  réordonnancement des sections (poignée dédiée
  `.valeurs-section-drag-handle`) et, une par section, déplacement des
  valeurs entre/dans les sections (`group: 'valeurs'` partagé). Après un
  `onEnd`, le DOM déjà déplacé par
  SortableJS est relu pour resynchroniser `Alpine.store('portfolio')`
  (évite tout conflit entre la réconciliation Alpine et les mutations DOM
  de SortableJS), puis l'ordre est persisté via `PUT /api/sections/
  reorder`.
- **Icônes** : SVG inline hand-écrites (pas de police d'icônes, pas de
  bibliothèque externe/CDN), définies une fois comme `<symbol>` dans un
  sprite caché en tête de `public/index.html` et référencées via `<svg
  class="icon"><use href="#icon-xxx"></use></svg>` — voir `DESIGN.md`
  pour le détail des composants et la liste des icônes.
- **Thème clair/sombre** : CSS variables + attribut `data-theme` sur
  `<html>`, basculé par `initTheme()` (`public/app.js`) et persisté en
  `localStorage`. Un script inline synchrone en tête de `public/
  index.html` applique le thème avant le premier rendu (anti-FOUC). Voir
  `DESIGN.md` pour la palette claire/sombre complète.
- **Graphiques** : Chart.js 4.4.0, chargé depuis un CDN (`jsdelivr`) dans
  `public/index.html`, pas de dépendance npm côté frontend.
- **Communication frontend/backend** : polling HTTP classique (`fetch`)
  toutes les 30 secondes (`public/app.js`), pas de WebSocket/SSE. Cookie de
  session (`connect.sid`, `httpOnly`, `sameSite=lax`).
- **Tests** : `node:test` (natif Node.js, aucune dépendance ajoutée),
  script `npm test` (`server/package.json`, exécute `node --test test/`
  depuis `server/`). Chaque fichier de test démarre une instance Express
  isolée (`app.listen(0)`) sur une base SQLite temporaire dédiée
  (`DB_PATH` surchargé avant le premier `require('../../app')`, voir
  `server/test/support/helpers.js`) et communique via `fetch` + gestion
  manuelle du cookie de session — pas de dépendance type `supertest`.

## 2. Arborescence réelle

```
.
├── Dockerfile                    # image commune aux deux modes de déploiement
├── docker-compose.yml            # packaging Linux générique (non-HAOS)
├── config.yaml, repository.yaml  # manifeste Home Assistant Add-on
├── .env.example                  # variables d'environnement (mode Docker Compose)
├── public/                       # frontend (PWA), servi tel quel par express.static
│   ├── index.html                # écran principal (valeurs, alertes, graphique)
│   ├── login.html                # écran de connexion/inscription
│   ├── api.js                    # wrapper fetch minimal (apiFetch)
│   ├── auth.js                   # connexion/inscription/déconnexion, garde de page
│   ├── app.js                    # logique applicative principale, polling, CRUD, Chart.js
│   ├── styles.css                # feuille de style unique (voir DESIGN.md)
│   ├── sw.js                     # service worker (cache offline des assets statiques)
│   ├── manifest.json             # manifeste PWA
│   ├── icons/                    # icônes PWA (192/512, provisoires — voir DESIGN.md)
│   └── vendor/                   # librairies tierces vendorisées (pas de CDN, pas de npm cote frontend)
│       ├── alpine.min.js          # Alpine.js v3, rendu réactif de la liste des valeurs suivies
│       └── sortable.min.js        # SortableJS v1.15.7, glisser-déposer sections/valeurs
└── server/                       # backend Node.js + Express
    ├── index.js                  # bootstrap : dotenv, options add-on, écoute HTTP(+HTTPS), cron
    ├── app.js                    # application Express (session, montage des routes, static, errorHandler)
    ├── db.js                     # ouverture SQLite + schéma (CREATE TABLE IF NOT EXISTS + migrations)
    ├── mailer.js                 # envoi d'email (SMTP optionnel, no-op sinon)
    ├── load-addon-options.js     # traduction /data/options.json -> variables d'environnement
    ├── yahooFinance.js           # squelette reseau bas niveau Yahoo Finance (fetch/ok/json)
    ├── valeurs.js                # logique valeurs partagee entre routes (mapping, creation/suppression, recherche)
    ├── partage.js                # controle d'acces aux sections partagees (rolesSection/roleSection/peutEcrire)
    ├── ordre.js                  # calcul du prochain `ordre` disponible (sections/valeurs)
    ├── ticker.js                 # normalizeTicker() (trim + majuscules)
    ├── indices.js                # liste fixe des indices de marche suivis (ticker/nom)
    ├── middleware/
    │   ├── auth.js                # requireAuth (garde de session sur les routes API)
    │   ├── asyncHandler.js        # wrapper route async -> next(err) (Express 4 ne le fait pas nativement)
    │   └── errorHandler.js        # middleware d'erreur centralise (filet de securite, reponse JSON)
    ├── routes/
    │   ├── auth.js                # /api/auth (register, login, logout, me)
    │   ├── valeurs.js              # /api/valeurs (CRUD + recherche des valeurs suivies)
    │   ├── alertes.js              # /api/alertes (CRUD des alertes de seuil)
    │   ├── sections.js              # /api/sections (CRUD sections, partages, valeurs de section, PUT /reorder)
    │   ├── users.js                  # /api/users (liste des comptes connus, pour le partage de section)
    │   ├── indices.js               # /api/indices (cours des indices de marche suivis)
    │   └── chart.js                 # /api/chart/:ticker (historique Yahoo Finance, cache memoire 60s)
    ├── jobs/
    │   ├── prices.js               # mise à jour des cours des valeurs + des indices (cron 2 min)
    │   ├── alerts.js                # vérification + envoi des alertes (cron 2 min)
    │   └── parallel.js               # traiterEnParallele() : Promise.allSettled partage par les 3 jobs ci-dessus
    └── test/                     # node:test (npm test), voir §1 Tests
        ├── support/helpers.js     # serveur de test isolé + DB SQLite temporaire + mocks Yahoo Finance
        ├── sections.test.js
        ├── indices.test.js
        ├── alertes.test.js
        ├── partage.test.js
        ├── chart.test.js
        ├── db-migration.test.js
        └── valeurs.test.js
```

## 3. Découpage en couches et flux

1. `server/index.js` charge `.env`/`options.json`, démarre le serveur HTTP
   (et HTTPS si `HTTPS_ENABLED=true` avec certificats présents dans
   `SSL_DIR`), puis planifie `updatePrices` et `checkAlerts` toutes les
   2 minutes (`node-cron`, timezone `Europe/Paris`).
2. `server/app.js` construit l'application Express : session cookie,
   montage des routeurs sous `/api/*`, puis sert `public/` en statique
   (`express.static`) pour tout le reste.
3. Chaque route sous `/api/valeurs`, `/api/alertes`, `/api/sections` et
   `/api/indices` passe par `middleware/auth.js` (`requireAuth`) qui exige
   `req.session.userId` ; le filtrage par `user_id` est fait
   explicitement dans chaque requête SQL (voir `BUSINESS_RULES.md`) —
   exception : `/api/indices` sert des données de marché globales,
   identiques pour tous les utilisateurs (voir `BUSINESS_RULES.md`
   § Indices de marché).
4. `server/jobs/prices.js` interroge l'endpoint public non officiel
   `query1.finance.yahoo.com` (via `server/yahooFinance.js`,
   `fetchYahooFinanceJson()`, squelette fetch/ok/json partagé par tous les
   appels Yahoo Finance du projet) pour chaque ticker distinct en base et
   met à jour `cours`/`variation`/`volume` ainsi que `avant_bourse_cours`/
   `avant_bourse_variation` (renseignés uniquement lorsque le ticker est en
   pré-ouverture au moment de l'appel, `NULL` sinon — voir `DESIGN.md` §
   Avant-bourse) via `updatePrices` (valeurs suivies par au moins un
   utilisateur) ainsi que les 3 indices de marché suivis
   (`updateIndices`, liste fixe `server/indices.js`, données globales non
   rattachées à un utilisateur) — les deux jobs et `server/jobs/alerts.js`
   traitent leurs items (tickers/alertes) en parallèle via
   `traiterEnParallele()` (`server/jobs/parallel.js`, `Promise.allSettled`,
   une erreur individuelle n'interrompt pas les autres) ;
   `server/routes/chart.js` interroge le même endpoint pour l'historique
   par période (1J/1S/1M/1A/Max), avec un cache mémoire de 60 secondes par
   ticker+période pour éviter un appel identique à chaque réouverture du
   graphique ; la réponse inclut aussi `previousClose` (clôture de la
   dernière séance précédente, `meta.previousClose`/`chartPreviousClose`),
   utilisé côté client pour la ligne de référence du graphique (voir
   `DESIGN.md` § Clôture de la veille sur le graphique).
5. `server/jobs/alerts.js` relit les alertes actives jointes aux valeurs et
   déclenche un email (`mailer.js`) quand un seuil est franchi (logique
   anti-répétition, voir `BUSINESS_RULES.md`).
6. Le frontend (`public/app.js`) ne consomme que l'API `/api/*` en polling
   HTTP toutes les 30 secondes ; aucune donnée n'est poussée par le
   serveur.
7. `server/app.js` monte `middleware/errorHandler.js` en dernier
   middleware : toute erreur non gérée explicitement par une route (ex.
   contrainte SQL levée de façon synchrone dans un handler async, capturée
   via `middleware/asyncHandler.js` qui transmet la rejection à `next()`)
   retombe sur une réponse JSON `{ error: ... }` plutôt que la page
   d'erreur HTML par défaut d'Express.

## 4. Conventions de code observées

- **CommonJS partout**, pas d'import ESM, pas de classes — style
  fonctionnel simple (fonctions + `module.exports`).
- **Conversion snake_case (SQLite) → camelCase (API JSON)** faite
  explicitement dans chaque route via une petite fonction de mapping
  (`toValeursArray`, `toAlertesArray`, `toPublicUser`) plutôt que par un ORM ou
  un mapper générique — respecter ce style si de nouvelles routes sont
  ajoutées.
- **Langue** : commentaires et messages utilisateur (UI, erreurs API) en
  français. Les identifiants de code mélangent français (les noms du
  domaine métier n'ayant pas d'équivalent naturel : `valeurs`, `alertes`,
  `ticker`, `cours`, `seuil`, ainsi que des fonctions comme
  `ajouterValeur`, `chargerAlertes`, `creerAlerte`) et anglais (termes
  techniques génériques : `requireAuth`, `toPublicUser`, `updatePrices`).
  Il n'y a pas de règle stricte imposée par le code existant : respecter le
  style déjà en place dans le fichier édité plutôt que d'en imposer un
  nouveau.
- **Pas d'accents ni de caractères spéciaux dans les chaînes de code**
  (commentaires, logs, messages) : le code existant est écrit sans accents
  (`Demarrage`, `deja`, `cree_le`) — convention à respecter par cohérence
  avec le style déjà en place, y compris dans les identifiants SQL
  (`cree_le`, `derniere_maj`).
- **Aucun émoji ni symbole spécial** dans le code, les commentaires, les
  chaînes de caractères ou le HTML (confirmé par un prompt de session
  passé, voir `TODO.md`).

## 5. Points de vigilance techniques connus

- **Source de cours (Yahoo Finance)** : `server/jobs/prices.js` et
  `server/routes/chart.js` appellent `query1.finance.yahoo.com`, un
  endpoint public non officiel et non contractuel, connu pour changer de
  comportement sans préavis (cookie/crumb de session, 401/429, format JSON
  modifié) et bloquer plus agressivement les IP de datacenter que les
  requêtes navigateur. En cas d'échec, l'erreur est loguée et **rien n'est
  écrit en base** (voir `BUSINESS_RULES.md`, règle « pas de valeur
  inventée »). Migration recommandée si le problème redevient récurrent :
  Alpha Vantage, Financial Modeling Prep ou Twelve Data (clé API gratuite
  avec quotas) — non fait à ce jour (choix explicite lors de la migration
  hors Firebase : traiter un problème à la fois).
- **Store de session en mémoire** : `express-session` utilise son store par
  défaut (en mémoire du process). Un redémarrage du conteneur déconnecte
  tous les utilisateurs. C'est un compromis accepté pour un usage
  personnel à 2-3 utilisateurs, pas un bug à corriger en ajoutant un store
  externe (Redis, etc.) sans que ce soit devenu un vrai problème d'usage.
- **SQLite et stockage persistant** : base = fichier unique
  (`/data/portfolio.db` dans le conteneur, `DB_PATH` en dehors de Docker).
  Sauvegarde = copier ce fichier (le service peut rester démarré, SQLite
  gère les accès concurrents via WAL). Voir `DOCKER.md` pour le mappage du
  volume selon le mode de déploiement.
