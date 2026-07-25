# Changelog

## 1.8.2

- Correctif zoom intempestif (demande explicite utilisateur) : la page se
  retrouvait parfois zoomee sans action volontaire, cachant une partie de
  l'ecran. Cause principale : les champs de formulaire (connexion, ajout
  de valeur, creation d'alerte, modales) etaient en police 14px, sous le
  seuil de 16px a partir duquel iOS declenche un zoom automatique au focus
  d'un champ. Passes a 16px. Pincement-zoom et double-tap-zoom egalement
  desactives (meta viewport + `touch-action: manipulation`).
- Tuiles d'indices de marche (SBF 120/Nasdaq-100/S&P 500) reduites une
  seconde fois (retour utilisateur : toujours trop grandes une fois la
  liste des valeurs suivies compactee en 1.8.1) : padding, polices et
  bordure superieure encore reduits, voir `DESIGN.md` § Cartes
  statistiques.

## 1.8.1

- Densite de la liste des valeurs suivies (demande explicite utilisateur) :
  reduction des tailles de police et du padding de chaque ligne de valeur
  (nom, cours, variation, badges, footer, avatar) pour afficher au moins
  8 valeurs sur un meme ecran sans avoir a faire defiler la page, meme sur
  un petit smartphone. Aucun changement de comportement, uniquement une
  reduction du gabarit visuel de la liste (le reste de l'application -
  en-tete, cartes d'indices, modales, carte alerte - est inchange).

## 1.8.0

- Affichage des alertes de seuil existantes directement sur le graphique
  historique d'une valeur suivie : une ligne pointillee rouge fine avec
  une pastille indiquant le prix marque chaque seuil actif (haut et/ou
  bas), a condition qu'il tombe dans la plage de valeurs affichee par le
  graphique pour la periode courante. Si un seuil est hors de cette
  plage (trop haut ou trop bas par rapport aux cours affiches), la ligne
  n'est pas tracee sur le graphique lui-meme : un petit repere "hors
  limites" (fleche + prix) est affiche en haut ou en bas du graphique a
  la place. Disponible uniquement sur les valeurs de ma propre liste
  "Valeurs suivies" (memes restrictions que la creation d'alerte depuis
  le graphique, voir 1.7.0) : jamais sur les indices de marche ni sur les
  valeurs d'une section partagee.

## 1.7.0

- Nouvelle facon de creer une alerte de seuil : directement depuis le
  graphique historique d'une valeur suivie, en glissant une ligne
  pointillee jusqu'au niveau souhaite (comme sur TradingView) puis en
  validant d'un tap. L'alerte est creee immediatement avec le seuil
  haut ou bas selon le sens du glissement (au-dessus/en-dessous du
  cours actuel). Disponible uniquement sur les valeurs de ma propre
  liste "Valeurs suivies" (pas sur les indices de marche ni sur les
  valeurs d'une section partagee, qui ne peuvent techniquement pas
  declencher d'alerte). Le formulaire existant (icone cloche sur la
  ligne de la valeur) reste disponible pour poser un seuil haut et bas
  en une seule fois.

## 1.6.2

- Precision de perimetre (demande explicite utilisateur) : l'application
  n'a vocation qu'a etre utilisee depuis un smartphone (PWA), jamais
  depuis un navigateur de bureau ou une tablette. `public/styles.css` est
  simplifie en consequence : le systeme a deux niveaux (style de base
  large + correctif `@media (max-width: 640px)` pour mobile) est retire,
  les valeurs mobiles deviennent les valeurs par defaut uniques. Aucun
  changement visuel pour l'utilisateur (le rendu sur un vrai telephone
  etait deja pilote par le correctif mobile, desormais applique par
  defaut).

## 1.6.1

- Correctif tuiles d'indices de marche (SBF 120/Nasdaq-100/S&P 500,
  v1.6.0) : les tuiles sont desormais cliquables et ouvrent le graphique
  historique de l'indice (meme modale que pour une valeur suivie), et
  leur taille est reduite sur mobile ou le cours + devise pouvait passer
  sur deux lignes et occuper une hauteur disproportionnee.

## 1.6.0

- Remplacement des 3 tuiles statistiques du haut (Total/Hausse/Baisse,
  comptage des valeurs suivies) par le suivi de 3 indices de marche :
  SBF 120, Nasdaq-100 et S&P 500. Chaque tuile affiche le nom de
  l'indice, son cours (avec la devise d'origine, EUR ou USD) et sa
  variation du jour, colore en vert/rouge. Meme mecanisme Yahoo Finance
  que les valeurs suivies, mise a jour toutes les 2 minutes par le meme
  cycle de job planifie. Nouvelle table `indices_marche` (donnees de
  marche globales, non rattachees a un utilisateur) et nouvelle route
  `GET /api/indices`.

## 1.5.0

- Ajout du partage de section entre utilisateurs (Session D) : le
  propriétaire d'une section peut la partager avec un autre compte connu
  (email), en lecture seule ou en lecture/écriture. Un utilisateur avec
  qui une section est partagée la voit apparaître dans un nouveau bloc
  "Partagé avec moi", peut consulter ses valeurs et, en écriture,
  ajouter/supprimer des valeurs dans cette section (les valeurs restent
  rattachées au compte du propriétaire). Renommer, supprimer ou partager
  une section reste réservé à son propriétaire. Nouvelle table
  `section_shares`, nouvelle route `GET /api/users` (liste restreinte
  pour choisir un destinataire), nouvelles routes imbriquées
  `/api/sections/:id/partages` et `/api/sections/:id/valeurs`.

## 1.4.0

- Ajout d'un badge d'alerte sur la liste des valeurs suivies : un pictogramme
  cloche s'affiche a cote du type (badge pilule) de chaque valeur ayant au
  moins une alerte de seuil active, pour la reperer sans avoir a ouvrir la
  section des alertes. Migration de base ajoutant `alertes.valeur_id`
  (resolution automatique de l'existant par ticker+utilisateur au demarrage)
  et nouveau champ `hasAlerte` sur `GET /api/valeurs`.

## 1.3.2

- Remplacement des popups navigateur natives (`prompt()`/`confirm()`,
  utilisees pour creer/renommer/supprimer une section ou supprimer une
  valeur/alerte) par des modales stylees coherentes avec le theme
  clair/sombre de l'application (elles gardaient auparavant l'apparence
  brute du systeme, hors charte graphique).

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
