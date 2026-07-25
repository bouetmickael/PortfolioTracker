# Changelog

## 1.3.1

- Correction : le glisser-depose d'une valeur ne se declenche plus
  depuis n'importe quel endroit de la ligne (ce qui genait le scroll
  tactile sur mobile), mais uniquement depuis une poignee dediee a
  gauche de la ligne (retour utilisateur). Le reste de la ligne reste
  cliquable normalement (ouverture du graphique) et scrolle sans
  interference.

## 1.3.0

- Retour au style visuel de l'ancienne version du projet (demande
  explicite utilisateur, captures d'ecran a l'appui) : en-tete bleu
  marine fixe, accent or/gold, icones SVG a la place des boutons lettre
  unique, sections repliables (chevron), cartes statistiques a bordure
  coloree. Nouveau theme clair/sombre fonctionnel (bascule dans l'en-
  tete, persistance locale). La ligne de chaque valeur suivie garde son
  avatar rond et sa hierarchie de texte actuels, avec correction : le
  volume s'affiche desormais sur sa propre ligne complete au lieu de
  risquer d'etre coupe en cours de mot. Portefeuilles partages non
  inclus (reste planifie en Session D, voir BACKLOG.md).

## 1.2.0

- Ajout des sections dans la liste des valeurs suivies : creer, renommer
  et supprimer une section, glisser-deposer une valeur entre sections et
  a l'interieur d'une section, glisser-deposer pour reordonner les
  sections elles-memes (SortableJS). Usage personnel uniquement (aucun
  partage de section entre utilisateurs a ce stade). Les valeurs deja
  suivies sont automatiquement rattachees a une section "General" creee
  lors de la migration.

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
