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
immédiat du contenu de `main`, fusion vers `main` uniquement sur feu vert
explicite de l'utilisateur).

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

Aucune revue effectuée à ce jour (compteur `BACKLOG.md` à 0/3). Chaque
revue future (cycle `METHOD.md` §0.2) doit ajouter ici une entrée : date,
portée, correctifs appliqués, correctifs reportés.
