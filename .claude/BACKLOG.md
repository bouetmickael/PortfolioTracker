# BACKLOG.md — Avancement, session en cours, backlog produit

> Fichier propriétaire de l'état d'avancement et du compteur de sessions
> (cycle défini dans `METHOD.md` §0.1/§0.2). Voir `CLAUDE.md` pour le point
> d'entrée.

## Compteur de sessions depuis la dernière revue de dette technique

**1/3**

Première session de développement sous le cycle décrit par `METHOD.md`
(2026-07-24, voir `TODO.md`). Aucune revue de dette technique n'a eu lieu
à ce jour.

## Fonctionnalité en cours

Aucune. Toutes les fonctionnalités décrites dans
`SPECIFICATION_FONCTIONNELLE.md` sont déjà implémentées et en usage :
authentification locale, suivi de valeurs (actions/warrants), alertes de
seuil par email, graphiques historiques, PWA installable.

## Backlog produit

- **Mettre à jour `README.md`** : la section « Mettre à jour l'add-on plus
  tard » ne documente que la méthode manuelle SSH/rsync, alors que
  l'utilisateur a en réalité ajouté l'URL du dépôt au magasin d'add-ons
  Home Assistant (mise à jour via Supervisor > Vérifier les mises à jour,
  sans rsync). Clarifier les deux méthodes et laquelle utiliser selon le
  cas. Repéré en session 2026-07-24, pas encore traité (l'utilisateur n'a
  pas confirmé avant de clore la session).

À compléter au-delà de ce point — aucune autre source du dépôt (issue
tracker, notes de session, roadmap) ne liste de prochaines fonctionnalités
prévues. Ne pas confondre avec les « limites connues » listées dans
`SPECIFICATION_FONCTIONNELLE.md` (PER sectoriel, screening, Greeks,
volatilité implicite, parité) : ce sont des limites assumées par le README
public, pas des éléments déjà priorisés pour une future session — à faire
arbitrer par l'utilisateur avant de les inscrire ici.
