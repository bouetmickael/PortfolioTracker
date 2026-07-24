# DOCKER.md — Déploiement

> Fichier propriétaire des faits techniques de déploiement nécessaires à
> une session Claude Code (fichiers impliqués, variables, vérification).
> Pour le tutoriel pas-à-pas destiné à un utilisateur final (SSH, WinSCP,
> DuckDNS...), voir `README.md`, qui reste la référence pour cette partie
> afin de ne pas dupliquer un contenu déjà détaillé et à jour. Voir
> `CLAUDE.md` pour le point d'entrée.

## Deux modes de déploiement, un seul Dockerfile

| Mode | Cible | Fichiers de configuration |
|---|---|---|
| Home Assistant Add-on | Raspberry Pi sous Home Assistant OS (HAOS) | `config.yaml`, `repository.yaml`, options traduites par `server/load-addon-options.js` |
| Docker Compose | Linux générique (Raspberry Pi OS, Debian, Ubuntu...) | `docker-compose.yml`, `.env` (voir `.env.example`) |

Les deux modes partagent le même `Dockerfile` et le même code serveur
(`server/`, `public/`). Seule diffère la source de configuration : fichier
`.env` lu par `dotenv` (Docker Compose), ou `/data/options.json` rempli par
le Supervisor (Add-on), traduit vers les mêmes variables d'environnement
par `server/load-addon-options.js`. Une variable d'environnement déjà
définie est toujours prioritaire sur `options.json`.

## Commandes essentielles

```bash
# Docker Compose
cp .env.example .env   # puis editer SESSION_SECRET (obligatoire), SMTP_* (optionnel)
docker compose up -d --build
docker compose logs -f

# Sans Docker (developpement local)
cd server && npm install
cp ../.env.example .env   # decommenter DB_PATH=./data/portfolio.db
node index.js
```

Le détail complet du mode Home Assistant Add-on (copie des fichiers via
SSH/rsync/WinSCP, activation dans l'interface, accès HTTPS via DuckDNS) est
dans `README.md` et n'est pas reproduit ici.

## Numero de version affiche dans l'application

`server/package.json` (`version`) est la source unique lue par
`GET /api/version` (voir `server/app.js`), affichee dans le header de
`public/index.html` pour que l'utilisateur verifie qu'il consulte bien la
derniere version deployee. **A chaque session fonctionnelle (METHOD.md
§5.5, pas seulement a une "release" ponctuelle), incrementer cette
valeur et la synchroniser manuellement avec `version` dans
`config.yaml`** (celle que lit le Supervisor Home Assistant pour
proposer une mise a jour, voir `README.md` "Mettre a jour l'add-on plus
tard") : les deux fichiers existent pour des raisons structurelles
differentes (manifeste Add-on vs descripteur npm, pas de build step pour
les unifier), mais doivent rester numeriquement identiques et etre
commites ensemble. Journaliser chaque increment dans `CHANGELOG.md`.

## Variables d'environnement / options clés

- `SESSION_SECRET` (obligatoire en usage réel, voir `BUSINESS_RULES.md`).
- `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/`SMTP_PASS`/`MAIL_FROM`
  (optionnels, alertes par email).
- `HOST_PORT` (Docker Compose, port exposé sur l'hôte, 3000 par défaut).
- `HTTPS_ENABLED`/`HTTPS_PORT`/`SSL_CERTFILE`/`SSL_KEYFILE` (serveur HTTPS
  parallèle, `server/index.js`, certificats attendus dans `/ssl` ou
  `SSL_DIR`).
- `DB_PATH` (surcharge le chemin SQLite, utile hors Docker ; par défaut
  `/data/portfolio.db` dans le conteneur).

## Stockage persistant

- Docker Compose : volume `./data:/data` dans `docker-compose.yml`.
- Home Assistant Add-on : fourni automatiquement par le Supervisor
  (`map: [data:rw, ssl:ro]` dans `config.yaml`), survit aux mises à jour de
  HAOS et de l'add-on.
- Sauvegarde : copier le fichier SQLite unique (`portfolio.db`), le service
  peut rester démarré (mode WAL, accès concurrents gérés).

## Vérifier qu'un déploiement est réellement opérationnel

Conformément à `METHOD.md` §5.4, ne pas se limiter à un build/tests
réussis :

```bash
docker compose logs -f
```

Les logs doivent montrer l'exécution périodique des deux tâches
planifiées (`Demarrage mise a jour des cours`, `Demarrage verification
alertes`, toutes les 2 minutes) sans erreur bloquante. Il n'existe pas
d'endpoint `/api/health` dédié à ce jour : la vérification de bon
fonctionnement passe par ces logs et/ou un accès manuel à
`http://<hote>:<port>/`.
