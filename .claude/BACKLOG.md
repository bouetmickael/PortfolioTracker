# BACKLOG.md — Avancement, session en cours, backlog produit

> Fichier propriétaire de l'état d'avancement et du compteur de sessions
> (cycle défini dans `METHOD.md` §0.1/§0.2). Voir `CLAUDE.md` pour le point
> d'entrée.

## Compteur de sessions depuis la dernière revue de dette technique

**3/3 — revue de dette technique obligatoire à la prochaine session (METHOD.md §0.2)**

Troisième session de développement sous le cycle décrit par `METHOD.md`
(2026-07-24, voir `TODO.md`). Aucune revue de dette technique n'a eu lieu
à ce jour : la session suivante doit être le cycle de revue (§0.2), pas la
Session B ci-dessous, avant de continuer la fonctionnalité en cours.

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

**Ordre imposé par METHOD.md §0.2 : la revue de dette technique (3/3)
passe avant la Session B.**

## Backlog produit

À compléter au-delà de ce point — aucune autre source du dépôt (issue
tracker, notes de session, roadmap) ne liste de prochaines fonctionnalités
prévues au-delà du plan ci-dessus. Ne pas confondre avec les « limites
connues » listées dans `SPECIFICATION_FONCTIONNELLE.md` (PER sectoriel,
screening, Greeks, volatilité implicite, parité) : ce sont des limites
assumées par le README public, pas des éléments déjà priorisés pour une
future session — à faire arbitrer par l'utilisateur avant de les inscrire
ici.
