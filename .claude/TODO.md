# TODO.md — Journal de sessions

> Journal détaillé, append-only, des sessions de travail. Pour l'état
> courant (compteur, fonctionnalité en cours), voir `BACKLOG.md` — ne pas
> dupliquer ici ce qui y est déjà tenu à jour. Voir `CLAUDE.md` pour le
> point d'entrée.

Aucun historique de sessions détaillé n'existait avant cette
restructuration : l'entrée ci-dessous est une **entrée rétrospective
unique** résumant l'état du projet à ce jour, reconstituée à partir de
`README.md`/`TROUBLESHOOTING.md` (aujourd'hui répartis dans les fichiers
`.claude/`), plutôt qu'un historique session par session inventé.

## 2026-07 (rétrospectif) — État du projet avant mise en place de la méthode

- **Origine** : le projet reposait initialement sur Firebase (Hosting,
  Cloud Functions, Realtime Database, Cloud Messaging, authentification
  Google).
- **Migration hors Firebase** : suite à une suppression accidentelle du
  compte/projet Firebase, l'application a été entièrement réécrite pour
  fonctionner en auto-hébergement, sans aucun service Firebase :
  Node.js/Express à la place de Cloud Functions, SQLite à la place de
  Realtime Database, sessions locales email/mot de passe (bcrypt) à la
  place de Firebase Auth (authentification Google retirée, jugée
  disproportionnée pour 2-3 utilisateurs connus), email SMTP optionnel à la
  place des notifications push FCM, polling HTTP à la place des listeners
  temps réel. Le code Firebase (`functions/`, `firebase.json`,
  `database.rules.json`, `.firebaserc`, `public/firebase-config.js`,
  `public/firebase-messaging-sw.js`) a été supprimé du dépôt.
  Un prompt de diagnostic de l'époque (`prompt-claude-code-diagnostic.md`,
  bug de mise à jour des cours via les Cloud Functions Firebase) a motivé
  cette réécriture ; il référençait du code aujourd'hui supprimé et n'a pas
  été conservé tel quel.
- **Packaging Home Assistant Add-on** : le seul Raspberry Pi disponible
  tournant sous Home Assistant OS (HAOS, hôte entièrement géré par le
  Supervisor), l'application a été packagée en plus comme Home Assistant
  Add-on (`config.yaml`, `repository.yaml`), en complément du mode Docker
  Compose conservé pour un usage sur un Linux générique (voir `DOCKER.md`).
- **Contrainte de style notée à cette période** : aucun émoji ni symbole
  spécial dans le code, y compris commentaires, chaînes de caractères et
  HTML (voir `ARCHITECTURE.md` §4).
- **État fonctionnel au moment de cette rétrospective** : authentification
  locale, suivi de valeurs (actions/warrants), alertes de seuil par email,
  graphiques historiques (Chart.js), PWA installable — voir
  `SPECIFICATION_FONCTIONNELLE.md`.

## 2026-07-24 — Restructuration de la documentation Claude Code

Mise en place de l'architecture `.claude/` (un fichier par sujet, référencé
par pointeur depuis `CLAUDE.md`, jamais dupliqué) : `METHOD.md` (méthode
générique), `CLAUDE.md` (point d'entrée), `ARCHITECTURE.md`,
`BUSINESS_RULES.md`, `SPECIFICATION_FONCTIONNELLE.md`, `BACKLOG.md`,
`DOCKER.md`, ce fichier. Contenu de `TROUBLESHOOTING.md` réparti dans ces
fichiers (historique ci-dessus, points de vigilance dans
`ARCHITECTURE.md` §5, règles dans `BUSINESS_RULES.md`).

## 2026-07-24 — Triage de bugs post-migration, redesign liste des valeurs

Première session de développement sous le cycle `METHOD.md` (compteur
`BACKLOG.md` : 0/3 -> 1/3). Point de départ : l'utilisateur signalait des
fonctionnalités « cassées ou différentes » sans les avoir encore listées ;
un seul point precis est remonté (le reste n'a pas été signalé).

- **Bug corrigé** : graphique 1J/1S n'affichait que 2 points (ligne
  droite) — `server/routes/chart.js` demandait `interval=1d` à Yahoo
  Finance quelle que soit la période sélectionnée. Bug préexistant dans la
  Cloud Function Firebase d'origine, pas une régression de la migration.
  Intervalle désormais adapté à la période (5 min pour 1J, 15 min pour
  1S), points sans cours filtrés, labels d'axe X avec heure pour 1J/1S.
- **Redesign de la liste des valeurs suivies** (demande explicite
  utilisateur, inspiration TradingView) : liste plate au lieu de cartes
  par valeur, avatar coloré (initiales du ticker), cours/variation
  empilés à droite en texte coloré simple, clic sur la ligne entière pour
  ouvrir le graphique (bouton `G` supprimé, `A`/`X` conservés).
  `DESIGN.md` mis à jour en conséquence.
- **Version affichée dans l'app** : `GET /api/version` (source :
  `server/package.json`) affiché dans le header, pour que l'utilisateur
  vérifie qu'il consulte bien la dernière version déployée sur son
  Raspberry Pi. `server/package.json` et `config.yaml` doivent être
  incrémentés ensemble à chaque release (documenté dans `DOCKER.md`) —
  bump fait cette session (1.1.0 -> 1.1.1) à l'occasion du correctif de
  graphique.
- **Règle de méthode ajoutée** (`CLAUDE.md`, pas ici — spécifique au
  projet) : l'utilisateur a demandé de ne plus attendre de feu vert
  explicite avant de fusionner `claude/...` vers `main` en fast-forward,
  contrairement au défaut de `METHOD.md` §5.
- **Reporté, non traité** : `README.md` ne documente que la mise à jour
  manuelle SSH/rsync, alors que l'utilisateur utilise désormais le
  magasin d'add-ons Home Assistant (dépôt ajouté par URL) — voir
  `BACKLOG.md`.

## 2026-07-24 — Finalisation du redesign de la liste des valeurs, README

Deuxième session de développement sous le cycle `METHOD.md` (compteur
`BACKLOG.md` : 1/3 -> 2/3).

- **Finalisation du redesign de la liste des valeurs** (session
  précédente marquée WIP, en attente de revue visuelle) : à partir d'une
  capture d'écran fournie par l'utilisateur, le nom de la valeur devient
  la première ligne (`.valeur-nom`, en avant, remplace le ticker en tête),
  `ticker · type` passe en seconde ligne secondaire (`.valeur-sousligne`,
  remplace les anciennes `.valeur-ligne1`/`.valeur-ticker`/`.valeur-type`).
  Couleur de fond des lignes/avatars inchangée (demande explicite).
  Vérifié par capture d'écran (Playwright, page HTML statique réutilisant
  `public/styles.css`) faute de pouvoir lancer l'app complète (auth/DB/SMTP)
  dans cet environnement. `DESIGN.md` mis à jour en conséquence.
- **README.md — méthode de mise à jour de l'add-on** : traité l'item
  reporté en session précédente. Section « Mettre à jour l'add-on plus
  tard » documente désormais les deux méthodes (magasin d'add-ons Home
  Assistant recommandé si le dépôt y a été ajouté par URL, ou méthode
  manuelle SSH/rsync conservée pour les installations existantes), sans
  modifier la section d'installation initiale (hors périmètre de cette
  session).
- **Non fait** : pas de vérification sur le Raspberry Pi réel (déploiement
  et `docker compose logs` / journal de l'add-on) — cet environnement de
  session (Claude Code sur le web) n'a pas accès au Pi de l'utilisateur.
  Vérification limitée à `node --check` sur les fichiers serveur/JS
  modifiés et à la capture d'écran ci-dessus.
