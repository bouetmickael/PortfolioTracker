# BACKLOG.md — Avancement, session en cours, backlog produit

> Fichier propriétaire de l'état d'avancement et du compteur de sessions
> (cycle défini dans `METHOD.md` §0.1/§0.2). Voir `CLAUDE.md` pour le point
> d'entrée.

## Compteur de sessions depuis la dernière revue de dette technique

**0/3** — revue de dette technique effectuée le 2026-07-24 (première
revue du projet, voir `CLAUDE.md` § Historique des revues de dette
technique et `TODO.md`). La prochaine session reprend la fonctionnalité
en cours (Session B ci-dessous).

## Fonctionnalité en cours

**Refonte ergonomie liste des valeurs** (plan multi-sessions approuvé le
2026-07-24, voir `/root/.claude/plans/fluttering-spinning-swing.md` pour
l'architecture complète) : glisser-déposer, sections, badges d'alerte,
partage RW de section entre utilisateurs. Découpage :

- [x] **Session A — socle Alpine.js** : Alpine.js vendorisé
  (`public/vendor/alpine.min.js`), rendu de la liste des valeurs migré sur
  un store réactif (`Alpine.store('portfolio')`), parité visuelle stricte
  avec l'existant (aucune fonctionnalité nouvelle visible). Fait cette
  session.
- [ ] **Session B — sections + drag-and-drop** (perso, sans partage) :
  migration DB (`sections`, `section_id`/`ordre` sur `valeurs`), API
  sections + `PUT /reorder`, UI créer/renommer/supprimer section et
  glisser-déposer (SortableJS).
- [ ] **Session C — badges d'alerte** : `alertes.valeur_id` + backfill,
  `hasAlerte` exposé par l'API, badge visuel sur les lignes.
- [ ] **Session D — partage RW de section** : `section_shares`,
  `GET /api/users`, contrôle d'accès, modale de partage, amendement
  explicite de `BUSINESS_RULES.md` (isolation stricte), tests d'accès
  croisé entre deux comptes.

## Backlog produit

- **Remplacer les 3 tuiles statistiques du haut par le suivi de 3
  indices de marché** (demande explicite utilisateur, 2026-07-24) : les
  cartes `stat-card` actuelles (`#statTotal`/`#statHausse`/`#statBaisse`
  dans `public/index.html`, comptage des valeurs suivies en hausse/baisse,
  voir `DESIGN.md` § Composants) sont remplacées par le suivi de 3 indices
  boursiers : **SBF 120**, **Nasdaq-100**, **S&P 500**. À préciser avant
  implémentation (arbitrage utilisateur) : source des cours (probablement
  le même mécanisme Yahoo Finance que les valeurs suivies, voir
  `server/jobs/prices.js`/`ARCHITECTURE.md` § Points de vigilance, tickers
  Yahoo pressentis `^SBF120`/`^NDX`/`^GSPC` à vérifier), fréquence de
  rafraîchissement, et ce qui doit s'afficher sur chaque tuile (cours,
  variation du jour, les deux). Pas de contrainte de rétro-compatibilité :
  aucun utilisateur externe à ce projet personnel/familial.

À compléter au-delà de ce point — aucune autre source du dépôt (issue
tracker, notes de session, roadmap) ne liste de prochaines fonctionnalités
prévues au-delà du plan ci-dessus et du point ci-dessus. Ne pas confondre
avec les « limites connues » listées dans `SPECIFICATION_FONCTIONNELLE.md`
(PER sectoriel, screening, Greeks, volatilité implicite, parité) : ce sont
des limites assumées par le README public, pas des éléments déjà
priorisés pour une future session — à faire arbitrer par l'utilisateur
avant de les inscrire ici.
