# BACKLOG.md — Avancement, session en cours, backlog produit

> Fichier propriétaire de l'état d'avancement et du compteur de sessions
> (cycle défini dans `METHOD.md` §0.1/§0.2). Voir `CLAUDE.md` pour le point
> d'entrée.

## Compteur de sessions depuis la dernière revue de dette technique

**3/3** — revue de dette technique n°2 effectuée le 2026-07-25 (voir
`CLAUDE.md` § Historique des revues de dette technique et `TODO.md`),
portant sur le diff cumulé depuis la revue n°1 (Session B sections +
drag-and-drop, refonte visuelle + thème clair/sombre, et les deux
correctifs directs poignée de glisser-déposer / modales prompt-confirm).
Session C (badges d'alerte) livrée le 2026-07-25, compteur incrémenté à
1/3. Session D (partage RW de section) livrée le 2026-07-25, compteur
incrémenté à 2/3. Session E (tuiles d'indices de marché, ci-dessous)
livrée le 2026-07-25, compteur incrémenté à 3/3 — **le seuil est
atteint : la prochaine session doit être le cycle de revue de dette
technique (`METHOD.md` §0.2), pas une nouvelle fonctionnalité.**

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
sessions sont livrées** (voir découpage ci-dessous) — la prochaine
session porte sur le prochain point du backlog produit ci-après
(compteur de revue à 2/3, voir ci-dessus).

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

## Fonctionnalité livrée cette session

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
  Fait cette session (2026-07-25).

## Backlog produit

À compléter au-delà de ce point — aucune autre source du dépôt (issue
tracker, notes de session, roadmap) ne liste de prochaines fonctionnalités
prévues au-delà du plan ci-dessus et du point ci-dessus. Ne pas confondre
avec les « limites connues » listées dans `SPECIFICATION_FONCTIONNELLE.md`
(PER sectoriel, screening, Greeks, volatilité implicite, parité) : ce sont
des limites assumées par le README public, pas des éléments déjà
priorisés pour une future session — à faire arbitrer par l'utilisateur
avant de les inscrire ici. Le compteur de revue ayant atteint 3/3 (voir
ci-dessus), la prochaine session est de toute façon le cycle de revue de
dette technique (`METHOD.md` §0.2), pas un nouveau point de ce backlog.
