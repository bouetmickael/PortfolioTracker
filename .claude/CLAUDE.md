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
