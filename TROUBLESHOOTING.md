# Troubleshooting

Ce document recense les problemes deja rencontres sur ce projet (pour eviter
de les reproduire).

## Historique : migration hors de Firebase (2026-07)

Le projet reposait initialement sur Firebase (Hosting, Cloud Functions,
Realtime Database, Cloud Messaging). Suite a une suppression accidentelle du
compte/projet Firebase, l'application a ete entierement reecrite pour
fonctionner sans aucun service Firebase, en auto-hebergement (ex. Raspberry
Pi), avec :

- Node.js/Express a la place de Cloud Functions
- SQLite a la place de Realtime Database
- Sessions locales (email/mot de passe, bcrypt) a la place de Firebase Auth
  (l'authentification Google a ete retiree : elle necessitait un flux OAuth
  complet disproportionne pour 2-3 utilisateurs connus)
- Email (optionnel, SMTP) a la place des notifications push Firebase Cloud
  Messaging
- Polling HTTP (toutes les 30 secondes) a la place des listeners temps reel
  Realtime Database

Le detail de l'architecture actuelle est dans `README.md`. Le code Firebase
(`functions/`, `firebase.json`, `database.rules.json`, `.firebaserc`,
`public/firebase-config.js`, `public/firebase-messaging-sw.js`) a ete
supprime : ne pas le reintroduire.

## Historique : packaging Home Assistant Add-on (2026-07)

Le seul Raspberry Pi disponible tourne sous Home Assistant OS (HAOS), pas un
Linux generique. Le Supervisor gere entierement l'hote : deployer via
`docker compose` directement dessus n'est pas supporte (perte possible des
conteneurs a la prochaine mise a jour de HAOS). L'application a donc ete
packagee aussi comme Home Assistant Add-on (`config.yaml`,
`repository.yaml`), en plus du mode Docker Compose (garde pour un usage sur
un Linux generique, pas HAOS). Le detail des deux modes est dans
`README.md`.

Les deux modes partagent le meme `Dockerfile` et le meme code serveur. La
seule difference technique est la source de configuration :

- Docker Compose : fichier `.env`, lu par `dotenv`
- Home Assistant Add-on : `/data/options.json` (rempli par le Supervisor
  depuis l'onglet Configuration de l'add-on), traduit vers les memes
  variables d'environnement par `server/load-addon-options.js`

Si les deux sources coexistent (ne devrait pas arriver en usage normal), une
variable d'environnement deja definie est toujours prioritaire sur
`options.json`.

## Points de vigilance sur la stack actuelle

### 1. Source de cours : Yahoo Finance (inchange, toujours a surveiller)

`server/jobs/prices.js` (mise a jour toutes les 2 minutes) et
`server/routes/chart.js` (graphiques) appellent toujours
`query1.finance.yahoo.com`, un endpoint public non officiel et non
contractuel. Il est connu pour :

- changer de comportement sans preavis (cookie/crumb de session exige,
  401/429, structure JSON modifiee)
- bloquer plus agressivement les requetes provenant d'IP de datacenter que
  les requetes navigateur

Si les cours cessent de se mettre a jour, verifier en premier lieu les logs
(`docker compose logs -f`, chercher `Erreur <TICKER>` ou `Yahoo Finance
error`). Le code respecte le principe "pas de valeur inventee" : en cas
d'echec, l'erreur est loguee et rien n'est ecrit en base, donc `cours` reste
a sa derniere valeur connue (ou `0` si jamais mis a jour).

Migration recommandee si le probleme se confirme recurrent : Alpha Vantage,
Financial Modeling Prep, Twelve Data (cle API gratuite avec quotas). Cela n'a
pas ete fait lors de la migration hors Firebase (choix explicite : traiter un
probleme a la fois).

### 2. Store de session en memoire

`server/app.js` utilise le store de session par defaut d'`express-session`
(en memoire du process). Consequence acceptee (usage personnel, 2-3
utilisateurs) : un redemarrage du conteneur deconnecte tout le monde. Ce
n'est pas un bug ; ne pas le "corriger" en ajoutant un store externe (Redis,
etc.) sans que ce soit devenu un vrai probleme d'usage.

### 3. SQLite et le stockage persistant

La base est un fichier unique (`/data/portfolio.db` dans le conteneur).
Sauvegarde = copier ce fichier (le service peut rester demarre, SQLite gere
les acces concurrents via WAL).

- Mode Docker Compose : verifier que le volume `./data:/data` est toujours
  bien mappe dans `docker-compose.yml` (une erreur frequente est de
  supprimer ou deplacer ce dossier par erreur) si les donnees semblent vides
  apres un redemarrage
- Mode Home Assistant Add-on : le stockage persistant est fourni
  automatiquement par le Supervisor (option `map: [data:rw]` dans
  `config.yaml`), rien a configurer manuellement

### 4. SESSION_SECRET obligatoire

Sans `SESSION_SECRET` defini dans `.env`, le serveur demarre quand meme (avec
un avertissement en log) mais utilise une valeur par defaut non securisee.
A definir avant tout usage reel, y compris en local.

### 5. Notifications par email (optionnelles)

Sans variables `SMTP_*` renseignees dans `.env`, les alertes de seuil sont
seulement loguees (`Email non envoye (SMTP non configure)`), jamais
bloquantes pour le reste de l'application. C'est un choix delibere, pas un
bug a corriger en urgence.

### 6. Icones PWA temporaires

`public/icons/icon-192.png` et `icon-512.png` sont des icones generees
automatiquement (fond bleu, texte "PT"), pas des icones definitives. Sans
impact fonctionnel, purement cosmetique.
