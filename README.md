# Portfolio Tracker

Outil de suivi de portefeuille (actions et warrants CTO BoursoBank) sous forme
de PWA (Progressive Web App), auto-hebergee (aucun service Firebase requis).

## Architecture

- `public/` : frontend (PWA)
- `server/` : backend (Node.js + Express)
  - `server/db.js` : base de donnees SQLite (fichier unique, cree automatiquement)
  - `server/routes/` : API REST (auth, valeurs, alertes, graphiques)
  - `server/jobs/` : taches planifiees (mise a jour des cours, verification des alertes)
- `Dockerfile`, `docker-compose.yml` : packaging pour execution sur un serveur
  personnel (ex. Raspberry Pi)

## Fonctionnalites

- Authentification par email/mot de passe (comptes locaux, isolation stricte
  des donnees par utilisateur)
- Suivi de valeurs (actions, warrants) avec cours et variation, rafraichis
  toutes les 2 minutes
- Alertes de seuil (haut/bas) envoyees par email
- Graphiques historiques (1J / 1S / 1M / 1A / Max) via Chart.js
- Installation sur mobile (Android/iOS) comme application native (PWA)

## Source de donnees et limites connues

- Cours et historique : Yahoo Finance (endpoint public non officiel, gratuit,
  delai d'environ 15 minutes sur les marches US, sans garantie de service).
  Voir `server/jobs/prices.js` et `server/routes/chart.js`.
- Non disponible en l'etat : PER sectoriel moyen, screening automatique par
  critere, Greeks/delta des warrants, volatilite implicite, parite.
- Aucune donnee n'est simulee : en cas d'echec de recuperation, la tache
  loggue l'erreur et n'ecrit rien (pas de valeur inventee).

## Prerequis

- Node.js 20 en local pour le developpement, ou Docker + Docker Compose pour
  le deploiement
- Un serveur qui tourne en continu (ex. Raspberry Pi), car les cours sont mis
  a jour par une tache planifiee toutes les 2 minutes

## Configuration initiale

1. Copier `.env.example` en `.env` et renseigner au minimum `SESSION_SECRET`
   (valeur aleatoire longue, ex. `openssl rand -hex 32`)
2. Optionnel : renseigner les variables `SMTP_*` pour recevoir les alertes de
   seuil par email. Sans configuration SMTP, les alertes sont uniquement
   loguees (aucun blocage de l'application)
3. Remplacer les icones temporaires `public/icons/icon-192.png` et
   `icon-512.png` par de vraies icones (voir https://www.pwabuilder.com/imageGenerator)

## Deploiement (Docker, recommande)

```bash
cp .env.example .env
# editer .env
docker compose up -d --build
```

L'application est alors accessible sur `http://<ip-du-serveur>:<HOST_PORT>`
(3000 par defaut). Les donnees SQLite sont persistees dans `./data/`.

### Cas particulier : Raspberry Pi deja utilise (ex. Home Assistant sur le port 443)

Ce service tourne sur son propre port (voir `HOST_PORT` dans `.env`), independant
de tout autre service HTTPS deja present sur la machine (ex. Home Assistant).
Aucune configuration partagee n'est necessaire pour un usage sur le reseau
local (`http://<ip-du-pi>:<HOST_PORT>`).

Pour un acces distant securise (HTTPS) sans toucher a la configuration
existante, la solution la plus simple est un tunnel sortant (ex. Cloudflare
Tunnel) qui expose ce port sur un sous-domaine, sans ouvrir de port entrant ni
gerer de certificat manuellement.

## Deploiement (sans Docker)

```bash
cd server
npm install
cp ../.env.example .env
node index.js
```

## Verification

```bash
docker compose logs -f
```

Les logs affichent l'execution des taches planifiees (`Demarrage mise a jour
des cours`, `Demarrage verification alertes`) toutes les 2 minutes, ainsi que
les eventuelles erreurs de recuperation des cours.

## Securite

Chaque route de l'API (`server/middleware/auth.js`) verifie que
l'utilisateur est authentifie (session cookie) et ne peut lire/ecrire que ses
propres donnees (filtrage par `user_id` en base). Les mots de passe sont
hashes avec bcrypt, jamais stockes en clair.

Le fichier `.env` contient des secrets (cle de session, identifiants SMTP) :
ne jamais le committer (deja exclu par `.gitignore`).
