# Portfolio Tracker

Outil de suivi de portefeuille (actions et warrants CTO BoursoBank) sous forme
de PWA (Progressive Web App), auto-hebergee (aucun service Firebase requis).

## Architecture

- `public/` : frontend (PWA)
- `server/` : backend (Node.js + Express)
  - `server/db.js` : base de donnees SQLite (fichier unique, cree automatiquement)
  - `server/routes/` : API REST (auth, valeurs, alertes, graphiques)
  - `server/jobs/` : taches planifiees (mise a jour des cours, verification des alertes)
  - `server/load-addon-options.js` : traduit la configuration Home Assistant
    Add-on (`/data/options.json`) vers les memes variables d'environnement
    que le mode Docker Compose
- `Dockerfile` : image utilisee dans les deux modes de deploiement ci-dessous
- `config.yaml`, `repository.yaml` : manifeste Home Assistant Add-on
- `docker-compose.yml` : packaging pour un serveur Linux generique (pas
  Home Assistant OS)

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

## Choisir son mode de deploiement

| Votre serveur | Mode a utiliser |
|---|---|
| Raspberry Pi sous **Home Assistant OS** (HAOS) | Home Assistant Add-on (section ci-dessous) |
| Raspberry Pi OS / Debian / Ubuntu / autre Linux generique | Docker Compose (section ci-dessous) |

Sur Home Assistant OS, le systeme hote est entierement gere par le
Supervisor : on n'y installe pas de conteneurs Docker independants a la main
(`docker compose` sur l'hote) sans risquer qu'ils soient perdus a la
prochaine mise a jour de l'OS. La voie supportee pour ajouter un service
persistant est un **Add-on**, qui utilise le meme `Dockerfile` mais est
installe et gere par le Supervisor (demarrage automatique, stockage
persistant garanti, configuration via une interface au lieu d'un fichier
`.env`).

## Installation : Home Assistant Add-on

Le dossier des add-ons locaux est `/addons/` a la racine du systeme de
fichiers Home Assistant (pas `/addons/local/` : "Local add-ons" est juste le
nom de section affiche dans l'interface, pas un chemin reel).

### 1. Recuperer les fichiers du depot sur votre ordinateur

Si ce n'est pas deja fait sur la machine que vous allez utiliser pour copier
les fichiers (pas forcement le Raspberry Pi) :

```bash
git clone https://github.com/bouetmickael/PortfolioTracker.git
```

Ou, sans installer git, bouton "Code > Download ZIP" sur la page GitHub du
depot, puis decompresser.

### 2. Recuperer les parametres de connexion SSH

Dans l'onglet **Configuration** de l'add-on **Advanced SSH & Web Terminal**,
noter :
- le port SSH configure (souvent `22222`, verifier votre configuration)
- le mode d'authentification que vous avez mis en place (cle SSH ou mot de
  passe)

### 3. Copier les fichiers vers `/addons/portfolio_tracker/`

Depuis un terminal sur votre ordinateur (Mac/Linux, ou Windows avec
WSL/Git Bash/PowerShell qui inclut `ssh`/`scp` nativement), a la racine du
depot clone/decompresse :

```bash
ssh -p 22222 root@<ip-du-pi> "mkdir -p /addons/portfolio_tracker"

rsync -avz -e "ssh -p 22222" \
  --exclude .git --exclude node_modules --exclude data --exclude .env \
  ./ root@<ip-du-pi>:/addons/portfolio_tracker/
```

(remplacer `22222` par le port note a l'etape 2, et `<ip-du-pi>` par
l'adresse IP du Raspberry Pi ; si `rsync` n'est pas disponible, `scp -P 22222
-r ./ root@<ip-du-pi>:/addons/portfolio_tracker/` fonctionne aussi mais copiera
aussi `.git` et `node_modules` s'ils existent localement : les supprimer
avant, avec `rm -rf .git server/node_modules data` dans une copie
temporaire du depot, avant de lancer la commande).

Sous Windows sans terminal Unix, l'outil graphique **WinSCP** permet de faire
le meme transfert (memes port/utilisateur) sans ligne de commande.

### 4. Faire apparaitre l'add-on dans Home Assistant

Parametres > Add-ons > Boutique d'add-ons > menu (les trois points en haut a
droite) > **Verifier les mises a jour**. L'add-on **Portfolio Tracker**
apparait dans la liste, section "Local add-ons". Si rien n'apparait,
redemarrer le Supervisor (Parametres > Systeme > Materiel > redemarrer, ou
developer tools > Supervisor > Restart) puis reverifier.

### 5. Installer et configurer

1. Installer l'add-on. Le premier build se fait sur le Pi lui-meme (peut
   prendre quelques minutes)
2. Dans l'onglet **Configuration** de l'add-on, renseigner au minimum
   `session_secret` (valeur aleatoire longue, ex. generee avec
   `openssl rand -hex 32` depuis un autre poste). Les champs `smtp_*` sont
   optionnels : sans eux, les alertes de seuil sont seulement loguees, pas
   envoyees par email, sans bloquer le reste de l'application
3. Dans l'onglet **Reseau**, verifier/ajuster le port expose (3000 par
   defaut) ; il n'entre pas en conflit avec Home Assistant lui-meme (443)
   puisque c'est un port different
4. Demarrer l'add-on, activer "Demarrer au demarrage de Home Assistant"
5. L'application est accessible sur `http://<ip-du-pi>:<port-choisi>`

Le stockage SQLite est automatiquement persiste par le Supervisor
(equivalent au volume Docker `/data`) et survit aux mises a jour de HAOS et
de l'add-on.

### Mettre a jour l'add-on plus tard

Repeter l'etape 3 (`rsync`/`scp`) pour ecraser les fichiers avec une version
plus recente du depot, puis dans l'add-on : onglet **Info** > **Reconstruire**
(rebuild), qui reconstruit l'image Docker a partir des fichiers mis a jour.

Pour un acces distant securise (HTTPS) sans toucher a la configuration
existante de Home Assistant, la solution la plus simple est un tunnel
sortant (ex. Cloudflare Tunnel) qui expose ce port sur un sous-domaine, sans
ouvrir de port entrant ni gerer de certificat manuellement.

## Installation : Docker Compose (serveur Linux generique, pas HAOS)

```bash
cp .env.example .env
# editer .env : SESSION_SECRET obligatoire, SMTP_* optionnel
docker compose up -d --build
```

L'application est alors accessible sur `http://<ip-du-serveur>:<HOST_PORT>`
(3000 par defaut). Les donnees SQLite sont persistees dans `./data/`.

## Installation : sans Docker (developpement local)

```bash
cd server
npm install
cp ../.env.example .env
# decommenter DB_PATH=./data/portfolio.db dans .env (voir commentaire dans .env.example)
node index.js
```

## Verification

```bash
docker compose logs -f          # mode Docker Compose
# ou l'onglet "Journal" de l'add-on en mode Home Assistant
```

Les logs affichent l'execution des taches planifiees (`Demarrage mise a jour
des cours`, `Demarrage verification alertes`) toutes les 2 minutes, ainsi que
les eventuelles erreurs de recuperation des cours.

## Securite

Chaque route de l'API (`server/middleware/auth.js`) verifie que
l'utilisateur est authentifie (session cookie) et ne peut lire/ecrire que ses
propres donnees (filtrage par `user_id` en base). Les mots de passe sont
hashes avec bcrypt, jamais stockes en clair.

Le fichier `.env` (mode Docker Compose) contient des secrets (cle de
session, identifiants SMTP) : ne jamais le committer (deja exclu par
`.gitignore`). En mode Home Assistant Add-on, ces memes secrets sont saisis
dans l'onglet Configuration de l'add-on et geres par le Supervisor.
