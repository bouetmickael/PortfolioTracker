# CLAUDE.md — Point d'entrée

> Ce fichier est lu automatiquement par Claude Code en début de session
> (racine du dépôt et `.claude/`). Il référence les autres documents de
> `.claude/` par pointeur, sans dupliquer leur contenu : en cas d'écart
> entre ce fichier et un document référencé, **le document propriétaire
> fait foi**.

@DESIGN.md

`DESIGN.md` fait foi sur toute question d'UI (palette, typographie,
composants) — ne pas y déroger sans consulter ce fichier.

## Présentation du projet

Portfolio Tracker est un outil personnel de suivi de portefeuille (actions
et warrants CTO BoursoBank), sous forme de PWA (Progressive Web App)
auto-hébergée, sans aucun service Firebase. Il s'adresse à un usage
individuel/familial restreint (2-3 utilisateurs connus), déployé sur un
Raspberry Pi (Home Assistant OS ou Linux générique). Il permet de suivre
des cours en quasi temps réel, de recevoir des alertes de seuil par email
et de consulter des graphiques historiques.

## Stack technique & architecture

Voir `ARCHITECTURE.md` (stack réelle, découpage en couches, arborescence,
conventions de code) — ne pas dupliquer ici.

## Règles de langue

Voir `ARCHITECTURE.md` §4 pour la convention observée dans le code
(commentaires/UI en français, identifiants mélangeant français du domaine
métier et anglais technique générique, aucun émoji ni caractère spécial).

## Méthode de travail & branche git

La méthode de travail générique (cycle de session, cycle de revue de dette
technique, workflow git, outillage) est décrite dans `METHOD.md` — la
lire intégralement à chaque session.

**Branche d'intégration unique de ce projet : `main`.** Tout
développement est livré sur `main`, sauf autorisation explicite de
l'utilisateur pour un besoin ponctuel. Si l'environnement impose une
branche technique temporaire (ex. Claude Code sur le web, branches
`claude/...`), appliquer la procédure de `METHOD.md` §5 (rapatriement
immédiat du contenu de `main`).

**Exception à `METHOD.md` §5 pour ce projet : fusion vers `main` sans
demander de feu vert.** L'utilisateur a explicitement demandé (session du
2026-07-24) de fusionner (fast-forward) toute branche technique
`claude/...` vers `main` dès que le travail est prêt, sans attendre de
confirmation à chaque fois. Continuer de committer/pousser sur la branche
technique au fil de la session comme d'habitude ; la fusion vers `main`
et son push peuvent suivre automatiquement, sans étape de confirmation
supplémentaire.

## Règles métier

Voir `BUSINESS_RULES.md` (isolation des données par utilisateur,
authentification, anti-répétition des alertes, intégrité des cours,
sécurité opérationnelle).

## Périmètre fonctionnel

Voir `SPECIFICATION_FONCTIONNELLE.md` (parcours utilisateur, écrans,
comportements attendus).

## Avancement & backlog

Voir `BACKLOG.md` (fonctionnalité en cours, compteur de sessions depuis la
dernière revue de dette technique, backlog produit) et `TODO.md` (journal
détaillé des sessions).

## Déploiement

Voir `DOCKER.md` (deux modes : Home Assistant Add-on et Docker Compose,
variables d'environnement, vérification).

## Historique des revues de dette technique

### 2026-07-24 — Revue n°1 (première revue du projet)

- **Portée** : diff cumulé depuis le tout premier commit du dépôt jusqu'à
  `HEAD` (`git diff 527d37d..HEAD`), c'est-à-dire l'intégralité du code
  applicatif actuel (`server/`, `public/`, hors `public/vendor/` et
  `.claude/*.md`) — aucune revue n'ayant eu lieu avant celle-ci. Outillage
  utilisé : `/simplify` (4 agents de revue en parallèle : réutilisation,
  simplification, efficacité, altitude).
- **Correctifs appliqués** (risque faible, comportement inchangé,
  vérifiés par un parcours API réel — register/login/CRUD valeurs et
  alertes/logout sur un serveur local) :
  - `GET /api/auth/me` (`server/routes/auth.js`) utilise désormais le
    middleware partagé `requireAuth` au lieu de dupliquer la vérification
    de session en ligne.
  - Extraction de `normalizeTicker()` (`server/ticker.js`), utilisée dans
    `server/routes/valeurs.js` et `server/routes/alertes.js` à la place de
    trois occurrences séparées de `trim().toUpperCase()`.
  - Simplification de `checkAuthAndRedirect` (`public/auth.js`) : une
    seule branche de redirection au lieu de la dupliquer dans le chemin
    `!res.ok` et dans le `catch`.
- **Correctifs reportés** (plus profonds ou risqués, à traiter dans une
  session dédiée future, pas dans ce cycle) :
  - Format de réponse API en map (`toValeursMap`/`toAlertesMap`) hérité de
    Firebase Realtime Database, immédiatement reconverti en tableau côté
    client (`public/app.js`) — changer la forme de la réponse API est un
    changement de contrat, pas une simplification locale.
  - Liste des alertes toujours rendue en manipulation DOM directe
    (`displayAlertes`/`createAlerteCard` dans `public/app.js`), à côté de
    la liste des valeurs déjà migrée sur le store Alpine — extension du
    store envisageable mais hors périmètre d'un correctif à risque faible.
  - Logique de récupération Yahoo Finance dupliquée entre
    `server/jobs/prices.js` et `server/routes/chart.js` (URL, fetch,
    validation de `chart.result` chacun avec sa propre garde).
  - Appels réseau/SMTP séquentiels dans les jobs `server/jobs/prices.js`
    et `server/jobs/alerts.js` (boucle `for...await` sur des tickers/
    alertes indépendants) — passer en parallèle changerait le
    comportement sous charge (risque de blocage par Yahoo Finance).
  - Absence de cache sur `GET /api/chart/:ticker` (chaque ouverture de
    graphique refait un appel Yahoo Finance identique).
  - Absence de middleware Express centralisé de gestion d'erreurs
    (`chart.js` est la seule route avec un `try/catch` ; `valeurs.js` et
    `alertes.js` n'en ont pas et retomberaient sur la page d'erreur HTML
    par défaut d'Express en cas d'erreur inattendue).
