# BACKLOG.md — Avancement, session en cours, backlog produit

> Fichier propriétaire de l'état d'avancement et du compteur de sessions
> (cycle défini dans `METHOD.md` §0.1/§0.2). Voir `CLAUDE.md` pour le point
> d'entrée.

## Compteur de sessions depuis la dernière revue de dette technique

**1/3** — revue de dette technique n°4 effectuée le 2026-07-25 (voir
`CLAUDE.md` § Historique des revues de dette technique), portant sur le
diff cumulé depuis la revue n°3 (Session 15 tuiles d'indices, Session 16
périmètre smartphone-only + CSS, Session 17 alerte depuis le graphique).
Compteur réinitialisé à 0/3, puis incrémenté à 1/3 par la Session 19
(alertes existantes affichées sur le graphique, v1.8.0, voir ci-dessous).

## Session hors plan — refonte visuelle + theme clair/sombre (2026-07-25)

Demande explicite de l'utilisateur (captures d'écran de l'ancienne
version du projet, avant la refonte Material sobre) : retour au style
visuel de l'ancienne version (en-tête bleu marine, accent or, icônes SVG,
sections repliables, cartes stats à bordure colorée) + thème clair/sombre
fonctionnel. Détail complet dans `DESIGN.md` (nouvelle direction
générale) et `TODO.md`. Deux éléments vus sur les captures explicitement
**non repris** cette session (voir arbitrage utilisateur) :
- badges de recommandation (ACHAT/NEUTRE) : aucune donnée correspondante
  dans le modèle actuel, pas demandé comme nouvelle fonctionnalité ;
- portefeuilles partagés : correspond à la Session D déjà planifiée
  ci-dessous, ordre du backlog conservé (Session C avant Session D).

**Correctif (même jour, v1.3.1)** : retour utilisateur après vérification
visuelle — le glisser-déposer d'une valeur ne doit pas se déclencher
depuis n'importe quel point de la ligne, sous peine de gêner le scroll
tactile de la page. Ajout d'une poignée dédiée (`.valeur-drag-handle`,
icône `icon-grip`) à gauche de chaque ligne, seule à porter `touch-
action: none` ; le reste de la ligne reste cliquable (ouverture du
graphique) et scrolle normalement. Voir `DESIGN.md` § Liste des valeurs
suivies.

**Correctif (même jour, v1.3.2)** : autre retour utilisateur — les
popups navigateur natives (`prompt()`/`confirm()`, utilisées pour créer/
renommer/supprimer une section ou supprimer une valeur/alerte) gardaient
l'apparence brute du système, hors charte graphique et incohérentes avec
le thème clair/sombre. Remplacées par deux modales génériques
réutilisables (`#modalPrompt`/`#modalConfirm`, résolues comme des
`Promise`). Voir `DESIGN.md` § Modales.

## Fonctionnalité en cours

**Refonte ergonomie liste des valeurs** (plan multi-sessions approuvé le
2026-07-24, voir `/root/.claude/plans/fluttering-spinning-swing.md` pour
l'architecture complète) : glisser-déposer, sections, badges d'alerte,
partage RW de section entre utilisateurs. **Plan complet, les quatre
sessions sont livrées** (voir découpage ci-dessous). Aucune fonctionnalité
en cours actuellement : la revue de dette technique n°3 vient de clore le
cycle (voir `CLAUDE.md` § Historique des revues, compteur remis à 0/3
ci-dessus) — la prochaine session porte sur le prochain point du backlog
produit ci-après, à arbitrer avec l'utilisateur.

- [x] **Session A — socle Alpine.js** : Alpine.js vendorisé
  (`public/vendor/alpine.min.js`), rendu de la liste des valeurs migré sur
  un store réactif (`Alpine.store('portfolio')`), parité visuelle stricte
  avec l'existant (aucune fonctionnalité nouvelle visible). Fait cette
  session.
- [x] **Session B — sections + drag-and-drop** (perso, sans partage) :
  migration DB (`sections`, `section_id`/`ordre` sur `valeurs`, backfill
  d'une section "General" pour les comptes existants), API sections
  (`server/routes/sections.js`, CRUD + `PUT /reorder`), UI créer
  (`+ Nouvelle section`) / renommer (`M`) / supprimer (`X`) une section
  et glisser-déposer (SortableJS vendorisé, valeurs entre/dans les
  sections + sections elles-mêmes). Fait cette session (2026-07-25).
- [x] **Session C — badges d'alerte** : `alertes.valeur_id` + backfill,
  `hasAlerte` exposé par l'API, badge visuel sur les lignes. Fait cette
  session (2026-07-25).
- [x] **Session D — partage RW de section** : table `section_shares`
  (section_id/user_id/role), `GET /api/users` (liste restreinte pour la
  sélection d'un destinataire), routes imbriquées
  `/api/sections/:id/partages` (CRUD des partages, réservé au
  propriétaire) et `/api/sections/:id/valeurs` (consultation/écriture
  d'une section partagée selon le rôle), modale de partage
  (`#modalPartage`) et nouveau bloc "Partagé avec moi" dans l'UI,
  amendement explicite de `BUSINESS_RULES.md` (§ Partage de section),
  tests d'accès croisé entre deux comptes
  (`server/test/partage.test.js`). Fait cette session (2026-07-25).
  `GET /api/valeurs` (liste principale) reste inchangée et strictement
  limitée aux valeurs propres de l'utilisateur ; les valeurs des sections
  partagées ne sont exposées que par les nouvelles routes dédiées, une
  section à la fois (évite toute ambiguïté de ticker entre comptes).

## Sessions précédentes

- [x] **Session E — tuiles d'indices de marché** (demande explicite
  utilisateur, 2026-07-24) : les cartes `stat-card` (`#statTotal`/
  `#statHausse`/`#statBaisse`, comptage des valeurs suivies en
  hausse/baisse) sont remplacées par le suivi de 3 indices boursiers :
  **SBF 120** (`^SBF120`), **Nasdaq-100** (`^NDX`), **S&P 500**
  (`^GSPC`). Arbitrage utilisateur (voir historique de session) : même
  mécanisme Yahoo Finance que les valeurs suivies, même fréquence de
  rafraîchissement (cron 2 min), tuile affichant nom + cours (avec
  devise d'origine EUR/USD) + variation du jour. Nouvelle table
  `indices_marche` (données globales, non rattachées à un utilisateur —
  voir `BUSINESS_RULES.md` § Indices de marché), nouvelle route
  `GET /api/indices`, `updateIndices()` dans `server/jobs/prices.js`.
  Fait le 2026-07-25.
- [x] **Revue de dette technique n°3** : voir `CLAUDE.md` § Historique
  des revues de dette technique. Compteur remis à 0/3 (voir ci-dessus).
  Fait le 2026-07-25.
- [x] **Correctif tuiles d'indices de marché (v1.6.1)** : retour
  utilisateur sur la Session E (v1.6.0) — les tuiles `.stat-card`
  n'avaient aucune interaction au clic, et le cours suivi de sa devise
  (ex. « 28128.34 USD ») repassait à la ligne sur mobile, rendant les
  tuiles disproportionnellement hautes. Les tuiles sont désormais
  cliquables (ouvrent le graphique historique de l'indice via le même
  mécanisme `openGraphique()` que les valeurs suivies) et compactées sur
  mobile (`DESIGN.md` § Cartes statistiques). Fait le 2026-07-25.
- [x] **Précision de périmètre : usage exclusivement smartphone (v1.6.2)**
  (demande explicite utilisateur) : documenté dans `CLAUDE.md` §
  Présentation du projet — l'application n'a jamais vocation à être
  utilisée depuis un navigateur de bureau ou une tablette. Conséquence
  appliquée à `public/styles.css` (`DESIGN.md` § Responsive) : retrait du
  système à deux niveaux (style de base large + correctif
  `@media (max-width: 640px)`), les valeurs mobiles deviennent les
  valeurs par défaut uniques, plus aucune règle `@media` de largeur dans
  la feuille de style. Aucun changement visuel pour l'utilisateur sur un
  vrai téléphone (déjà piloté par le correctif mobile auparavant). Fait
  le 2026-07-25.
- [x] **Alerte depuis le graphique (v1.7.0)** (demande explicite
  utilisateur, captures d'écran TradingView) : nouvelle voie de création
  d'une alerte de seuil par glisser-déposer directement sur le graphique
  historique d'une valeur (voir `DESIGN.md` § Alerte depuis le
  graphique), en plus du formulaire existant. Disponible uniquement sur
  mes propres valeurs suivies — jamais sur un indice de marché ni sur une
  valeur d'une section partagée avec moi, ces deux cas ne pouvant
  techniquement jamais déclencher d'alerte (voir `BUSINESS_RULES.md` §
  Alertes de seuil, jointure de `checkAlerts()`). Fait le 2026-07-25.
- [x] **Revue de dette technique n°4** : voir `CLAUDE.md` § Historique
  des revues de dette technique. Compteur remis à 0/3. Fait le
  2026-07-25.
- [x] **Alertes existantes sur le graphique (v1.8.0)** (demande explicite
  utilisateur) : les seuils d'alerte actifs d'une valeur suivie sont
  désormais matérialisés sur son graphique historique par une ligne fine
  pointillée et une pastille de prix (voir `DESIGN.md` § Alertes
  existantes sur le graphique). Un seuil hors de la plage de valeurs
  affichée par le graphique pour la période courante n'est pas tracé :
  un repère compact « hors limites » (flèche + prix) est affiché en haut
  ou en bas du graphique à la place, plutôt que de fausser l'échelle ou
  de masquer silencieusement l'alerte. Même restriction que la Session
  17 : uniquement sur mes propres valeurs suivies, jamais sur un indice
  de marché ni sur une valeur d'une section partagée. Fait le 2026-07-25.

## Backlog produit

À compléter au-delà de ce point — aucune autre source du dépôt (issue
tracker, notes de session, roadmap) ne liste de prochaines fonctionnalités
prévues au-delà du plan livré (Sessions A à E) et des sessions listées
ci-dessus. Ne pas confondre avec les « limites connues » listées dans
`SPECIFICATION_FONCTIONNELLE.md` (PER sectoriel, screening, Greeks,
volatilité implicite, parité) : ce sont des limites assumées par le
README public, pas des éléments déjà priorisés pour une future session —
à faire arbitrer par l'utilisateur avant de les inscrire ici. Le compteur
de revue est à 1/3 (voir ci-dessus) : la prochaine session peut être un
nouveau point de ce backlog, à arbitrer avec l'utilisateur.
