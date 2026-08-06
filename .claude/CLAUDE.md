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

**Usage exclusivement smartphone (demande explicite utilisateur,
2026-07-25).** L'application n'a pas vocation à être consultée depuis un
navigateur de bureau ou une tablette : la PWA est installée et utilisée
sur téléphone uniquement. Conséquence directe sur `DESIGN.md` (voir §
Responsive) : aucune mise en page « desktop » à préserver ni à faire
cohabiter avec un affichage mobile — l'UI cible directement un viewport
de smartphone, sans point de rupture (`@media`) séparé.

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

### 2026-07-25 — Revue n°3

- **Portée** : diff cumulé depuis la revue n°2 jusqu'à `HEAD`
  (`git diff d1c9718..HEAD -- server/ public/` hors `public/vendor/` et
  `.claude/*.md`), couvrant Session 11 (badges d'alerte), Session 12
  (partage RW de section) et Session 13 (tuiles d'indices de marché).
  Correction de portée par rapport au prompt de session initial (qui
  indiquait `358c510..HEAD`, en réalité le commit de Session 12
  elle-même — aurait exclu la Session 11) : le commit de clôture de la
  revue n°2 est `d1c9718`, utilisé comme borne basse à la place.
  Outillage utilisé : `/simplify` (4 agents en parallèle : réutilisation,
  simplification, efficacité, altitude).
- **Correctifs appliqués** (risque faible, comportement inchangé,
  vérifiés par tests unitaires (`npm test`, 29/29) et un parcours API réel
  — register de deux comptes, création de valeur, création d'alerte et
  vérification de `hasAlerte`, partage RW d'une section, ajout d'une
  valeur par l'invité dans la section partagée, `GET /api/indices`) :
  - Extraction de `server/valeurs.js` (`HAS_ALERTE_SUBQUERY`,
    `toValeurJson`/`toValeursMap`), utilisé par `GET /api/valeurs`
    (`server/routes/valeurs.js`) et `GET /api/sections/:id/valeurs`
    (`server/routes/sections.js`) à la place de deux copies identiques
    de la sous-requête `EXISTS(...) AS has_alerte` et de la fonction de
    mapping ligne SQL → JSON (`toValeursMap`/`toValeursSectionMap`).
  - Fusion de `ouvrirAjoutValeurSection()`/`ouvrirAjoutValeurDefaut()`
    (`public/app.js`) en une seule `ouvrirAjoutValeur(section = null)`,
    appelants mis à jour (`public/index.html`, listeners `addValeurBtn`/
    `fab` passés en fermeture `() => ouvrirAjoutValeur()` pour éviter que
    l'objet `Event` du listener ne soit reçu comme paramètre `section`).
  - `formatCours()` (`public/app.js`) délègue désormais à
    `formatCoursDevise(cours)` (défaut `'EUR'`) au lieu de dupliquer le
    même corps.
  - `server/routes/indices.js` : `SELECT rowid, *` → `SELECT *` (le tri
    `ORDER BY rowid` ne nécessite pas de sélectionner la colonne, jamais
    lue par le mapper de réponse).
  - Extraction de `columnExists(table, column)` (`server/db.js`),
    remplace deux occurrences séparées du motif `PRAGMA table_info(...)
    → .map(name) → .includes(...)` (migrations `valeurs.section_id`/
    `ordre` et `alertes.valeur_id`).
- **Correctifs reportés** (plus profonds ou risqués, à traiter dans une
  session dédiée future, pas dans ce cycle) :
  - Trois vérifications de propriété de section coexistent dans
    `server/routes/sections.js` : le nouveau helper `sectionPossedee()`
    (utilisé par les trois routes `/:id/partages*`), la condition inline
    `UPDATE sections SET ... WHERE id = ? AND user_id = ?` de `PUT /:id`,
    et le `SELECT ... WHERE id = ? AND user_id = ?` inline de
    `DELETE /:id`. Unifiables sur un seul mécanisme, mais `PUT`/`DELETE`
    encodent actuellement la vérification de propriété **dans** la
    requête de mutation elle-même (contrôle atomique) — remplacer par un
    contrôle préalable via `sectionPossedee()` puis une mutation séparée
    changerait ce motif d'atomicité, pas un simple renommage. À évaluer
    avec prudence dans une session dédiée.
  - `rolesSection()` (`server/partage.js`) recalcule la carte d'accès
    complète de l'utilisateur (toutes ses sections + toutes les sections
    partagées avec lui) à chaque appel de `GET/POST/DELETE
    /api/sections/:id/valeurs`, alors que seule l'entrée d'un id précis
    est utilisée. Sans impact réel à l'échelle du projet (2-3 comptes,
    quelques sections chacun), mais une requête ciblée sur le seul id
    demandé serait plus propre — changement de la logique SQL
    d'autorisation, pas un correctif ponctuel à risque faible.
  - `updateIndices()` (`server/jobs/prices.js`, Session 13) répète la
    boucle séquentielle `for...await` par ticker déjà présente dans
    `updatePrices()` (même structure try/catch/log par itération) au
    lieu de partager un helper commun paramétré par la requête de mise à
    jour — aggrave la dette déjà signalée en Revue n°1 (logique Yahoo
    Finance dupliquée entre jobs/routes). Paralléliser les 3 appels
    (`Promise.allSettled`) réduirait le temps du job, mais la Revue n°1 a
    explicitement écarté ce type de changement pour `prices.js`/
    `alerts.js` (risque de blocage par Yahoo Finance sous charge
    parallèle) — traité avec la même prudence ici plutôt que corrigé
    isolément pour la seule Session 13.
  - `initSortableValeurs()`/`initSortableValeursPartagees()` et
    `persisterOrdre()`/`persisterOrdreSectionPartagee()`
    (`public/app.js`, Session 12) : même duplication de forme que celle
    déjà repérée en Revue n°2 pour `showPrompt()`/`showConfirm()`
    (mécanisme générique envisageable mais fusion risquant une
    régression sur une interaction de glisser-déposer directe) — à
    traiter avec un test manuel dédié dans une session à part, pas dans
    ce cycle.
  - Branche défensive `if (!acces.has(section.id))` dans `rolesSection()`
    (`server/partage.js`), commentée par son propre auteur comme
    normalement inatteignable (un propriétaire ne devrait jamais
    apparaître aussi comme cible de partage de sa propre section) —
    laissée telle quelle, retrait non justifié par un gain clair.
  - Correctifs reportés des revues n°1 et n°2 toujours non traités
    (format de réponse API en map, alertes en manipulation DOM directe,
    logique Yahoo Finance dupliquée `prices.js`/`chart.js`/désormais
    `updateIndices()`, appels réseau/SMTP séquentiels dans les jobs,
    absence de cache sur `GET /api/chart/:ticker`, absence de middleware
    d'erreurs centralisé, poignée de glisser-déposer des sections,
    duplication `ajouterSection()`/`renommerSection()`/
    `supprimerSection()` et consœurs, `valeursDeSection()` recalculé à
    chaque rendu) — voir Revues n°1 et n°2 ci-dessus, aucun n'a été
    adressé cette session.

### 2026-07-25 — Revue n°4

- **Portée** : diff cumulé depuis la revue n°3 jusqu'à `HEAD`
  (`git diff 31b310f..HEAD -- server/ public/` hors `public/vendor/` et
  `.claude/*.md`), couvrant Session 15 (tuiles d'indices cliquables/
  compactes, v1.6.1), Session 16 (périmètre smartphone-only, CSS
  responsive simplifiée à un seul layout mobile, v1.6.2) et Session 17
  (création d'alerte par glisser-déposer sur le graphique, v1.7.0).
  Correction de portée par rapport au prompt de session initial (qui
  indiquait `e55b83a..HEAD`, en réalité le commit de Session 16
  elle-même — aurait exclu les Sessions 15 et 16) : le commit de clôture
  de la revue n°3 est `31b310f` (« Session 14 - technical debt review
  n3 »), utilisé comme borne basse à la place — même type de correction
  déjà appliqué en Revue n°3. Outillage utilisé : `/simplify` (4 agents
  en parallèle : réutilisation, simplification, efficacité, altitude).
- **Correctifs appliqués** (risque faible, comportement inchangé — sauf
  le dernier point qui corrige un état interne incohérent sans jamais
  avoir été observable par l'utilisateur en usage normal —, vérifiés par
  tests unitaires (`npm test`, 29/29) et un démarrage réel du serveur
  (`GET /`/`GET /login.html` → 200) ; pas de test manuel navigateur du
  geste de glisser-déposer lui-même cette session, correctifs limités à
  du JS non visuel) :
  - Suppression de `annulerPlacementAlerte()` (`public/app.js`), pur
    relais vers `fermerPlacementAlerte()` avec un seul appelant ; le
    bouton Annuler (`public/index.html`) appelle désormais directement
    `fermerPlacementAlerte()`.
  - `mettreAJourPlacementDepuisEvent()` (`public/app.js`) : suppression
    du double clampage (bornage en espace pixel puis re-bornage en
    espace valeur) — pour une échelle Chart.js linéaire (fonction
    monotone), les deux bornages produisent mathématiquement le même
    résultat final ; conservé uniquement le bornage en espace valeur
    (`Math.max(min, Math.min(max, brut))`).
  - `alerteOnPointerDown()`/`alerteOnPointerMove()`/`alerteOnPointerUp()`
    (`public/app.js`) : le rectangle du conteneur du graphique
    (`getBoundingClientRect()`, potentiellement coûteux — force un
    recalcul de layout) est désormais calculé une seule fois par geste
    de glisser-déposer (`alerteOnPointerDown`) au lieu d'être recalculé
    à chaque évènement `pointermove`.
  - `closeAllModals()` (`public/app.js`) appelle désormais
    `fermerPlacementAlerte()` : fermer la modale graphique via l'icône
    `icon-x`/le fond semi-transparent pendant le mode placement d'une
    alerte ne laissait auparavant ni les écouteurs `pointerdown/move/up/
    cancel` sur `#graphiqueContainer`, ni `placementAlerteActif` remis à
    `false` (seul le chemin `ouvrirPlacementAlerte()`/appel suivant à
    `openGraphique()` les réinitialisait). Sans impact observable en
    usage normal (`openGraphique()` réinitialise déjà l'état à la
    réouverture), corrigé par cohérence défensive plutôt que pour un
    bug symptomatique constaté.
- **Correctifs reportés** (plus profonds ou risqués, à traiter dans une
  session dédiée future, pas dans ce cycle) :
  - `.alerte-drag-trigger`/`.alerte-drag-cancel` (`public/styles.css`)
    redéclarent intégralement le motif visuel de `.btn-icon-small`
    (fond transparent, `border-radius: 50%`, centrage flex, survol
    `--bg-secondary`, couleur `--text-secondary`) ; `.alerte-drag-
    confirm` redéclare celui de `.btn-icon-gold` (fond `--primary`,
    survol `--primary-dark`, 36×36). Fusionnables en ajoutant les
    classes `btn-icon-small`/`btn-icon-gold` aux boutons et en ne
    gardant dans `.alerte-drag-*` que le positionnement (`position:
    absolute`, `bottom`, `left`/`right`) — mais `.btn-icon-small` dérive
    sa taille du `padding` (pas de `width`/`height` fixes) alors que les
    boutons de glisser-déposer ont une taille explicite 36×36 : fusionner
    risquerait un léger changement de gabarit visuel, à vérifier
    manuellement au navigateur plutôt qu'à corriger en aveugle dans ce
    cycle (même prudence que la fusion déjà reportée en Revue n°2 pour
    `showPrompt()`/`showConfirm()`).
  - Le mode placement (`public/app.js`/`public/styles.css`) pilote sa
    visibilité par deux mécanismes redondants tenus manuellement en
    synchronisation : la classe `.placement-actif` sur
    `#graphiqueWrapper` **et** cinq attributs `hidden` togglés
    individuellement dans `ouvrirPlacementAlerte()`/
    `fermerPlacementAlerte()` (`alerteDeclencheur`/`alerteAnnuler`/
    `alerteConfirmer`/`alerteLigne`/`alerteBadge`). Unifiable en pilotant
    la visibilité des cinq éléments uniquement par la classe CSS
    (sélecteurs `#graphiqueWrapper.placement-actif .alerte-drag-*` et
    leur inverse), mais change le mécanisme d'affichage lui-même —
    risque de régression visuelle sur une interaction directe, à valider
    par un test manuel dédié plutôt qu'en correctif à l'aveugle.
  - `chargerGraphique()` (`public/app.js`), fonction générique de
    (re)construction du graphique Chart.js partagée par valeurs et
    indices, contient une branche spécifique à la fonctionnalité
    « alerte depuis le graphique » (`if (placementAlerteActif) {
    positionnerLigneAlerte(...) }`) plutôt que de rester ignorante de
    cette fonctionnalité aval. Piste plus profonde : faire émettre un
    évènement générique par `chargerGraphique()` (ex.
    `chart:loaded`) et laisser le code de placement d'alerte s'y
    abonner. Effet de bord repéré au passage (pas corrigé, hors
    périmètre d'un correctif de dette technique — relève plutôt d'une
    revue de correction) : `positionnerLigneAlerte()` réutilise
    `valeurPlacement` sans le re-clamper aux nouveaux `min`/`max` de
    l'échelle après un changement de période, contrairement à
    `mettreAJourPlacementDepuisEvent()` qui clampe — changer de période
    en cours de placement peut laisser la ligne/pastille hors du
    graphique visible pour la nouvelle période.
  - Correctifs reportés des revues n°1/n°2/n°3 toujours non traités
    (format de réponse API en map, alertes en manipulation DOM directe,
    logique Yahoo Finance dupliquée `prices.js`/`chart.js`/
    `updateIndices()`, appels réseau/SMTP séquentiels dans les jobs,
    absence de cache sur `GET /api/chart/:ticker`, absence de middleware
    d'erreurs centralisé, trois vérifications de propriété de section
    dans `sections.js`, `rolesSection()` recalculé pour un seul id,
    poignée de glisser-déposer des sections, duplication
    `ajouterSection()`/`renommerSection()`/`supprimerSection()` et
    consœurs, `valeursDeSection()` recalculé à chaque rendu, duplication
    `showPrompt()`/`showConfirm()`, duplication
    `initSortableValeurs()`/`initSortableValeursPartagees()` et
    `persisterOrdre()`/`persisterOrdreSectionPartagee()`) — voir Revues
    n°1/n°2/n°3 ci-dessus, aucun n'a été adressé cette session.

### 2026-07-26 — Revue n°5

- **Portée** : diff cumulé depuis la revue n°4 jusqu'à `HEAD`
  (`git diff 87fdb5a..HEAD -- server/ public/` hors `public/vendor/` et
  `.claude/*.md`), couvrant Session 19 (alertes existantes affichées sur
  le graphique, v1.8.0), Session 20 (densité de la liste des valeurs
  suivies, v1.8.1) et Session 21 (zoom désactivé + tuiles d'indices
  recompactées, v1.8.2). Correction de portée par rapport au prompt de
  session initial (qui indiquait un commit de clôture à vérifier) : le
  commit de clôture de la revue n°4 est `87fdb5a` (« Session 18 -
  technical debt review n4... ») et non `31b310f` (commit d'ouverture de
  ce même cycle, déjà utilisé à tort comme borne à la revue n°4 — même
  type de correction de portée que celle déjà appliquée en Revue n°3 et
  Revue n°4). Diff limité à `public/app.js`/`public/styles.css` (+
  `public/index.html`/`public/login.html` pour le zoom, + bump de version
  dans `server/package.json` — rien côté logique serveur sur ce cycle).
  Outillage utilisé : `/simplify` (4 agents de revue en parallèle :
  réutilisation, simplification, efficacité, altitude).
- **Correctifs appliqués** (risque faible, comportement inchangé,
  vérifiés par tests unitaires (`npm test`, 29/29) et un démarrage réel du
  serveur (`GET /`/`GET /login.html`/`GET /app.js`/`GET /styles.css` →
  200) ; pas de test manuel navigateur du rendu des alertes sur le
  graphique cette session — correctifs vérifiés pour préserver strictement
  les mêmes classes CSS, mêmes propriétés de style et même contenu texte
  qu'avant, sans changement de mécanisme visuel) :
  - `alertesParTicker` (`public/app.js`), index `ticker -> [seuils]`
    construit par boucle `forEach` avec insertion conditionnelle, remplacé
    par `alertesActives`, un tableau plat construit en une expression
    (`alertesArray.map(...)`) ; `afficherAlertesGraphique()` filtre ce
    tableau par ticker à la demande (`alertesActives.filter(a => a.ticker
    === ticker)`) plutôt que de lire un index pré-groupé. Même résultat
    pour le seul ticker consommé, sans structure d'index à maintenir.
  - `displayAlertes()` (`public/app.js`) : suppression de la boucle
    `forEach` dédiée à la construction de l'index (désormais une
    expression `map()` unique en tête de fonction, voir point précédent)
    — un passage sur `alertesArray` en moins avant la boucle de rendu des
    cartes.
  - `afficherAlertesGraphique()` (`public/app.js`) : `chartInstance.
    scales.y` mis en cache dans une variable locale (`yScale`) avant la
    boucle sur les seuils, au lieu d'être ré-accédé à chaque itération
    (`yScale.getPixelForValue(seuil)`) ; construction de `seuils` par une
    expression `flatMap` (`[seuilHaut, seuilBas].filter(Boolean)`) au lieu
    d'une boucle `forEach` avec deux `push` conditionnels ; les trois
    blocs de création d'élément DOM dupliqués (`createElement`/
    `className`/style/texte/`appendChild` pour la ligne, la pastille et
    le repère hors-limite) factorisés dans un helper local
    `ajouterOverlayEl(className, style, texte)`, appelé trois fois avec
    des paramètres différents.
  - `.alerte-existante-badge`/`.alerte-hors-limite` (`public/styles.css`)
    fusionnées en une base commune (`position`, `right`, `background`,
    `border`, `color`, `font-weight`, `padding`, `border-radius`,
    `pointer-events`, `white-space`, `z-index`, strictement identiques
    entre les deux sélecteurs), chacune ne conservant que sa spécificité
    (`transform`/`font-size: 11px` pour la pastille ancrée sur la ligne de
    seuil, `font-size: 10px` pour le repère hors-limite) — CSS calculé
    strictement identique avant/après (propriétés fusionnées sans
    changement de valeur), donc sans risque visuel contrairement aux
    fusions CSS déjà écartées en Revues n°2/n°4 (où les gabarits
    calculés différaient réellement entre les sélecteurs concernés).
- **Correctifs reportés** (plus profonds ou risqués, à traiter dans une
  session dédiée future, pas dans ce cycle) :
  - `.alerte-drag-line`/`.alerte-existante-ligne` et `.alerte-drag-badge`
    (`public/styles.css`) partagent le même patron visuel (« ligne
    pointillée pleine largeur » / « pastille de prix ancrée sur le
    graphique ») que `.alerte-existante-badge`/`.alerte-hors-limite`
    ci-dessus, mais avec plusieurs propriétés réellement différentes
    (épaisseur de trait, couleur, z-index, ancrage gauche/droite,
    présence ou non d'un `transform`) plutôt que 2-3 comme le couple déjà
    fusionné cette session — une fusion réduirait moins de duplication
    tout en portant le même risque déjà écarté en Revue n°4 pour
    `.alerte-drag-trigger`/`.btn-icon-small` (gabarits calculés
    potentiellement divergents) : à vérifier manuellement au navigateur
    plutôt qu'à fusionner à l'aveugle dans ce cycle.
  - `afficherAlertesGraphique()` (`public/app.js`) réimplémente la
    logique « valeur → position pixel Y + libellé formaté »
    (`getPixelForValue` + `formatCours`) déjà présente dans
    `positionnerLigneAlerte()` (mode placement d'une nouvelle alerte),
    mais avec une stratégie de rendu différente (nœuds DOM créés/détruits
    à chaque appel, vs éléments fixes togglés par `hidden`) et une
    gestion des seuils hors bornes qui n'existe pas côté placement.
    Généraliser en un seul renderer paramétré (couleur, style de ligne,
    contenu du badge, gestion optionnelle du hors-limite) partagé par les
    deux fonctionnalités changerait un mécanisme utilisé par une
    interaction utilisateur directe (glisser-déposer sur le graphique) —
    à traiter avec un test manuel dédié dans une session à part, comme
    déjà noté en Revue n°4 pour ce même couple de fonctions.
  - `alertesActives` (`public/app.js`, ex-`alertesParTicker`) reste
    construit en effet de bord dans `displayAlertes()`, fonction de rendu
    DOM de la liste des cartes d'alerte, pour le seul bénéfice d'une
    fonctionnalité distincte (l'affichage des seuils sur le graphique) —
    ce correctif simplifie la structure interne sans changer ce
    couplage. Les alertes ne sont toujours pas portées par
    `Alpine.store('portfolio')` (dette déjà reportée en Revues n°1/n°2,
    « alertes en manipulation DOM directe ») ; un getter dérivé sur le
    store (sur le modèle de `valeursDeSection()`) rendrait cette donnée
    disponible proprement à tout consommateur présent ou futur, mais
    suppose la migration plus large déjà écartée à trois reprises.
  - `.valeur-actions .btn-icon-small { padding: 4px; }`
    (`public/styles.css`, Session 20) : override contextuel local plutôt
    qu'une variante de taille réutilisable du composant partagé
    `.btn-icon-small` (ex. `.btn-icon-xs`) — décision de nommage/API CSS,
    pas un correctif ponctuel à risque faible.
  - La densification de l'UI (Sessions 20 et 21, `.valeur-*`/`.stat-*`)
    ajuste `font-size`/`line-height`/`padding` sélecteur par sélecteur
    plutôt que via une échelle de tokens communs (ex. variables CSS
    `--font-size-xs`) — deuxième cycle consécutif où ce type de retouche
    se fait à la main ; une échelle partagée généraliserait mieux ce
    réglage récurrent, mais changerait la source de vérité de plusieurs
    dizaines de valeurs à la fois — hors périmètre d'un correctif à
    risque faible.
  - `line-height: 1.25` (`public/styles.css`, Session 20) répété
    individuellement sur cinq sélecteurs descendants de `.valeur-row`
    (`.valeur-nom`, `.valeur-sousligne`, `.valeur-footer`, `.valeur-cours`,
    `.valeur-variation`). Remonter cette déclaration une seule fois sur
    `.valeur-row` (héritée par tous les descendants texte) supprimerait
    la répétition, mais `.valeur-row` a aussi pour descendants
    `.valeur-avatar`, `.valeur-drag-handle`, `.badge-type`,
    `.badge-alerte` et `.valeur-actions`, qui n'ont **pas** été inclus
    dans la liste des sélecteurs retouchés par la Session 20 (ils
    restent donc sciemment à l'interligne global 1.5 du `body`) —
    remonter la déclaration changerait leur `line-height` calculé aussi,
    ce qui n'est plus un correctif à comportement strictement inchangé.
    Écarté pour cette raison plutôt que par prudence générique.
  - Correctifs reportés des revues n°1 à n°4 toujours non traités (liste
    inchangée, voir Revues n°1/n°2/n°3/n°4 ci-dessus) — aucun n'a été
    adressé cette session.

### 2026-07-26 — Revue n°6

- **Portée** : diff cumulé depuis la revue n°5 jusqu'à `HEAD`
  (`git diff 5c7ad7b..HEAD -- server/ public/ ':!public/vendor'`), soit
  le commit de clôture de la revue n°5 (« Session 22 - technical debt
  review n5... »). Correction de portée par rapport au prompt de session
  initial (qui indiquait « Sessions 25 à 27 ») : ce même intervalle de
  commits couvre en réalité aussi la Session 23 (logo de l'application,
  v1.8.3) et la Session 24 (densité des cartes d'alerte, v1.8.4),
  omises du prompt initial — même type de correction de portée que lors
  des revues n°3/n°4/n°5 précédentes. Portée réelle couverte : Session 23
  (v1.8.3), Session 24 (v1.8.4), Session 25 (validation ticker Yahoo
  Finance, v1.8.5) + correctif same-day (encodage URL du ticker, v1.8.6),
  Session 26 (recherche de valeur à l'ajout, v1.8.7) + correctif
  (v1.8.9), Session 27 (une même valeur dans plusieurs sections, v1.8.8).
  Outillage utilisé : `/simplify` (4 agents de revue en parallèle :
  réutilisation, simplification, efficacité, altitude), avec consigne
  explicite de porter une attention particulière aux mécanismes
  transversaux touchés par la Session 27 (contrat d'API en tableau,
  cascade de suppression liée au ticker, jointures d'alertes).
- **Correctifs appliqués** (risque faible, comportement inchangé,
  vérifiés par tests unitaires (`node --test test/*.test.js`, 44/44 —
  `npm test` échoue dans ce bac à sable avec `Cannot find module
  '.../server/test'` en résolvant `test/` comme motif de glob plutôt que
  comme répertoire, y compris sur `HEAD` non modifié : anomalie
  d'environnement préexistante, sans rapport avec cette session, non
  corrigée ici) et un parcours API réel sur un serveur local dédié
  (register, création d'une deuxième section, insertion directe en base
  de deux occurrences d'un même ticker avec une alerte active,
  suppression d'une occurrence puis de la dernière avec vérification de
  la cascade d'alerte, suppression d'une section avec fusion/déplacement
  vers la section de repli, exécution directe de `checkAlerts()` avec
  deux occurrences du même ticker en dépassement de seuil pour vérifier
  qu'un seul email est déclenché) :
  - Extraction de `supprimerValeurEtDetacherAlertes()` et
    `supprimerAlertesOrphelines()` (`server/valeurs.js`), remplace trois
    copies quasi identiques de la séquence « détacher `alertes.valeur_id`
    (FK), supprimer la ligne `valeurs`, supprimer les alertes du ticker
    si plus aucune occurrence ne subsiste » introduite en Session 27
    (`server/routes/valeurs.js` `DELETE /:id`, `server/routes/
    sections.js` `DELETE /:id/valeurs/:ticker` et la branche
    `tickerDejaDansFallback` de `DELETE /:id` — signalé indépendamment
    par les 3 agents réutilisation/simplification/altitude, les deux
    derniers sites portant même le commentaire « voir
    server/routes/valeurs.js pour le meme motif » constatant déjà la
    duplication au moment de l'écrire).
  - `server/routes/sections.js`, boucle de fusion de `DELETE /:id`
    (suppression d'une section) : la vérification « ce ticker est-il déjà
    dans la section de repli ? » était une requête SQL par valeur
    déplacée (N+1) ; remplacée par un unique `SELECT` des tickers de la
    section de repli chargés dans un `Set` avant la boucle (une section
    ne pouvant pas contenir deux fois le même ticker — contrainte
    `UNIQUE(user_id, ticker, section_id)` —, `valeursADeplacer` ne peut
    pas en ajouter un second en cours de boucle, donc le `Set` calculé
    une fois en amont reste valide pour toute la boucle).
  - `checkAlerts()` (`server/jobs/alerts.js`) : la jointure sur
    `valeurs` + `GROUP BY alertes.id` (introduite en Session 27 pour
    qu'une alerte dont le ticker est suivi dans plusieurs sections ne
    soit traitée/emailée qu'une fois) reposait sur un invariant non
    garanti par la requête elle-même (que toutes les occurrences d'un
    ticker partagent le même `cours` — vrai uniquement parce que
    `updatePrices()` met à jour `cours` par ticker, pas par ligne).
    Remplacée par une sous-requête corrélée (`cours` récupéré directement
    par `(SELECT ... LIMIT 1)`) accompagnée d'un `EXISTS(...)` explicite
    dans le `WHERE` pour préserver exactement le filtrage de l'ancienne
    jointure `INNER JOIN` (un alerte sans aucune ligne `valeurs`
    correspondante reste exclue plutôt que de récupérer un `cours`
    `NULL`, qui aurait pu déclencher une fausse alerte basse via la
    coercition JavaScript `null <= seuil`). Vérifié manuellement :
    exactement un email déclenché pour deux occurrences du même ticker
    en dépassement de seuil.
  - `sectionCibleAjoutPartagee` renommée `sectionCibleAjout`
    (`public/app.js`) : le nom mentionnait encore « Partagee » alors que
    cette variable cible aussi bien une section possédée qu'une section
    partagée en écriture depuis la Session 27 (le rôle de la section
    déterminant la route appelée par `ajouterValeur()`, déjà documenté
    par le commentaire adjacent) — renommage pur, 3 occurrences.
- **Correctifs reportés** (plus profonds ou risqués, à traiter dans une
  session dédiée future, pas dans ce cycle) :
  - `rechercherTickers()` (`server/valeurs.js`, Session 26) réimplémente
    le squelette `fetch(url)` → vérifier `response.ok` → `throw` →
    `response.json()` déjà présent dans `fetchYahooFinance()`
    (`server/jobs/prices.js`) et dans `server/routes/chart.js` —
    **aggrave** la dette déjà reportée aux revues n°1/n°3/n°4 (« logique
    Yahoo Finance dupliquée entre `prices.js`/`chart.js`/
    `updateIndices()` ») en ajoutant un troisième site quasi identique
    plutôt que de la résorber. Signalé par 2 agents (réutilisation,
    simplification) comme aggravation d'un item déjà connu, pas comme
    nouveau problème isolé — même prudence que lors des 3 cycles
    précédents où cet item a été identifié sans être corrigé.
  - `INSERT INTO valeurs (...)` à 11 colonnes dupliqué verbatim entre
    `server/routes/valeurs.js` (`POST /`) et `server/routes/sections.js`
    (`POST /:id/valeurs`), ainsi que toute la séquence qui l'entoure
    (vérification de doublon dans la section, `verifierTickerExiste`,
    `nextOrdre`) : préexistant à ce cycle mais dont l'empreinte a plus
    que doublé en Session 25 (ajout des colonnes `cours`/`variation`/
    `volume` issues de `priceData`, identiques dans les deux copies).
    Une factorisation (`creerValeur(db, {...})` partagée, symétrique à
    l'extraction de suppression appliquée cette session) est possible
    mais touche les deux routes d'ajout simultanément — à valider avec
    un test manuel dédié plutôt qu'en correctif à l'aveugle.
  - Le client (`public/app.js`, `ajouterValeur()`) décide lui-même de la
    route à appeler (`/api/valeurs` vs `/api/sections/:id/valeurs`)
    selon `section.role`, dupliquant côté client une décision
    d'autorisation qui pourrait être résolue côté serveur (un seul
    endpoint acceptant `{ ticker, type, nom, sectionId }` et déterminant
    lui-même si l'utilisateur a le droit d'écrire dans la section visée).
    Changement d'architecture (fusion de deux routes, contrat d'API),
    pas un correctif ponctuel à risque faible.
  - `alertes.valeur_id` (`server/db.js`) reste une colonne FK vestigiale
    depuis la Session 27 : plus aucune lecture ne s'appuie dessus (les
    alertes sont désormais rejointes par `(user_id, ticker)`, voir
    `HAS_ALERTE_SUBQUERY`/`checkAlerts()`), elle n'existe plus que pour
    être détachée manuellement avant chaque suppression d'une ligne
    `valeurs` (voir le correctif de factorisation ci-dessus). Un
    `ON DELETE SET NULL` sur la contrainte FK (ou la suppression pure de
    la colonne) ferait porter ce détachement par SQLite lui-même plutôt
    que par du code applicatif à chaque site de suppression — mais
    SQLite ne permet pas de modifier une contrainte FK via `ALTER TABLE`,
    ce qui impose la même technique de recréation de table que la
    migration `UNIQUE(user_id, ticker, section_id)` de la Session 27.
    Root cause identifiée par l'agent altitude, mais migration de schéma
    non triviale à traiter dans une session dédiée.
  - La migration SQLite par recréation de table (`server/db.js`, Session
    27, contrainte `UNIQUE(user_id, ticker, section_id)`) suit une
    technique différente des migrations `columnExists()`/`ALTER TABLE
    ADD COLUMN` existantes, mais à juste titre : SQLite ne permet pas de
    modifier une contrainte `UNIQUE` autrement — vérifié par l'agent
    altitude, pas un raccourci, aucune action nécessaire.
  - Correctifs reportés des revues n°1 à n°5 toujours non traités (liste
    inchangée, voir Revues n°1 à n°5 ci-dessus) — aucun n'a été adressé
    cette session, hormis les trois sites de suppression de valeur
    corrigés ci-dessus (qui prolongeaient la remarque déjà présente dans
    `BACKLOG.md` Session 27 : « aux trois endroits qui suppriment une
    ligne valeurs directement »).

### 2026-07-26 — Session 30, résolution complète de la dette reportée (hors cycle de revue programmé)

- **Contexte** : demande explicite de l'utilisateur de traiter, en une
  seule session, l'ensemble des points reportés cumulés depuis les
  Revues n°1 à n°6 ci-dessus — pas un nouveau cycle de revue déclenché
  par le compteur `BACKLOG.md` (qui restait à 0/3 après la Session 29),
  mais une session dédiée à la résolution du backlog de dette déjà
  identifié. Contrairement aux cycles précédents (limités aux correctifs
  « à risque faible »), cette session dispose de Playwright/Chromium
  (indisponible aux sessions précédentes) pour vérifier visuellement les
  changements touchant des interactions utilisateur directes
  (glisser-déposer, mode placement d'alerte, modales) — plusieurs points
  reportés précisément faute de ce moyen de vérification ont donc pu
  être traités cette fois. Session 29 (factorisation Yahoo Finance,
  v1.8.10) a déjà été traitée séparément juste avant celle-ci et n'est
  pas reprise ici.
- **Correctifs appliqués** (vérifiés par `node --test test/*.test.js`,
  45/45, et par un parcours Playwright réel contre un serveur local —
  Chart.js servi depuis un paquet npm local le temps du test, le CDN
  `jsdelivr` étant bloqué par la politique réseau du bac à sable ;
  register, rendu de la liste de valeurs/sections/alertes, modale prompt
  de renommage, modale confirm avec annulation `Échap` puis confirmation
  positive de suppression, ouverture du graphique, mode placement d'une
  alerte avec bascule de période en cours de placement, glisser-déposer
  réel d'une section avec vérification de l'ordre persisté côté API,
  bascule de thème — aucune erreur console sur l'ensemble du parcours) :
  - `GET /api/alertes` renvoie désormais un tableau (`id` par élément)
    au lieu d'une map indexée par id — même convention que
    `GET /api/valeurs` (Session 27). Reporté en Revue n°1 (« format de
    réponse API en map »). Consommateurs mis à jour :
    `public/app.js` (`displayAlertes`, `chargerAlertes`) et les tests
    (`alertes.test.js`, `valeurs.test.js`, `partage.test.js`).
  - Middleware d'erreurs centralisé (Revue n°1) :
    `server/middleware/errorHandler.js` (dernier middleware monté dans
    `server/app.js`, réponse JSON `{ error }` plutôt que la page HTML
    par défaut d'Express) et `server/middleware/asyncHandler.js` (les
    handlers async d'Express 4 ne transmettent pas nativement une
    rejection de promesse à `next()` ; sans ce wrapper, une erreur levée
    dans un handler async laissait la requête sans réponse plutôt que de
    remonter au middleware). Appliqué aux handlers async de
    `routes/valeurs.js` et `routes/sections.js`.
  - Cache mémoire (Revue n°1) sur `GET /api/chart/:ticker`
    (`server/routes/chart.js`), 60 secondes par ticker+période (la
    moitié de l'intervalle du job de mise à jour des cours) — chaque
    réouverture du même graphique ne refait plus un appel Yahoo Finance
    identique. Test dédié (`chart.test.js`) vérifiant qu'un second appel
    identique ne déclenche pas de second appel réseau.
  - Appels réseau/SMTP parallélisés (Revue n°1, écarté par prudence à 3
    reprises) : `traiterEnParallele()` (`server/jobs/parallel.js`,
    `Promise.allSettled`) remplace les boucles `for...await`
    séquentielles de `updatePrices()`/`updateIndices()`
    (`jobs/prices.js`) et de `checkAlerts()` (`jobs/alerts.js`) — une
    erreur individuelle (ticker invalide, échec SMTP) n'interrompt plus
    les autres items, comme avant, mais sans attendre chaque item l'un
    après l'autre. Résout du même coup la duplication de forme entre
    `updatePrices()`/`updateIndices()` signalée en Revue n°3. Vérifié
    manuellement (mise à jour de 2 tickers + 3 indices, puis
    déclenchement direct de `checkAlerts()` avec une alerte active :
    comportement identique à avant, un seul email pour l'alerte
    déclenchée).
  - `creerValeur()` partagé (`server/valeurs.js`, Revue n°6) entre
    `POST /api/valeurs` et `POST /api/sections/:id/valeurs`, remplace
    l'`INSERT` à 11 colonnes dupliqué verbatim entre les deux routes. Les
    deux routes restent distinctes (voir « Correctifs reportés »
    ci-dessous pour la fusion plus large écartée).
  - `roleSection()` ciblé sur un seul id (`server/partage.js`, Revue
    n°3), utilisé par `GET/POST/DELETE /api/sections/:id/valeurs` à la
    place de `rolesSection(db, userId).get(id)` qui chargeait la carte
    complète des sections visibles pour ne lire qu'une seule entrée.
    `rolesSection()` (carte complète) reste utilisé là où plusieurs
    sections sont réellement référencées (`GET /api/sections`,
    `PUT /api/sections/reorder`).
  - Trois vérifications de propriété de section (Revue n°3) : `PUT /:id`
    et `DELETE /:id` (`server/routes/sections.js`) réutilisent désormais
    `sectionPossedee()` au lieu de dupliquer une troisième fois la même
    requête `SELECT ... WHERE id = ? AND user_id = ?`. Vérifié sans
    risque de TOCTOU : `better-sqlite3` est synchrone, aucune requête
    concurrente ne peut s'intercaler entre la vérification et la
    mutation dans un même process Node (le point d'atomicité que la
    Revue n°3 avait jugé risqué à changer n'existait donc pas réellement
    pour `PUT`, qui faisait déjà de toute façon un `SELECT` implicite via
    `info.changes === 0` après coup).
  - `showPrompt()`/`showConfirm()` unifiées (Revue n°2,
    `public/app.js`) : un seul résolveur (`modalActive` +
    `resoudreModaleActive()`), `cancelValue` par modale (`null` pour un
    prompt, `false` pour un confirm) portant la seule vraie différence de
    comportement à l'annulation (`Échap`, fond semi-transparent, icône
    `icon-x`). Vérifié au navigateur : renommage de section via la
    modale prompt, annulation d'une suppression via `Échap` (la valeur
    n'est pas supprimée), confirmation positive (la valeur est
    supprimée).
  - `executerAction()` unifié (Revue n°2, `public/app.js`) : remplace le
    squelette `showLoader`/`try`/`catch`/`finally`/toast répété dans
    `ajouterValeur`/`supprimerValeur`/`supprimerValeurSection`/
    `ajouterSection`/`renommerSection`/`supprimerSection`/
    `ajouterPartage`/`supprimerPartage`/`creerAlerteAPI`/
    `supprimerAlerte` (10 fonctions).
  - `Alpine.store('portfolio').valeursDeSection()` mémoïsé (Revue n°2) :
    regroupement par section calculé une fois par changement de
    `valeurs` (invalidation explicite aux deux seuls endroits qui
    mutent `valeurs` — `displayValeurs()` et le `onEnd` de
    `initSortableValeurs()` — plutôt qu'une comparaison de référence
    implicite, pour rester auditable) au lieu d'un refiltrage/retri à
    chaque appel (un appel par section à chaque rendu Alpine).
  - `initSortableListeValeurs()` et `envoyerReorder()` (Revue n°3,
    `public/app.js`) factorisent respectivement le squelette SortableJS
    identique (`draggable`/`handle`/`animation`/`ghostClass`/`dragClass`)
    et la queue fetch+gestion d'erreur identique de
    `initSortableValeurs`/`initSortableValeursPartagees` et
    `persisterOrdre`/`persisterOrdreSectionPartagee` — la logique métier
    propre à chacun (glisser-déposer inter-sections autorisé ou non,
    forme du payload) reste distincte. Vérifié par glisser-déposer réel
    d'une section au navigateur (Playwright, simulation souris complète)
    avec vérification de l'ordre persisté via `GET /api/sections`.
  - `alertesActivesPour(ticker)` (Revue n°5) : getter dérivé du store
    (`store.alertes`, peuplé par `chargerAlertes()`) remplace la variable
    globale `alertesActives` reconstruite en effet de bord dans
    `displayAlertes()`.
  - Mode placement d'une alerte (Revue n°4) : la visibilité des 5
    éléments (déclencheur/annuler/confirmer/ligne/badge) est désormais
    pilotée uniquement par les classes CSS `#graphiqueWrapper.alertable`/
    `.placement-actif` (`public/styles.css`) au lieu de 5 attributs
    `hidden` togglés individuellement en JS ; un bug réel a été débusqué
    et corrigé en cours de route (la base CSS `.alerte-drag-trigger,
    .alerte-drag-cancel, .alerte-drag-confirm` fixait encore
    `display: flex` inconditionnellement, en conflit de même spécificité
    avec les nouvelles règles — sans le retrait de cette déclaration, le
    bouton Annuler restait visible en permanence, y compris hors mode
    placement ; débusqué par le premier passage Playwright, corrigé avant
    la vérification finale).
  - `chargerGraphique()` (Revue n°4) émet un évènement `chart:loaded`
    plutôt qu'une branche `if (placementAlerteActif)` codée en dur —
    seul abonné aujourd'hui : `repositionnerPlacementApresChargement()`,
    qui corrige au passage le bug documenté en Revue n°4
    (`valeurPlacement` n'était jamais re-clampé aux nouveaux `min`/`max`
    de l'échelle après un changement de période en cours de placement,
    contrairement à `mettreAJourPlacementDepuisEvent()` qui clampe à
    chaque geste). Vérifié au navigateur : la ligne de placement reste
    visible et dans les bornes après bascule de période (1M → 1A) en
    cours de placement.
  - Poignée de glisser-déposer dédiée pour les sections (Revue n°2/n°4,
    `.valeurs-section-drag-handle`, icône `icon-grip`,
    `touch-action: none`) — le glisser-déposer d'une section se
    déclenchait jusqu'ici depuis le titre cliquable (qui sert aussi à
    replier/déplier), même risque de conflit avec le scroll tactile
    mobile que celui déjà corrigé pour les valeurs en v1.3.1. Voir
    `DESIGN.md` § Liste des valeurs suivies.
  - Fusion CSS `.alerte-drag-line`/`.alerte-existante-ligne` (Revue n°5) :
    propriétés strictement identiques (`position`, `left`, `right`,
    `height`, `pointer-events`) extraites dans une base commune, chacune
    ne gardant que son trait/z-index propre — même technique que la
    fusion déjà appliquée en Revue n°5 pour
    `.alerte-existante-badge`/`.alerte-hors-limite`.
  - `.btn-icon-xs` (Revue n°5) : nouvelle classe réutilisable
    (`padding: 4px`) remplace deux overrides contextuels identiques
    (`.valeur-actions .btn-icon-small`/`.alerte-card .btn-icon-small`),
    appliquée directement aux boutons concernés.
- **Correctifs évalués et explicitement écartés** (vérifiés plutôt que
  reportés une nouvelle fois — la prudence des revues précédentes s'est
  avérée justifiée pour l'un, non pour l'autre, mais dans les deux cas la
  question est maintenant tranchée) :
  - Fusion `.alerte-drag-trigger`/`.alerte-drag-cancel`/
    `.alerte-drag-confirm` avec `.btn-icon-small`/`.btn-icon-gold` (Revue
    n°4) : mesure des tailles calculées confirmant la mise en garde
    déjà documentée — `.btn-icon-small` fait 28×28 (taille dérivée du
    `padding`), les boutons du graphique sont fixés à 36×36 ; fusionner
    aurait réellement rétréci ces boutons flottants. Non fusionné, sans
    risque de régression puisque non appliqué.
  - Fusion du calcul « valeur → pixel Y + libellé formaté » entre
    `positionnerLigneAlerte()` et `afficherAlertesGraphique()` (Revue
    n°4/n°5) : la duplication réelle se limite à 2 lignes
    (`getPixelForValue`/`formatCours`) une fois que les deux fonctions
    conservent chacune sa propre stratégie de rendu DOM (éléments fixes
    togglés vs création/destruction dynamique, gestion du hors-limite
    absente côté placement) — extraire un helper ajouterait de
    l'indirection pour un gain quasi nul. Laissé tel quel par choix,
    plutôt que par prudence générique.
- **Correctifs toujours reportés** (portée jugée trop large pour cette
  session, à traiter dans une session dédiée future) :
  - Fusion de `POST /api/valeurs` et `POST /api/sections/:id/valeurs` en
    un seul endpoint déterminant lui-même l'autorisation d'écriture
    (Revue n°6) : la duplication littérale de l'`INSERT` a été résorbée
    ci-dessus (`creerValeur()`), mais la fusion des deux ROUTES
    elle-même — et le retrait de la décision de routage côté client
    (`public/app.js`, `ajouterValeur()`) — reste un changement de
    contrat d'API plus large, non traité cette session.
  - `alertes.valeur_id` colonne FK vestigiale (Revue n°6) : nécessite une
    migration de schéma SQLite par recréation de table (`ALTER TABLE`
    ne permet pas de modifier une contrainte FK), non triviale, non
    traitée.
  - Densification de l'UI via une échelle de tokens communs partagés
    (Revue n°5) et `line-height: 1.25` remonté sur `.valeur-row` (Revue
    n°5, déjà explicitement écarté par une analyse propre — changerait
    des descendants non concernés par la densification) — décisions de
    design system plus larges, non demandées explicitement.
  - Les deux points déjà tranchés « aucune action nécessaire » par les
    revues elles-mêmes (branche défensive inatteignable de
    `rolesSection()`, technique de migration SQLite par recréation de
    table de la Session 27) ne sont pas de la dette et restent tels
    quels — voir Revue n°3/n°6 pour le détail de cette conclusion.

### 2026-07-28 — Revue n°7

- **Portée** : diff cumulé depuis la clôture de la Revue n°6 (commit
  `d22e4f8`, « Session 28 - technical debt review n6 ») jusqu'à `HEAD`
  (`8451eeb`), soit `git diff d22e4f8..HEAD -- server/ public/
  ':!public/vendor'` — borne vérifiée par `git log` en début de session
  (conforme au prompt initial, aucune correction de portée nécessaire
  cette fois contrairement aux Revues n°3/n°4/n°5/n°6). Couvre les
  Sessions 29 à 38 : factorisation du squelette réseau Yahoo Finance
  (29), résolution complète de la dette reportée n°1-n°6 en trois
  commits (Session 30 — contrat d'API en tableau, middleware d'erreurs,
  cache de graphique, parallélisation des jobs, `creerValeur()` partagé,
  `roleSection()` ciblé, `sectionPossedee()`, fusion des modales prompt/
  confirm, `executerAction()` unifié, mémoïsation de
  `valeursDeSection()`, `initSortableListeValeurs()`/`envoyerReorder()`,
  `alertesActivesPour()`, mode placement piloté par CSS, évènement
  `chart:loaded`, poignée de glisser-déposer des sections, fusions CSS),
  correctifs FAB et variation du jour (31-32), fusion des endpoints
  d'ajout de valeur + retrait de `alertes.valeur_id` + graphique de
  volume (33), affichage du dernier déclenchement d'une alerte (34),
  correctif de la largeur d'axe Y/chevauchement du bouton cloche (35),
  correctif critique de l'ordre écriture base/envoi email dans
  `checkAlerts()` (36), pastilles de notification (37), correctif du
  scroll de la liste de recherche sur mobile (38). Outillage utilisé :
  `/simplify` (4 agents de revue en parallèle : réutilisation,
  simplification, efficacité, altitude).
- **Correctifs appliqués** (risque faible, comportement strictement
  inchangé, vérifiés par tests unitaires (`node --test test/*.test.js`,
  53/53) et un parcours Playwright réel contre un serveur local — Chart.js
  servi depuis un paquet npm local le temps du test uniquement, le CDN
  `jsdelivr` étant bloqué par la politique réseau du bac à sable, fichier
  temporaire retiré et référence CDN restaurée avant le commit final ;
  inscription/connexion, appel direct de `executerAction()` avec une
  fonction résolue et une fonction en échec pour vérifier la valeur de
  retour propagée dans les deux cas, appel direct de
  `chargerGraphiqueVolume()` avec la nouvelle signature pour vérifier le
  rendu du graphique de volume, injection directe d'alertes dans
  `Alpine.store('portfolio').alertes` avec/sans `derniereAlerte` pour
  vérifier l'affichage/masquage de la pastille de notification — aucune
  erreur console sur l'ensemble du parcours) :
  - `executerAction()` (`public/app.js`) propage désormais la valeur
    résolue par `fn()` (`return await fn()`) au lieu de la faire
    disparaître systématiquement. Signalé indépendamment par les agents
    altitude et simplification : `creerAlerteAPI()`, seul appelant sur
    dix ayant besoin d'un résultat (piloter la fermeture de la modale
    dans `creerAlerte()`), devait jusqu'ici recourir à un `let succes =
    false` muté depuis l'intérieur de la fermeture passée à
    `executerAction()` pour faire remonter artificiellement l'information
    — désormais un simple `return executerAction(...)`/`return true`.
  - `$store.portfolio.alertesDeclenchees()` (`public/index.html`, pastille
    `.badge-notif-count` de l'en-tête « Alertes actives ») était appelée
    deux fois sur le même nœud (`x-show` et `x-text`), recalculant deux
    fois le filtrage du tableau `alertes` à chaque évaluation réactive
    Alpine. Remplacé par `x-data="{ n: 0 }" x-effect="n =
    $store.portfolio.alertesDeclenchees().length"`, `x-show`/`x-text`
    lisant désormais `n` : un seul calcul par évaluation, sans toucher au
    getter du store ni à son mécanisme d'invalidation.
  - `chargerGraphiqueVolume()` (`public/app.js`) recalculait
    `couleurTexte` à partir de `themeSombre` alors que `chargerGraphique()`
    (son unique appelant) avait déjà calculé cette même valeur juste
    avant ; `couleurTexte` est désormais passé en paramètre plutôt que
    re-dérivé une seconde fois.
  - Extraction de `reinitialiserCanvasVolume()` (`public/app.js`),
    remplace deux occurrences identiques du marquage de réinitialisation
    du canvas de volume (`container.innerHTML = '<canvas id="volumeCanvas">
    </canvas>'`), l'une dans le bloc `catch` de `chargerGraphique()`,
    l'autre en tête de `chargerGraphiqueVolume()`.
- **Correctifs évalués et explicitement écartés** (vérifiés plutôt que
  reportés) :
  - `GET /api/valeurs/recherche` (`server/routes/valeurs.js`) enveloppé
    dans `asyncHandler(...)` alors que `rechercherTickers()`
    (`server/valeurs.js`) capture déjà toute erreur en interne et renvoie
    systématiquement `[]` (jamais de rejet) — ce handler ne peut
    structurellement jamais lever d'exception, contrairement à
    `POST /` du même fichier (où `creerValeur()` peut réellement lever).
    Retirer `asyncHandler` ici ne changerait aucun comportement, mais
    romprait la cohérence visuelle avec les autres routes du même routeur
    (toutes enveloppées de la même façon) pour un gain nul — laissé tel
    quel par choix, pas par prudence générique.
- **Correctifs reportés** (plus profonds ou risqués, à traiter dans une
  session dédiée future, pas dans ce cycle) :
  - `roleSection(db, userId, sectionId)` (`server/partage.js`, Session
    30) duplique environ 90% de `rolesSection(db, userId)` (mêmes deux
    requêtes — section possédée, puis jointure `section_shares` —, même
    forme d'objet retourné, seule différence un `WHERE id = ?`/`.get` au
    lieu d'un `.all`). Unifiable (`rolesSection(db, userId, { onlyId })`
    ou générateur de requête paramétré partagé), mais touche le mécanisme
    central d'autorisation d'accès aux sections utilisé par plusieurs
    routes sensibles (`GET/POST/DELETE /api/sections/:id/valeurs`) — à
    traiter avec un test manuel dédié plutôt qu'en correctif à l'aveugle
    dans ce cycle.
  - Migration de suppression de `alertes.valeur_id` (`server/db.js`,
    Session 33) copie intégralement la recette de recréation de table en
    7 étapes (`pragma OFF` → `db.transaction` → `CREATE TABLE ..._new` →
    `INSERT...SELECT` → `DROP TABLE` → `RENAME` → `pragma ON`) déjà
    présente pour la migration `valeurs`/Session 27, seules les listes de
    colonnes diffèrent. Un helper partagé (`recreerTable(db, table,
    createSql, colonnesACopier)`) supprimerait cette duplication, mais
    toute erreur dans une généralisation de ce mécanisme s'exécute
    directement sur la base de données réelle de l'utilisateur au
    démarrage du serveur — risque jugé disproportionné pour un correctif
    de dette technique à ce cycle, à traiter séparément avec sa propre
    vérification dédiée sur une copie de base « avant migration ».
  - `updatePrices()`/`updateIndices()` (`server/jobs/prices.js`)
    restent des quasi-doublons structurels (même log de départ, même
    préparation d'`UPDATE`, même appel à `traiterEnParallele()` avec un
    callback de même forme, même log de clôture) malgré l'extraction de
    `traiterEnParallele()` en Session 30, qui a résorbé la duplication de
    la boucle réseau/de parallélisation elle-même mais pas celle du
    squelette autour. Un helper partagé (`mettreAJourEntites(items, fn,
    libelle)`) supprimerait le reste, mais cette même duplication a déjà
    été identifiée et volontairement laissée de côté aux Revues n°1 et
    n°3 par prudence (paralléliser/fusionner ces deux jobs de mise à jour
    de cours a un impact direct sur le comportement sous charge face à
    Yahoo Finance) — traité avec la même prudence ici plutôt que corrigé
    isolément.
  - Correctifs reportés des revues n°1 à n°6 non explicitement traités
    par la Session 30 ou les sessions suivantes (format de réponse API en
    map — traité en Session 30 ; alertes en manipulation DOM directe —
    partiellement traité, `alertesActivesPour()`/`alertesDeclenchees()`
    sont désormais des getters de store, mais le rendu des cartes reste
    de la manipulation DOM directe dans `displayAlertes()`/
    `createAlerteCard()`) : aucun changement supplémentaire sur ce point
    précis cette session, en dehors des deux correctifs d'efficacité
    ci-dessus qui touchent incidemment `alertesDeclenchees()`.

### 2026-08-04 — Revue n°8

- **Portée** : diff cumulé depuis la clôture de la Revue n°7 (commit
  `767a2cd`, « Session 39 - technical debt review n7... ») jusqu'à
  `HEAD` (`d15c6a3`), soit `git diff 767a2cd..HEAD -- server/ public/
  ':!public/vendor'` — borne vérifiée par `git log` en début de session
  (conforme au prompt initial, aucune correction de portée nécessaire,
  comme pour la Revue n°7). Couvre les Sessions 40 à 45 (v1.9.9 à
  v1.9.14) : affichage du cours avant-bourse pour les valeurs suivies et
  les indices de marché (40), persistance de la dernière période de
  graphique sélectionnée dans `localStorage` (41-42), ligne de référence
  « clôture veille » sur le graphique (43), correctif de sélection de
  texte iOS sur le graphique (44), correctif du mécanisme de détection
  avant-bourse (`meta.currentTradingPeriod.pre` remplaçant
  `meta.marketState`/`meta.preMarketPrice`, absents de l'endpoint
  réellement utilisé) et correctif de la pastille d'alerte translucide
  (45). Outillage utilisé : `/simplify` (4 agents de revue en parallèle :
  réutilisation, simplification, efficacité, altitude).
- **Correctifs appliqués** (risque faible, comportement strictement
  inchangé, vérifiés par tests unitaires (`node --test test/*.test.js`,
  62/62), un démarrage réel du serveur (`GET /`/`GET /login.html` → 200)
  et une exécution ciblée de la migration `avant_bourse_*` sur une base
  au schéma pré-Session 40 reconstituée à la main pour vérifier que les
  quatre colonnes sont bien ajoutées par la boucle qui remplace les
  quatre blocs `if` d'origine) :
  - Extraction de `pctChange(price, ref)` et `extraireResultatChart(data)`
    (`server/jobs/prices.js`), remplace respectivement deux occurrences
    identiques de la formule de variation en pourcentage (cours normal et
    cours avant-bourse, `fetchYahooFinance()`) et deux occurrences
    identiques de la garde « réponse `/v8/finance/chart` exploitable ? »
    (`fetchYahooFinance()` et `fetchDernierPrixPreMarket()`, cette
    dernière ajoutée en Session 40) — signalé indépendamment par les
    agents réutilisation, simplification et efficacité.
  - Boucle de migration `avant_bourse_cours`/`avant_bourse_variation`
    (`server/db.js`), remplace quatre blocs `if (!columnExists(...))
    db.exec('ALTER TABLE ... ADD COLUMN ...')` quasi identiques
    (Session 40) par une double boucle sur les deux tables
    (`valeurs`/`indices_marche`) et les deux colonnes — même garde
    `columnExists()`, même ordre d'exécution, même instruction SQL par
    itération.
  - `context.dataset.reference` (`public/app.js`, tooltip du graphique)
    remplace `context.dataset.label === 'Cloture veille'` : le dataset de
    la ligne de clôture de la veille (Session 43) portait un discriminant
    implicite via son texte d'affichage (`label`, alors que la légende du
    graphique est masquée) plutôt qu'un indicateur dédié — un futur
    changement du libellé aurait silencieusement cassé le format de
    l'infobulle. `reference: true` ajouté sur le dataset, même sortie de
    tooltip vérifiée avant/après.
  - Fusion CSS `.stat-variation.success/.stat-avant-bourse.success` et
    `.stat-variation.danger/.stat-avant-bourse.danger` (idem pour
    `.valeur-variation`/`.valeur-avant-bourse`), `public/styles.css` :
    quatre paires de règles ajoutées par la fonctionnalité avant-bourse
    (Session 40) redéclaraient chacune `color: var(--success))`/
    `color: var(--danger)` à l'identique des règles `.stat-variation`/
    `.valeur-variation` juste au-dessus — même technique de fusion par
    liste de sélecteurs déjà appliquée en Revue n°5 pour
    `.alerte-existante-badge`/`.alerte-hors-limite` (propriétés
    strictement identiques entre les sélecteurs fusionnés, CSS calculé
    inchangé).
- **Correctifs reportés** (plus profonds ou risqués, à traiter dans une
  session dédiée future, pas dans ce cycle) :
  - `fetchYahooFinance()` (`server/jobs/prices.js`) est appelée à la fois
    par le job périodique (`updatePrices()`/`updateIndices()`, où
    l'enrichissement avant-bourse est la fonctionnalité recherchée) et
    par `verifierTickerExiste()` (`server/valeurs.js`), invoquée de façon
    synchrone dans `POST /api/valeurs`/`POST /api/sections/:id/valeurs`
    pour la seule vérification qu'un ticker existe avant insertion.
    L'enrichissement avant-bourse ajouté en Session 40/45 (fenêtre de
    pré-ouverture + second appel réseau conditionnel) est codé
    directement dans `fetchYahooFinance()`, donc toute requête d'ajout
    d'une valeur US pendant sa fenêtre avant-bourse paie désormais cet
    appel réseau supplémentaire de façon synchrone — alors que
    `creerValeur()` stocke bien ce cours avant-bourse initial, il sera de
    toute façon écrasé par le prochain cycle du job (~2 minutes plus
    tard). Signalé indépendamment par les agents efficacité et altitude
    comme un cas particulier greffé sur une fonction partagée par un
    appelant qui n'en a pas besoin. Correctif plus profond envisageable
    (scinder `fetchYahooFinance()` en un cœur léger et une variante
    enrichie réservée aux appelants du job), mais change un comportement
    observable (le cours avant-bourse resterait vide jusqu'au prochain
    cycle du job pour une valeur tout juste ajoutée) — à traiter avec un
    test manuel dédié plutôt qu'en correctif à risque faible ce cycle.
  - `fetchDernierPrixPreMarket()` (`server/jobs/prices.js`, Session 40)
    interroge `interval=1m&range=1d&includePrePost=true` (la série
    complète des bougies à la minute du jour) à chaque cycle du job
    (~2 minutes) pour chaque ticker/indice encore dans sa fenêtre
    avant-bourse, alors que seul le tout dernier point valide est
    effectivement lu — le chevauchement entre appels consécutifs croît
    au fil de la fenêtre. Une requête bornée à la fenêtre avant-bourse
    elle-même (`period1`/`period2` plutôt que `range=1d`) réduirait la
    charge, mais change les paramètres de requête envoyés à Yahoo
    Finance — à vérifier contre le comportement réel de l'API avant
    d'appliquer, pas un correctif à l'aveugle.
  - `server/routes/chart.js` (`GET /api/chart/:ticker`, Session 43) lit
    désormais `result.meta.previousClose || result.meta.chartPreviousClose
    || null` pour exposer `previousClose` au client — une troisième
    occurrence de la même règle de repli déjà présente dans
    `fetchYahooFinance()` (`server/jobs/prices.js`, défaut `0` plutôt que
    `null`). Aggrave la dette déjà suivie depuis la Revue n°1 (« logique
    Yahoo Finance dupliquée entre `prices.js`/`chart.js` ») plutôt que
    d'introduire une nouvelle catégorie de duplication — signalé par
    l'agent réutilisation. Les deux occurrences ayant des valeurs de
    repli différentes (`0` vs `null`), une factorisation à l'aveugle
    changerait le comportement de l'un des deux appelants selon le choix
    du défaut commun — à traiter avec la même prudence que le reste de
    cette dette déjà reportée quatre fois, pas comme un correctif isolé
    ce cycle.
  - `public/index.html` : l'expression Alpine inline
    `:class="(x || 0) >= 0 ? 'success' : 'danger'"` (déjà répétée 3 fois
    avant ce diff pour `indice.variation`/`valeur.variation`) est
    désormais répétée 5 fois avec les deux nouvelles occurrences pour
    `avantBourseVariation` (Session 40). Signalé par l'agent
    réutilisation comme un prolongement d'un motif déjà toléré par le
    projet plutôt qu'une nouvelle catégorie de dette — un helper
    `signeClasse(x)` réduirait la duplication sur 5 sites au lieu de 3,
    mais n'a pas été jugé prioritaire par l'agent lui-même ; laissé
    tel quel.
  - `server/test/prices.test.js` (`mockMetaEtPreMarket`) et
    `server/test/prices-job.test.js` (`mockPreMarketPour`, nouveau
    fichier) construisent chacun leur propre simulation de
    `global.fetch` distinguant l'appel de cours normal de l'appel
    avant-bourse (`url.includes('interval=1m')`), plutôt que de partager
    un unique constructeur de mock paramétré. Code de test uniquement,
    priorité basse — signalé par l'agent simplification.
  - `updatePrices()`/`updateIndices()` (`server/jobs/prices.js`) ont
    chacune reçu deux colonnes/paramètres supplémentaires quasi
    identiques (`avant_bourse_cours`/`avant_bourse_variation`) pour la
    fonctionnalité avant-bourse (Session 40) : la duplication structurelle
    déjà suivie depuis la Revue n°3/n°7 s'alourdit donc légèrement, sans
    nouveau motif de duplication — confirmé par les agents efficacité et
    altitude comme une aggravation mineure de la dette déjà connue plutôt
    qu'un nouveau problème, traité avec la même prudence que les cycles
    précédents (paralléliser/fusionner ces deux jobs reste hors périmètre
    d'un correctif à risque faible).
  - Les trois points déjà exclus du périmètre de ce cycle
    (`roleSection()`/`rolesSection()` dans `server/partage.js`, la
    recette de migration SQLite par recréation de table dupliquée dans
    `server/db.js`, la quasi-duplication structurelle
    `updatePrices()`/`updateIndices()` — voir ci-dessus pour cette
    dernière) restent non traités, conformément à la consigne de session.

### 2026-08-06 — Revue n°9

- **Portée** : diff cumulé depuis la clôture de la Revue n°8 jusqu'à
  `HEAD` (`git diff 7bbc386..HEAD -- server/ public/ ':!public/vendor'`).
  Correction de portée par rapport au prompt de session initial (qui
  indiquait `d15c6a3..HEAD`) : `d15c6a3` (« Session 45 - fix pre-market
  detection and translucent alert badge ») est la borne **haute** du
  diff effectivement revu par la Revue n°8 elle-même (« Couvre les
  Sessions 40 à 45 », voir Revue n°8 ci-dessus), pas sa clôture — la
  clôture réelle est `7bbc386` (« Session 46 - technical debt review
  n8 »), commit qui applique les correctifs de la Revue n°8. Utiliser
  `d15c6a3` aurait fait rentrer dans le périmètre de cette revue les
  correctifs déjà appliqués et déjà journalisés par la Revue n°8
  elle-même — même type de correction de portée déjà appliquée aux
  Revues n°3/n°4/n°5/n°6. Portée réelle : Sessions 47 à 52 (canal de
  régression en orientation paysage, déplacement puis translucidité de
  la pastille de seuil d'alerte, zoom par pincement sur la période du
  graphique en deux temps — preset puis fenêtre continue arbitraire —,
  icône de partage allumée pour les sections déjà partagées), soit
  exactement l'intervalle annoncé par le prompt de session (« Sessions
  47 à 52 »), qui portait donc la bonne intention malgré la borne basse
  erronée fournie. Outillage utilisé : `/simplify` (4 agents de revue en
  parallèle : réutilisation, simplification, efficacité, altitude).
- **Correctifs appliqués** (risque faible, comportement inchangé,
  vérifiés par tests unitaires (`node --test test/*.test.js`, 62/62) et
  un démarrage réel du serveur (`GET /`/`GET /login.html`/`GET /app.js`/
  `GET /styles.css` → 200) ; pas de parcours Playwright cette session
  (le CDN Chart.js reste bloqué par la politique réseau du bac à sable et
  les quatre correctifs appliqués sont des refactorisations à
  comportement prouvé identique par analyse statique — voir le détail de
  chacun ci-dessous — plutôt que des changements de mécanisme
  observables) :
  - `pincementRect` (`public/app.js`, zoom par pincement du graphique) :
    le rectangle du canvas (`getBoundingClientRect()`) est désormais
    capturé une seule fois au début du geste (`pincementOnPointerDown()`,
    quand le second pointeur rejoint) et réutilisé par
    `appliquerPincement()` à chaque `pointermove`, au lieu d'être
    recalculé à chaque évènement — même correctif déjà appliqué en
    Session 30/Revue n°4 au geste sœur de placement d'une alerte
    (`dragRect`, `alerteOnPointerDown()`), pour la même raison
    (`getBoundingClientRect()` force un recalcul de layout, potentiellement
    coûteux, répété sur tout un geste). Signalé indépendamment par les 3
    agents réutilisation/simplification/efficacité.
  - `pointsPincement()` (`public/app.js`), remplace la ligne identique
    `const [p1, p2] = [...pincementPointers.values()]` dupliquée en tête
    de `distancePincement()` et `centreXPincement()`.
  - Fusion CSS `.alerte-drag-badge`/`.alerte-existante-badge`/
    `.alerte-hors-limite` (`public/styles.css`) : les Sessions 48/49
    avaient déplacé la pastille de seuil actif de `right: 8px` à
    `left: 8px` (pour ne plus chevaucher le cours actuel, voir Session
    48 ci-dessus) sans reprendre la fusion déjà pratiquée pour
    `.alerte-drag-line`/`.alerte-existante-ligne` juste au-dessus dans le
    même fichier — les trois sélecteurs partagent désormais `position:
    absolute`, `left: 8px`, `border-radius: 4px`, `pointer-events: none`,
    `white-space: nowrap`, `font-weight: 500` à l'identique, extraits
    dans une base commune ; chacun garde sa propre règle pour le fond, la
    couleur, la bordure, le padding, la taille de police et le
    `z-index`, qui diffèrent réellement entre le mode placement (or
    plein, `--toast-neutral`) et les seuils existants/hors-limite
    (translucide, `--danger`). CSS calculé strictement identique
    avant/après — même technique de fusion déjà appliquée aux Revues
    n°5/n°8 pour d'autres paires de sélecteurs de ce même fichier.
  - `libellePartage(section)` (`public/app.js`), remplace la même
    expression ternaire `section.partagee ? 'Section partagee' :
    'Partager la section'` dupliquée entre `:title` et `:aria-label` du
    bouton `icon-share` (`public/index.html`, Session 52).
- **Correctifs évalués et explicitement écartés** (analysés plutôt que
  reportés) :
  - Extraction d'un helper `couleurSucces(themeSombre)`/
    `couleurDanger(themeSombre)` pour les couleurs de bande du canal de
    régression (`construireDatasetsPrix()`, `public/app.js`, hex
    `#34a853`/`#5fbb7a`/`#ea4335`/`#f2685c`) partagé avec
    `calculerCouleursVolume()` (mêmes valeurs RGB sous-jacentes, mais en
    `rgba(...)` avec une opacité 0.6 pour les barres de volume) :
    signalé par l'agent réutilisation, mais les deux sites ont des
    formats de sortie réellement différents (hex plein vs rgba avec
    alpha) — factoriser n'éliminerait qu'une paire de constantes
    dupliquée une seule fois, pour le prix d'une indirection
    supplémentaire. Laissé tel quel par choix, pas par prudence
    générique.
  - `mqPaysage.matches` (`public/app.js`, lu directement à 3 endroits :
    `openGraphique()`, `pincementOnPointerDown()`,
    `chargerGraphique()`) plutôt que derrière un accesseur nommé unique
    (ex. `enPaysage()`) : signalé par l'agent altitude comme mineur («
    worth a mention, not urgent »). Gain jugé trop faible pour
    l'indirection ajoutée sur seulement 3 sites — laissé tel quel.
- **Correctifs reportés** (plus profonds ou risqués, à traiter dans une
  session dédiée future, pas dans ce cycle) :
  - `redessinerPlageVisible()` (`public/app.js`, zoom par pincement)
    appelle `afficherAlertesGraphique()` à chaque frame de redessin
    (limité à une frame par `requestAnimationFrame`, mais potentiellement
    plusieurs par seconde pendant un geste actif) — celle-ci détruit et
    reconstruit intégralement les nœuds DOM de l'overlay des alertes
    (`overlay.innerHTML = ''` puis `createElement`/`appendChild` par
    seuil) au lieu de repositionner des éléments existants. Signalé par
    l'agent efficacité comme transformant une dette déjà tolérée depuis
    la Revue n°5 (« nœuds DOM créés/détruits à chaque appel ») en un
    véritable chemin chaud interactif. Correctif envisageable (garder les
    éléments vivants entre les frames, ne mettre à jour que
    `style.top`/`style.bottom`/`textContent`) mais touche un mécanisme de
    rendu utilisé pendant un geste utilisateur actif — à traiter avec un
    test manuel/Playwright dédié plutôt qu'en correctif à l'aveugle,
    même prudence que celle déjà appliquée aux gestes de glisser-déposer
    de ce projet (Revues n°2/n°4/n°5).
  - `redessinerPlageVisible()` reconstruit l'intégralité des tableaux de
    données de chaque dataset Chart.js à chaque frame de zoom
    (`construireDatasetsPrix()`, y compris le ré-`map()` complet de la
    ligne « Clôture veille » et le re-découpage des 5 tableaux du canal
    de régression) plutôt que de muter en place
    `chartInstance.data.datasets[i].data` pour les seuls datasets déjà
    existants. Signalé par l'agent efficacité. Correctif plus profond
    (Chart.js n'a besoin que des tableaux `data` mis à jour pour
    `update('none')`, pas de reconstruire les objets de style) mais
    touche le même mécanisme de rendu interactif que le point
    précédent — même prudence.
  - `chargerGraphique()` (`public/app.js`) embarque directement la
    condition `mqPaysage.matches ? calculerCanalRegression(prices) :
    null` dans la fonction générique de chargement du graphique, partagée
    par les valeurs, les indices et les sections partagées — signalé par
    l'agent altitude comme la même catégorie de couplage que celle déjà
    corrigée en Session 30/Revue n°4 pour `placementAlerteActif` (résolue
    à l'époque en faisant émettre un évènement générique `chart:loaded`
    plutôt qu'une branche codée en dur). Défendable ici (le calcul du
    canal est coûteux et n'est de toute façon consommé que par
    `construireDatasetsPrix()`/`trancheGraphique()` quand `tranche.canal`
    est vrai), mais rend le chargeur générique non plus agnostique de
    l'orientation — déplacer entièrement la condition derrière ses
    consommateurs réels changerait un mécanisme central utilisé par
    plusieurs types de graphiques, à valider avec prudence dans une
    session dédiée plutôt qu'en correctif à risque faible ce cycle.
  - `chargerPartagesSection()` (`public/app.js`, Session 52) mute
    `sectionCiblePartage.partagee` en effet de bord au retour du
    chargement de la liste des partages, pour piloter l'indicateur «
    icône allumée » d'une fonctionnalité distincte — signalé par l'agent
    altitude. Ce mécanisme ne fonctionne que parce que
    `sectionCiblePartage` se trouve être la même référence Alpine que
    l'objet rendu par le `x-for` de `$store.portfolio.sections`, un
    couplage implicite dont dépend désormais silencieusement la
    fonction. Une profondeur plus propre calculerait/exposerait
    `partagee` comme une valeur dérivée, ou la mettrait à jour aux points
    qui mutent réellement les partages (`ajouterPartage()`/
    `supprimerPartage()`) plutôt que dans le chargeur de liste — non
    traité cette session (fonctionnement correct, couplage pragmatique
    déjà toléré à l'échelle de ce projet selon l'agent lui-même).
  - `EXISTS(SELECT 1 FROM section_shares WHERE section_id =
    sections.id) AS partagee` (`server/routes/sections.js`, `GET
    /sections`, Session 52) reste une prédicat `EXISTS(...)` ad hoc en
    ligne plutôt qu'une constante nommée partagée, contrairement à la
    convention déjà établie par le projet pour ce même motif
    (`HAS_ALERTE_SUBQUERY`, `server/valeurs.js`, Revue n°3) — signalé par
    l'agent altitude comme point de vigilance, pas un défaut actuel : une
    seule occurrence à ce jour, extraction non justifiée tant qu'un
    second site n'apparaît pas. Cette même sous-requête est en outre
    calculée pour chaque ligne renvoyée par `GET /sections`, y compris
    les sections de la section « Partagé avec moi » où `partagee` n'est
    jamais lue (`toSectionsArray()` ne la lit que pour `role ===
    'proprietaire'`) — coût négligible à l'échelle de ce projet (quelques
    sections par utilisateur), signalé par l'agent efficacité, laissé tel
    quel plutôt que d'introduire un `CASE WHEN` conditionnel pour un
    gain non mesurable.
  - Correctifs reportés des revues n°1 à n°8 toujours non traités (liste
    inchangée, voir Revues n°1 à n°8 ci-dessus) — aucun n'a été adressé
    cette session.
