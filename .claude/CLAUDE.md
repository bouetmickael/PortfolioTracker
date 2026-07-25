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

### 2026-07-25 — Revue n°2

- **Portée** : diff cumulé depuis la revue n°1 jusqu'à `HEAD`
  (`git diff bb0790f..HEAD -- server/ public/` hors `public/vendor/` et
  `.claude/*.md`), couvrant Session B (sections + glisser-déposer), la
  refonte visuelle + thème clair/sombre, et les deux correctifs directs
  (poignée de glisser-déposer dédiée, modales prompt/confirm). Outillage
  utilisé : `/simplify` (4 agents en parallèle : réutilisation,
  simplification, efficacité, altitude).
- **Correctifs appliqués** (risque faible, comportement inchangé, vérifiés
  par tests unitaires (`npm test`, 12/12) et un parcours réel serveur +
  navigateur — register/login, création/suppression de sections avec
  vérification de l'`ordre` attribué, réordonnancement glisser-déposer,
  bascule thème clair/sombre) :
  - Extraction de `nextOrdre()` (`server/ordre.js`), utilisée dans
    `server/routes/sections.js` (création, suppression avec repli) et
    `server/routes/valeurs.js` (création) à la place de trois occurrences
    séparées du calcul `SELECT MAX(ordre)... + 1`.
  - `backfillSectionsParDefaut()` (`server/db.js`) enveloppée dans
    `db.transaction(...)`, alignée sur le même pattern que
    `sections.js`/`auth.js` — évitait auparavant un commit disque
    implicite par ligne insérée/mise à jour à chaque démarrage du
    serveur.
  - Extraction de `getTheme()` (`public/app.js`), remplace trois lectures
    séparées de `document.documentElement.getAttribute('data-theme')`
    (bascule du thème, icône du bouton, couleurs du graphique Chart.js).
  - Extraction de `marquerSortableInit()` (`public/app.js`), factorise la
    garde d'initialisation dupliquée entre `initSortableSections()` et
    `initSortableValeurs()`.
  - `initSortableValeurs()` (`public/app.js`) : remplacement d'un
    `store.valeurs.find(...)` par ticker (O(n) par ticker déplacé, donc
    O(n²) sur un glisser-déposer multi-valeurs) par une `Map` construite
    une fois par `onEnd`.
- **Correctifs reportés** (plus profonds ou risqués, à traiter dans une
  session dédiée future, pas dans ce cycle) :
  - Poignée de glisser-déposer des **sections** (`.valeurs-section-nom`,
    `public/index.html`/`app.js`) : contrairement aux lignes de valeurs
    (correctif dédié v1.3.1), le glisser-déposer d'une section se
    déclenche encore depuis le titre cliquable (qui sert aussi à
    replier/déplier) et n'a pas de `touch-action: none` — même risque de
    conflit avec le scroll tactile mobile que celui déjà corrigé pour les
    valeurs. Nécessite l'ajout d'une poignée dédiée (icône `icon-grip`)
    dans l'en-tête de section, donc une modification visuelle documentée
    dans `DESIGN.md`, hors périmètre d'un correctif de dette technique à
    risque faible.
  - Duplication de forme entre `showPrompt()`/`showConfirm()`
    (`public/app.js`) : deux résolveurs de `Promise` à emplacement unique
    (`promptResolve`/`confirmResolve`) suivant le même patron (ouvrir la
    modale, stocker le résolveur, résoudre-et-fermer, gérer `Échap`).
    Unifiables en un mécanisme générique unique, mais la fusion change la
    forme du code autour de la résolution/l'`Échap` des deux modales
    (risque de régression sur une interaction utilisateur directe) —
    à traiter avec un test manuel dédié dans une session à part.
  - Duplication de forme entre `ajouterSection()`/`renommerSection()`/
    `supprimerSection()` (`public/app.js`) : même squelette
    `showLoader`/`try`/`catch`/`finally`/toast, déjà présent avant cette
    revue pour `ajouterValeur()`/`supprimerValeur()`/`creerAlerte()`/
    `supprimerAlerte()` (convention établie du projet, pas une régression
    de cette session) — une factorisation toucherait 7 fonctions et leurs
    messages d'erreur, à évaluer dans une session dédiée plutôt qu'en
    correctif ponctuel.
  - `Alpine.store('portfolio').valeursDeSection()` (`public/app.js`) :
    refiltre et retrie `valeurs` à chaque appel (appelé plusieurs fois par
    rendu réactif Alpine, plus dans `persisterOrdre()`) plutôt que de
    dériver une structure groupée une seule fois par changement de
    `valeurs`/`sections`. Impact réel négligible à l'échelle de ce projet
    personnel (quelques dizaines de valeurs au plus), mais toucherait le
    modèle réactif Alpine — à traiter avec prudence, pas en correctif
    rapide.
  - Correctifs reportés de la revue n°1 toujours non traités (format de
    réponse API en map, alertes en manipulation DOM directe, logique
    Yahoo Finance dupliquée entre `prices.js`/`chart.js`, appels
    réseau/SMTP séquentiels dans les jobs, absence de cache sur
    `GET /api/chart/:ticker`, absence de middleware d'erreurs centralisé)
    — voir Revue n°1 ci-dessus, aucun n'a été adressé cette session.
