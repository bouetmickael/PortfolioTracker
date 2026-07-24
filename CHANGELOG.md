# Changelog

## 1.1.1

- Correction du graphique 1J/1S : l'intervalle Yahoo Finance etait fixe a
  1 jour quelle que soit la periode selectionnee, ce qui ne donnait que 2
  points sur la vue "1J" (une ligne droite au lieu d'une courbe
  intrajournaliere). Intervalle desormais adapte a la periode (5 minutes
  pour 1J, 15 minutes pour 1S, inchange pour 1M/1A/Max).

## 1.1.0

- Ajout d'un serveur HTTPS optionnel reutilisant le certificat Let's
  Encrypt de l'add-on DuckDNS de Home Assistant (acces externe sans
  certificat separe).

## 1.0.0

- Premiere version packagee en tant que Home Assistant Add-on : migration
  hors Firebase (Cloud Functions, Realtime Database, Cloud Messaging,
  authentification Google) vers un backend Node.js/Express + SQLite
  auto-heberge, comptes locaux email/mot de passe, alertes par email
  (SMTP optionnel), polling HTTP a la place des listeners temps reel.
