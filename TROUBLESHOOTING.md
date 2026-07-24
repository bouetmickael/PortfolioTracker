# Troubleshooting

Ce document recense les problemes deja rencontres sur ce projet (pour eviter de
les reproduire) et le probleme en cours a diagnostiquer.

## Etat actuel (a corriger)

**Symptome** : les cours des valeurs suivies ne s'affichent plus dans l'application
(section "Valeurs suivies"), et une erreur apparait lors du rafraichissement.

**Non fourni pour l'instant** : le message d'erreur exact (console navigateur ou
`firebase functions:log`). Premiere etape de tout diagnostic : le recuperer.

### Points d'entree pour diagnostiquer

1. **Logs des Cloud Functions planifiees** (source la plus probable, car
   `cours` est ecrit exclusivement par `updatePrices` dans `functions/index.js`) :
   ```bash
   firebase functions:log --only updatePrices
   firebase functions:log --only checkAlerts
   ```
   Verifier que les executions ont bien lieu toutes les 2 minutes et qu'elles
   ne remontent pas d'erreur.

2. **Cloud Scheduler** : `updatePrices` et `checkAlerts` sont des fonctions
   `pubsub.schedule(...)`, deployees comme jobs Cloud Scheduler. Verifier dans
   Google Cloud Console > Cloud Scheduler que les jobs existent, sont actifs
   (non en pause) et que leur derniere execution est en succes (pas d'erreur
   HTTP 4xx/5xx).

3. **Source de donnees Yahoo Finance** : `fetchYahooFinance()` dans
   `functions/index.js` appelle `query1.finance.yahoo.com`, un endpoint public
   non officiel et non contractuel. Il est connu pour :
   - changer de comportement sans preavis (ex. exiger un cookie/"crumb" de
     session, renvoyer 401/429, ou changer la structure du JSON retourne)
   - bloquer les requetes provenant d'IP de datacenter (le cas des Cloud
     Functions) plus agressivement que les requetes navigateur
   Si les logs montrent des erreurs `Yahoo Finance error: ...` ou des reponses
   vides, la source est probablement cassee cote Yahoo, pas cote code metier.
   Dans ce cas, la vraie option est de migrer vers une source stable et
   contractuelle (Alpha Vantage, Financial Modeling Prep, IEX Cloud, Twelve
   Data...) plutot que de patcher un endpoint non officiel.

4. **Realtime Database** : verifier manuellement dans Console Firebase >
   Realtime Database que `users/{uid}/valeurs/{ticker}/cours` est bien mis a
   jour recemment (`derniereMaj`). Si `cours` reste a `0` (valeur initiale
   posee par `ajouterValeur()` dans `public/app.js`), cela confirme que la
   Cloud Function `updatePrices` n'ecrit plus, pas un probleme d'affichage
   frontend.

5. **Erreur au rafraichissement** : le bouton "Actualiser" (`refreshBtn`) ne
   fait aujourd'hui qu'afficher un toast ("Actualisation...") et ne declenche
   aucun appel reseau — les donnees sont censees se mettre a jour via les
   listeners Firebase temps reel (`database.ref(...).on('value', ...)`).
   Si une erreur apparait a ce moment precis, elle vient plus probablement
   d'un listener qui echoue (regles de securite Realtime Database, session
   expiree, quota depasse) que du bouton lui-meme. Verifier la console
   navigateur (F12 > Console) pour le message d'erreur exact et sa stack trace.

### Ordre de diagnostic recommande

1. Recuperer le message d'erreur exact (console navigateur + `firebase functions:log`)
2. Verifier l'etat des jobs Cloud Scheduler (`updatePrices`, `checkAlerts`)
3. Verifier si le probleme vient de Yahoo Finance (erreurs de fetch cote Functions)
4. Verifier les regles Realtime Database (`database.rules.json`) si l'erreur
   semble venir du frontend (permission denied)
5. Ne corriger le code qu'une fois la cause confirmee par les logs — eviter
   de deviner et de patcher au hasard

## Historique des problemes deja rencontres (deploiement initial)

Ces points sont deja resolus dans l'etat actuel du depot, mais sont
documentes pour eviter de les reintroduire par erreur (ex. en mettant a jour
une dependance sans verifier la compatibilite).

### 1. Node.js 18 decommissionne

Firebase a decommissionne le runtime Node 18 (fin de vie 2025-10-30). Le
projet cible **Node 20** :
- `functions/package.json` → `"engines": { "node": "20" }`
- `firebase.json` → `"functions": { "runtime": "nodejs20" }`

Ne pas passer a Node 24 : ce n'est pas (encore) un runtime Cloud Functions
supporte au moment de la redaction de ce document — verifier la liste des
runtimes supportes avant de changer.

### 2. `firebase-functions` v5 casse la syntaxe utilisee dans `index.js`

Le code de `functions/index.js` utilise la syntaxe v1/v4 :
```js
const functions = require('firebase-functions');
exports.updatePrices = functions.pubsub.schedule('every 2 minutes')...
```

`firebase-functions` v5 a retire cette API au profit de
`firebase-functions/v2/scheduler` (`onSchedule(...)`). Installer la v5 sans
migrer le code provoque :
```
TypeError: functions.pubsub.schedule is not a function
```

**Deux options, ne pas les melanger** :
- Rester en v4 : `functions/package.json` → `"firebase-functions": "^4.9.0"`
  (etat actuel du depot)
- Migrer vers v5 : reecrire `updatePrices`, `checkAlerts`, `getChartData`,
  `searchTickers` avec les imports `firebase-functions/v2/scheduler` et
  `firebase-functions/v2/https`, et passer `"firebase-functions": "^5.1.1"`

Si une mise a jour de dependances est un jour necessaire, traiter cela comme
une migration complete, pas un simple `npm update`.

### 3. Plan Firebase Blaze obligatoire

Les Cloud Functions (meme le tier gratuit de 2M invocations/mois) necessitent
que le projet soit sur le plan **Blaze** (pay-as-you-go). Le plan Spark
(gratuit) ne permet pas d'activer `cloudbuild.googleapis.com` et
`artifactregistry.googleapis.com`, requis pour le build des functions. Le
projet est deja passe sur Blaze — ne pas repasser sur Spark.

### 4. Service account par defaut manquant (erreur ponctuelle au premier deploiement)

Rencontre une seule fois au premier `firebase deploy` :
```
Failed to create 1st Gen function ... : Default service account
'{PROJECT_NUMBER}-compute@developer.gserviceaccount.com' doesn't exist.
```
Resolu en activant (ou reactivant) l'API Compute Engine sur le projet Google
Cloud, ce qui recree le service account par defaut. Si l'erreur reapparait,
verifier : https://console.cloud.google.com/apis/library/compute.googleapis.com

### 5. Cle VAPID non configuree (notifications push)

`public/firebase-config.js` contient actuellement un placeholder :
```js
const vapidKey = "REMPLACER_PAR_VOTRE_CLE_VAPID";
```
Tant que ce n'est pas remplace par la vraie cle (Console Firebase >
Parametres du projet > Cloud Messaging > Web Push certificates), l'appel
`messaging.getToken()` dans `setupNotifications()` (`public/app.js`) echouera.
Cet appel est deja dans un `try/catch`, donc **ne devrait pas** bloquer le
reste de l'application (affichage des valeurs, graphiques) — mais a verifier
en priorite si l'erreur observee au chargement/rafraichissement mentionne
`messaging` ou `getToken` ou `applicationServerKey`.

### 6. Icones PWA temporaires

`public/icons/icon-192.png` et `icon-512.png` sont des icones generees
automatiquement (fond bleu, texte "PT"), pas des icones definitives. Sans
impact fonctionnel, purement cosmetique.

## Sources de donnees et limites (rappel)

- Cours et historique : Yahoo Finance (endpoint public non officiel, gratuit,
  sans SLA — voir section "Etat actuel" ci-dessus, c'est le suspect principal
  du bug en cours)
- Non disponible en l'etat : PER sectoriel moyen, screening automatique,
  Greeks/delta des warrants, volatilite implicite, parite
- Aucune donnee n'est simulee : en cas d'echec de recuperation, la fonction
  doit logger l'erreur et ne rien ecrire (pas de valeur inventee) — a
  preserver dans tout correctif
