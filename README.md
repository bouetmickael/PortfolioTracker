# Portfolio Tracker

Outil de suivi de portefeuille (actions et warrants CTO BoursoBank) sous forme
de PWA (Progressive Web App) adossee a Firebase.

## Architecture

- `public/` : frontend (PWA), sert via Firebase Hosting
- `functions/` : backend serverless (Firebase Cloud Functions, Node.js 20)
- `database.rules.json` : regles de securite Realtime Database (isolation par utilisateur)
- `firebase.json` : configuration du projet Firebase (hosting, functions, database)

## Fonctionnalites

- Authentification (Google ou email/mot de passe), isolation stricte des donnees par utilisateur
- Suivi de valeurs (actions, warrants) avec cours et variation mis a jour toutes les 2 minutes
- Alertes de seuil (haut/bas) avec notifications push natives (Firebase Cloud Messaging)
- Graphiques historiques (1J / 1S / 1M / 1A / Max) via Chart.js
- Installation sur mobile (Android/iOS) comme application native (PWA)

## Source de donnees et limites connues

- Cours et historique : Yahoo Finance (endpoint public non officiel, gratuit, delai
  d'environ 15 minutes sur les marches US). Voir `functions/index.js` (`fetchYahooFinance`,
  `getChartData`).
- Non disponible en l'etat : PER sectoriel moyen, screening automatique par critere,
  Greeks/delta des warrants, volatilite implicite, parite. Ces donnees necessitent
  une API payante (Alpha Vantage, Financial Modeling Prep, IEX Cloud, Bloomberg...).
- Aucune donnee n'est simulee : en cas d'echec de recuperation, la fonction loggue
  l'erreur et n'ecrit rien (pas de valeur inventee).

## Prerequis

- Node.js 20 (les Cloud Functions ciblent `nodejs20`)
- Firebase CLI : `npm install -g firebase-tools`
- Un projet Firebase sur le plan Blaze (requis pour les Cloud Functions)

## Configuration initiale

1. `firebase login`
2. Verifier que `.firebaserc` pointe vers le bon projet (`portefolio-c442d` par defaut)
3. Renseigner la cle VAPID dans `public/firebase-config.js` (variable `vapidKey`),
   recuperable depuis Console Firebase > Parametres du projet > Cloud Messaging >
   Web Push certificates
4. Remplacer les icones temporaires `public/icons/icon-192.png` et `icon-512.png`
   par de vraies icones (voir https://www.pwabuilder.com/imageGenerator)

## Deploiement

```bash
cd functions
npm install
cd ..
firebase deploy
```

Deploiement partiel possible :

```bash
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only database
```

## Verification

```bash
firebase functions:list
firebase functions:log
```

## Securite

Les regles `database.rules.json` garantissent qu'un utilisateur authentifie ne peut
lire/ecrire que sous `users/{son_uid}`. Ne pas assouplir ces regles sans revue.

La cle `apiKey` de `firebase-config.js` n'est pas un secret (elle identifie le
projet), mais il est recommande de la restreindre par domaine dans Google Cloud
Console (APIs & Services > Identifiants).
