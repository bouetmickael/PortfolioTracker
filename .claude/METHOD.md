# METHOD.md — Méthode de travail générique

> **Objectif de ce document** : décrire une **méthode de travail
> réutilisable d'un projet à l'autre** (mode session, cycle de revue de
> dette technique, workflow git, outillage). Il ne contient **aucune
> information spécifique à un projet donné** — tout ce qui est propre au
> projet courant (stack, architecture, règles métier, conventions de code,
> historique) vit dans les fichiers du projet lui-même (`CLAUDE.md`,
> `ARCHITECTURE.md`, `BUSINESS_RULES.md`, `BACKLOG.md`, etc., voir §1).
> Objectif secondaire : pouvoir copier ce fichier tel quel dans un nouveau
> projet.

Respecter ce cadre à chaque session, sans exception. L'utilisateur ne le
rappellera pas explicitement.

---

## 0. Bootstrap — outillage requis

Avant de démarrer un cycle (§0.1 ou §0.2), vérifier que les skills/plugins
nécessaires à cette méthode sont disponibles (liste des skills chargées en
début de session). Au minimum :

- Un skill/commande de simplification de code diff (ex. `/simplify`) — requis
  pour le cycle de revue (§0.2 étape 1).
- Un skill/plugin de direction esthétique par défaut (ex.
  `frontend-design@claude-plugins-official`) — requis dès qu'une tâche touche
  l'UI et qu'aucun skill de design dédié au projet n'est installé.
- Un plugin de commits/PR (ex. `commit-commands@claude-plugins-official`) —
  pour committer/pousser/ouvrir des PR de façon homogène.
- Tout skill/plugin additionnel listé au §6 de ce fichier pour le projet
  courant.

**Si l'un de ces outils est absent**, l'installer avant de poursuivre
(commande d'installation de plugin/marketplace de l'environnement, ex.
`/plugin install <nom>@<marketplace>`) plutôt que d'improviser une version
dégradée de l'étape qui en dépend. Documenter au §6 tout skill/plugin
ajouté spécifiquement pour ce projet.

---

## 0.1 Cycle obligatoire par fonctionnalité

1. Lire intégralement ce fichier **et** `CLAUDE.md` (+ fichiers référencés
   au §1 ci-dessus) avant toute action.
2. Implémenter la fonctionnalité demandée en respectant strictement les
   conventions de code et les règles métier du projet.
3. Écrire les **tests unitaires** correspondants et les exécuter. La session
   n'est pas terminée tant que les tests ne passent pas.
4. **Incrémenter le compteur de version du projet** et journaliser le
   changement — voir §5.5. Chaque session fonctionnelle correspond à une
   version, sans exception, y compris pour un changement purement visuel
   ou interne sans impact fonctionnel visible.
5. Committer et **pousser sur la branche d'intégration unique du projet**
   (voir §5 — Git Workflow). Ne jamais créer ou pousser sur une autre
   branche sans autorisation explicite de l'utilisateur.
6. Déployer et **vérifier que l'application est réellement opérationnelle**
   (pas seulement que le build/les tests passent) — voir §5.4.
7. Mettre à jour `BACKLOG.md` : avancement, fonctionnalité en cours,
   compteur de sessions depuis la dernière revue (+1).
8. Mettre à jour les règles métier (`BUSINESS_RULES.md`) si de nouvelles ont
   été fournies ou si des modifications sont nécessaires.
9. **Demander** : « Souhaitez-vous clore la session pour continuer dans une
   nouvelle ? » Ne pas continuer à coder dans la même session après cette
   question.
10. Si oui → fournir le **prompt exact** de la session suivante (§0.3) :
   - soit la prochaine fonctionnalité du backlog (`BACKLOG.md`),
   - soit — si le compteur atteint 5/5 — le déclenchement du cycle de revue
     (§0.2).

## 0.2 Cycle de revue obligatoire (toutes les 5 sessions)

Dès que le compteur de `BACKLOG.md` atteint 5/5, la session suivante est
**obligatoirement** une revue de dette technique, et non une nouvelle
fonctionnalité :

1. Vérifier l'outillage requis (§0 Bootstrap) et l'installer si besoin.
2. Lancer le skill/commande de simplification (ex. `/simplify`) sur le diff
   cumulé des sessions couvertes depuis la dernière revue, pour détecter le
   code mort et la complexité inutile introduite depuis lors.
3. Lancer une revue complète de dette technique portant sur :
   - composants dupliqués ou quasi-dupliqués,
   - fonctions identiques ou très similaires disséminées dans le code,
   - violations DRY, complexité cyclomatique excessive.
4. Appliquer les correctifs identifiés dont le risque est faible et le
   comportement inchangé ; documenter (sans les corriger dans cette même
   session) les correctifs plus profonds ou risqués, pour une session
   dédiée future.
5. Committer et pousser les correctifs — **sur la branche d'intégration
   unique du projet**, comme n'importe quelle autre session (§5). Ne jamais
   créer de branche de revue séparée.
6. Réinitialiser le compteur à 0/5 dans `BACKLOG.md` et journaliser la
   revue (date, portée, correctifs appliqués, correctifs reportés) dans la
   section « Historique des revues » de `CLAUDE.md`.
7. Fournir le prompt de la prochaine fonctionnalité du backlog (§0.3).

## 0.3 Format du prompt de nouvelle session

```
--- PROMPT NOUVELLE SESSION ---

## Contexte
<Description courte du projet et de l'avancement>
Lire CLAUDE.md en premier (il référence METHOD.md, BUSINESS_RULES.md,
BACKLOG.md et les autres documents du projet).

## Branche de travail
git fetch origin <branche-intégration> && git checkout <branche-intégration>

## Convention commits
Session N - description courte

## Déjà implémenté
Voir BACKLOG.md / historique dans le fichier de suivi de sessions du projet.

## Instruction
Implémenter en respectant intégralement CLAUDE.md, BUSINESS_RULES.md et
METHOD.md.
En fin de session : suivre le cycle §0.1 (tests, commit, push, déploiement
+ vérification, mise à jour BACKLOG.md).

## Prochaine fonctionnalité
[Description précise de ce qui est à faire]
[Critères d'acceptation]
[Fichiers concernés]

--- FIN DU PROMPT ---
```

### Pourquoi ce mode ?
- Évite la dégradation du contexte sur les longues sessions.
- Chaque session repart d'un contexte propre avec un état connu du code.
- La limite de fonctionnalités par session garantit des commits ciblés et
  réversibles.
- Le prompt généré est copié-collé manuellement dans une nouvelle
  conversation.

### Règles complémentaires
- L'IA ne peut pas ouvrir un onglet automatiquement — elle génère le
  prompt, l'utilisateur l'ouvre.
- Les fichiers de méthode/règles sont relus intégralement à chaque session.
- Toute règle de méthode importante ajoutée en cours de session doit être
  écrite dans **ce fichier** (pas dans `CLAUDE.md`) **avant** le commit
  final ; toute règle spécifique au projet ajoutée en cours de session doit
  être écrite dans `CLAUDE.md`/`BUSINESS_RULES.md` (pas ici).
- Le fichier de suivi d'avancement (`BACKLOG.md`) doit avoir son statut mis
  à jour avant chaque commit final.

---

## 1. Où vivent les informations spécifiques au projet

Ce fichier (`METHOD.md`) ne décrit QUE la méthode. Toute information propre
au projet courant est documentée ailleurs, jamais ici :

| Information | Fichier |
|---|---|
| Présentation, contexte | `CLAUDE.md` |
| Nom de la branche d'intégration unique | `CLAUDE.md` (§ règle branche) |
| Stack technique, architecture en couches, arborescence réelle, conventions de code | `ARCHITECTURE.md` (ou équivalent référencé par `CLAUDE.md`) |
| Règles de design (palette, typographie, composants) | `DESIGN.md` (ou équivalent référencé par `CLAUDE.md`) |
| Règles métier (RBAC, workflows, machine à états, modèle économique…) | `BUSINESS_RULES.md` |
| État d'avancement, fonctionnalité en cours, compteur de sessions | `BACKLOG.md` |
| Historique des revues de dette technique | `CLAUDE.md` (section dédiée) |
| Backlog / prochaines fonctionnalités | `BACKLOG.md` |
| Déploiement (Docker, hébergement, etc.) | `DOCKER.md` (ou équivalent) |
| Skills/plugins spécifiquement requis par CE projet | §6 de ce fichier |

Si l'un de ces fichiers n'existe pas encore pour le projet courant, le créer
au lancement de la méthode (§0.1 étape 1) plutôt que d'improviser son
contenu dans `CLAUDE.md`. Ne jamais dupliquer un contenu entre deux
fichiers : chaque information a un seul fichier propriétaire, les autres
s'y réfèrent par pointeur (« voir `X.md` §Y »).

---

## 5. Git Workflow

- **Une seule branche d'intégration** pour tout le projet (son nom est
  déclaré dans `CLAUDE.md`, ex. `dev_v1.0`, `main`…). Aucun développement
  n'est livré ailleurs, sauf autorisation explicite de l'utilisateur pour
  un besoin ponctuel.
- **Particularité plateforme (environnements imposant une branche
  technique temporaire, ex. Claude Code sur le web)** : si l'environnement
  crée automatiquement une branche de session (`claude/...` ou équivalent),
  alors :
  0. **Dès la création de cette branche technique, rapatrier immédiatement
     le contenu de la branche d'intégration dedans** (`git fetch origin
     <branche-intégration>` puis `git merge --ff-only origin/<branche-
     intégration>`, ou rebase). Sans cette étape la branche est vide et la
     session démarre sur un état faux — c'est aussi ce qui garantit un
     fast-forward propre à la clôture.
  1. Développer et committer sur cette branche technique.
  2. À la clôture de session, et **uniquement sur feu vert explicite de
     l'utilisateur**, fusionner (fast-forward si possible) vers la branche
     d'intégration puis la pousser.
  3. Ne jamais pousser sur une autre branche d'intégration que celle
     déclarée dans `CLAUDE.md`, sans permission explicite.
  Si aucune branche technique n'est imposée par l'environnement, travailler
  directement sur la branche d'intégration.
- **Push en fin de session** (§0.1 étape 5) : jamais de commit qui reste
  local à la fin d'une session validée par l'utilisateur.
- **Convention de message de commit** : `Session N - description courte`,
  en anglais (sauf indication contraire du projet dans `CLAUDE.md`).
- **Ne jamais** committer un secret en clair, ni utiliser `--no-verify` /
  `--no-gpg-sign` sans demande explicite.

### 5.4 Déploiement et vérification en fin de session
- Déployer la version courante par le moyen pertinent pour le projet (voir
  le fichier de déploiement référencé au §1, ex. `DOCKER.md`).
- Vérifier que l'application répond réellement (ex. un endpoint de santé
  `/api/health` → `"status":"ok"`), pas seulement que le build/les tests
  passent.
- **Ne pas proposer de clore la session tant que la nouvelle version n'est
  pas déployée et opérationnelle.** Un échec de déploiement doit être
  diagnostiqué et résolu avant de poser la question de clôture (§0.1
  étape 9).

### 5.5 Compteur de version

Chaque **session fonctionnelle** (cycle §0.1) doit incrémenter le
compteur de version du projet, sans exception — y compris pour un
changement mineur ou sans impact fonctionnel visible. Objectif : que le
numéro de version affiché/exposé par l'application (et lu par un éventuel
mécanisme de mise à jour, ex. un Supervisor Home Assistant) reflète
toujours fidèlement la dernière session livrée, sans dépendre d'une étape
de « release » séparée et facultative que l'on oublie de déclencher.

- Le ou les fichiers qui portent ce compteur pour le projet courant (ex.
  un descripteur de package, un manifeste d'add-on/plateforme) sont
  documentés dans le fichier de déploiement référencé au §1 (ex.
  `DOCKER.md`) — ne pas les improviser ici, ce fichier ne connaît que la
  règle, pas l'emplacement technique propre au projet.
- Incrémenter en version « patch » (dernier chiffre d'un schéma
  sémantique `MAJEUR.MINEUR.PATCH`) par défaut ; réserver un incrément
  MINEUR/MAJEUR à une demande explicite de l'utilisateur ou à un
  changement dont l'ampleur le justifie clairement.
- Si plusieurs fichiers portent le même numéro (ex. manifeste de
  plateforme et descripteur de package), les incrémenter et les
  synchroniser ensemble dans le même commit — jamais l'un sans l'autre.
- Journaliser le changement dans le fichier de changelog du projet s'il en
  existe un (ex. `CHANGELOG.md`), avec une description courte orientée
  utilisateur.
- Le cycle de revue de dette technique (§0.2) n'est **pas** une session
  fonctionnelle au sens de cette règle : il n'incrémente le compteur de
  version que si les correctifs appliqués changent un comportement
  observable par l'utilisateur (à apprécier au cas par cas), pas pour un
  correctif strictement interne (renommage, extraction de fonction, etc.).

---

## 6. Plugins & Skills installés sur ce projet

| Type | Nom | Usage |
|---|---|---|
| Commande native | `/simplify` | Détection de code mort et de complexité inutile, obligatoire au cycle de revue (§0.2) |

> Tenir cette table à jour pour CE projet ; elle ne doit pas contenir de
> règle de méthode générique (celles-ci vivent dans les sections
> ci-dessus). Aucun plugin marketplace (`commit-commands`,
> `frontend-design`, etc.) n'est installé dans cet environnement à ce
> jour : les lignes correspondantes ont été retirées plutôt que déclarées
> présentes à tort. Les réinstaller (§0 Bootstrap) avant de s'appuyer
> dessus, et compléter cette table en conséquence.
