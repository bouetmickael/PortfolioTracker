# Changelog

## 1.10.7

- **Correctif** : en orientation paysage, la ligne "Sur la periode : ..."
  au-dessus du graphique restait disproportionnee par rapport au reste
  de la modale (retour utilisateur explicite, capture d'ecran a l'appui).
  Taille de texte reduite de moitie dans ce contexte paysage uniquement.

## 1.10.6

- **Correctif** : le format compact des dates en abscisse (v1.10.5) est
  desormais different selon la periode affichee, sur demande explicite
  utilisateur : "ddd jj" puis l'heure sur 1 semaine (ex. "lun 01"), au
  lieu du format `jj/mm/aa` initial, moins lisible a cette echelle ;
  `jj/mm` sur 1 mois (annee implicite) ; `jj/mm/aa` inchange sur 1 an et
  Max.

## 1.10.5

- **Fonctionnalite** : les dates affichees en abscisse des graphiques
  (valeurs suivies, sections partagees, indices de marche) utilisent
  desormais le format compact `jj/mm/aa` (ex. "07/08/26") au lieu du nom
  du mois en toutes lettres, plus encombrant (demande explicite
  utilisateur).

## 1.10.4

- **Correctif** : le pourcentage affiche entre parentheses pour le cours
  avant-bourse ("Avant-bourse X EUR (+Y%)") etait calcule par rapport a
  la cloture d'il y a deux seances au lieu du dernier cours affiche
  juste au-dessus - deux prix quasi identiques pouvaient ainsi afficher
  des pourcentages presque egaux mais tous deux faux (cumul sur deux
  seances plutot que le seul mouvement avant-bourse). Le pourcentage
  avant-bourse est desormais calcule par rapport au dernier cours de
  cloture affiche ("Cours"), comme attendu.

## 1.10.3

- **Fonctionnalite** : les positions d'un portefeuille peuvent desormais
  etre reordonnees par glisser-depose, comme les valeurs de la liste
  "Suivi" (poignee dediee sur chaque carte, meme mecanisme SortableJS).
  Le reordonnancement reste limite aux positions d'un meme portefeuille
  (un seul portefeuille affiche a la fois, pas de glisser-depose entre
  deux portefeuilles).

## 1.10.2

- **Correctif** : le graphique en orientation paysage remontait
  systematiquement la periode sur "Max" a chaque rotation d'ecran,
  obligeant a re-choisir sa periode a chaque passage en paysage (retour
  utilisateur explicite). La periode reste desormais celle choisie par
  l'utilisateur, quelle que soit l'orientation.
- **Fonctionnalite** : la modale du graphique occupe desormais 100% de
  l'ecran en orientation paysage (retour utilisateur explicite, capture
  d'ecran a l'appui : le bas du graphique etait auparavant coupe et
  necessitait de faire defiler dans une fenetre exigue). Le graphique de
  cours s'adapte a l'espace vertical reellement disponible plutot que de
  garder une hauteur fixe pensee pour le portrait.

## 1.10.1

- **Correctif** : sur l'onglet "Portefeuilles" (v1.10.0), les valeurs
  positives/negatives (variation du cours, plus/moins-value latente par
  valeur et pour le portefeuille entier) restaient toutes affichees en
  texte neutre au lieu de vert/rouge. Cause : ces elements posaient une
  classe `success`/`danger` seule, alors que le reste de l'application
  ne colore qu'via une regle CSS combinee avec une classe de contexte
  (`.valeur-variation.success`, etc.) - aucune regle ne correspondait a
  une classe seule. Ajout de deux regles generiques `.success`/`.danger`
  (`public/styles.css`), sans impact sur les composants existants (meme
  couleur, regles combinees plus specifiques toujours prioritaires).

## 1.10.0

- **Fonctionnalite** : taux de plus/moins-value sur la periode du
  graphique. A l'ouverture du graphique d'une valeur ou d'un indice (et
  a chaque changement de periode 1J/1S/1M/1A/Max), un indicateur affiche
  desormais l'ecart entre le premier et le dernier cours de la periode
  chargee, en euros et en pourcentage, colore vert/rouge selon le signe.
- **Fonctionnalite** : nouvel onglet "Portefeuilles" (barre d'onglets en
  bas de l'ecran, a cote de "Suivi") pour reconstituer un ou plusieurs
  portefeuilles reels - quantite de titres detenue et prix de revient par
  valeur, avec calcul automatique du cours actuel, de la valeur totale et
  de la plus/moins-value latente (en euros et en pourcentage) par valeur
  et pour le portefeuille entier. Plusieurs portefeuilles peuvent etre
  crees et selectionnes via une liste de pilules, independamment de la
  liste "Valeurs suivies" existante (deux concepts distincts : suivre un
  cours sans quantite, contre reconstituer une position reellement
  detenue).

## 1.9.20

- **Fonctionnalite** : le bouton de partage (icone) de l'en-tete d'une
  section possedee s'allume desormais (couleur or) des qu'au moins un
  utilisateur a acces a cette section, pour distinguer en un coup d'oeil
  les sections perso des sections partagees sans avoir a ouvrir la modale
  de partage de chacune.

## 1.9.19

- **Correctif** : le pincement sur le graphique en orientation paysage
  (ajoute en 1.9.18) ne faisait que sauter d'une periode preetablie a
  l'autre (1J/1S/1M/1A/Max), pas ce qui etait demande. Il decoupe
  desormais une fenetre continue et arbitraire de points a l'interieur
  de la periode chargee (ex. les 17 derniers jours d'un mois affiche),
  sans alignement sur un prereglage, avec le point sous le centre du
  pincement qui reste stable pendant le geste. Les boutons de periode
  restent le moyen de reinitialiser une fenetre obtenue par zoom a un
  choix precis.

## 1.9.18

- **Fonctionnalite** : sur le graphique en orientation paysage, un
  pincement a deux doigts modifie desormais la periode affichee (ecarter
  les doigts raccourcit la periode, les rapprocher l'allonge), toujours
  parmi les 5 periodes existantes (1J/1S/1M/1A/Max). Les boutons de
  periode restent le moyen de reinitialiser une periode choisie par
  pincement a un choix precis. Le pincement n'affecte jamais l'infobulle
  du graphique (tap/glisser a un seul doigt, geree nativement par
  Chart.js) ni le mode placement d'une alerte, tous deux inchanges.

## 1.9.17

- **Correctif** : la pastille de prix d'un seuil d'alerte existant sur le
  graphique, déplacée à gauche en 1.9.16, restait encore trop opaque une
  fois positionnée sur la courbe. Opacité réduite (85% -> 65%).

## 1.9.16

- **Correctif** : la pastille de prix d'un seuil d'alerte existant sur le
  graphique était ancrée à droite et masquait la portion la plus récente
  de la courbe (le cours actuel de la valeur). Déplacée à gauche, quitte
  à chevaucher les libellés de l'axe des ordonnées.

## 1.9.15

- Ajout d'un canal de régression (droite de tendance + bandes à ±1 et ±2
  écarts-types) sur le graphique lorsque l'écran passe en orientation
  paysage, pour visualiser le positionnement d'une valeur par rapport à
  son historique complet. Bascule automatiquement sur la période Max en
  entrant en paysage, restaure la période précédente en sortant.
- Retrait du verrouillage d'orientation portrait du manifeste PWA (sans
  quoi une installation sur l'écran d'accueil Android ne pouvait jamais
  pivoter en paysage, rendant la fonctionnalité ci-dessus inatteignable).

## 1.9.14

- **Correctif critique** : le cours avant-bourse (ajouté en 1.9.9) ne
  s'affichait en réalité jamais, y compris pour des valeurs américaines
  effectivement en pré-ouverture (ex. NVIDIA) — les champs Yahoo Finance
  utilisés (`marketState`, `preMarketPrice`) n'existent pas sur l'endpoint
  réellement interrogé par le job de mise à jour des cours. Le mécanisme
  de détection a été entièrement revu pour utiliser des champs
  effectivement présents sur cet endpoint.
- **Correctif** : la pastille de prix d'une alerte existante sur le
  graphique (ligne pointillée rouge) était totalement opaque et pouvait
  masquer la courbe de cours lorsque le seuil se trouvait proche du prix
  affiché. Fond légèrement translucide.

## 1.9.13

- **Correctif** : sur iPhone, un appui prolongé sur la courbe du
  graphique (pour lire l'infobulle à un point donné ou pour glisser la
  ligne de placement d'une alerte) déclenchait le mode sélection de
  texte natif de Safari (surlignage puis menu Copier), rendant le geste
  inutilisable. Désactivé sur la zone du graphique (cours et volume).

## 1.9.12

- Ajout d'une ligne de référence pointillée sur le graphique (valeurs
  suivies et indices de marché) indiquant le cours de clôture de la
  veille, quelle que soit la période sélectionnée.

## 1.9.11

- La période de graphique retenue depuis la 1.9.10 est désormais
  persistée (`localStorage`) au lieu d'être seulement mémorisée pour la
  session en cours : elle survit à un rafraîchissement de la page ou à
  la fermeture/réouverture de l'application (PWA).

## 1.9.10

- Le graphique s'ouvre désormais sur la dernière période consultée (1J/
  1S/1M/1A/Max) au lieu de revenir systématiquement sur 1 mois. Choix
  mémorisé pour la session en cours (valeurs suivies et indices
  confondus), réinitialisé au rechargement de l'application.

## 1.9.9

- Ajout de l'affichage du cours avant-bourse ("Avant-bourse") sur les
  valeurs suivies et les indices de marché (Nasdaq-100, S&P 500) : une
  ligne supplémentaire discrète, visible uniquement lorsque le marché du
  ticker concerné est effectivement en pré-ouverture au moment de la
  dernière mise à jour des cours (Yahoo Finance `marketState === 'PRE'`).
  Sans effet sur les marchés sans session avant-bourse (ex. Euronext
  Paris) ni en dehors des horaires de pré-ouverture.

## 1.9.8

- Correctif : impossible de faire défiler la liste de résultats lors de
  la recherche d'une valeur à l'ajout (ex. plusieurs cotations "Renault
  SA" sur différentes bourses avant celle de Paris, inatteignable). La
  sélection d'un résultat empêchait par erreur tout scroll tactile dans
  la liste. Fermeture du menu au clic extérieur plutôt que sur `blur`.

## 1.9.7

- Ajout de pastilles de notification (points rouges) pour repérer en un
  coup d'œil qu'une alerte s'est déclenchée, en complément du texte
  « Déclenchée à hh:mm » ajouté en 1.9.4 : sur le badge cloche de la
  liste des valeurs suivies, devant le ticker de chaque carte d'alerte
  concernée, et un compteur sur l'en-tête de la section « Alertes
  actives ».

## 1.9.6

- **Correctif critique** : les alertes de seuil ne se déclenchaient plus
  du tout (ni notification dans l'app, ni email), même sur un seuil
  clairement franchi. `checkAlerts()` tentait d'envoyer l'email **avant**
  d'enregistrer le déclenchement en base ; si l'envoi échouait (SMTP
  configuré mais en panne - mauvais mot de passe, port bloqué...),
  l'enregistrement n'avait jamais lieu, empêchant l'alerte d'apparaître
  déclenchée nulle part, indéfiniment. Le déclenchement est désormais
  enregistré avant la tentative d'envoi ; un échec d'email reste local et
  n'affecte plus l'enregistrement (voir `BUSINESS_RULES.md` § Alertes de
  seuil).

## 1.9.5

- Correctif : sur le graphique d'une valeur, les libelles de l'axe Y des
  cours (ex. "156.00 EUR") pouvaient etre tronques sur leurs premiers
  chiffres - une largeur d'axe fixee en dur (50px, introduite avec le
  graphique de volume en v1.9.3) etait trop etroite pour des cours a 3
  chiffres. La largeur de l'axe Y est desormais calculee dynamiquement
  (partagee entre le graphique de cours et celui du volume, chacun
  imposant sa propre largeur minimale).
- Correctif : le bouton cloche d'ajout d'alerte depuis le graphique (et
  les autres elements superposes au graphique de cours) recouvrait les
  libelles de l'axe Y du graphique de volume, ajoute juste en dessous en
  v1.9.3 - ces elements etaient positionnes par rapport a l'ensemble du
  bloc graphique (cours + volume) au lieu du seul graphique de cours.

## 1.9.4

- Ajout d'un indicateur "Derniere alerte" sur chaque carte d'alerte
  (`Declenchee a hh:mm` ou `Jamais declenchee`) : jusqu'ici, l'envoi
  d'email etait le seul moyen de savoir qu'un seuil avait ete franchi, et
  cet envoi est silencieusement desactive si `SMTP_*` n'est pas configure
  (comportement volontaire, voir `BUSINESS_RULES.md` § Alertes de
  seuil) - un utilisateur sans SMTP configure n'avait donc structurellement
  aucun moyen de savoir qu'une alerte s'etait declenchee. Retour
  utilisateur explicite du 2026-07-27 (deux seuils franchis un matin sans
  aucune notification visible).

## 1.9.3

- Ajout d'un graphique du volume echange sous le graphique de cours d'une
  valeur (barres colorees hausse/baisse, alignees avec la courbe de
  cours) — voir `DESIGN.md` § Volume echange sur le graphique.
- Fusion de `POST /api/valeurs` et `POST /api/sections/:id/valeurs` en un
  seul endpoint (`POST /api/valeurs`, avec `sectionId` optionnel) qui
  determine lui-meme l'autorisation d'ecriture sur la section ciblee
  (possedee ou partagee en ecriture) plutot que de laisser le client
  choisir la route. Changement de comportement mineur : un `sectionId`
  fourni sans droit d'ecriture est desormais rejete (403) plutot que
  silencieusement ignore au profit de la section par defaut.
- Suppression de `alertes.valeur_id`, colonne FK vestigiale non lue
  depuis que les alertes sont rejointes par `(user_id, ticker)` (dette
  technique reportee depuis la Revue n°6, voir `CLAUDE.md` § Historique
  des revues) — migration de base par recreation de table.

## 1.9.2

- Correctif : la variation du jour restait a `+0.00%` pour toutes les
  valeurs et tous les indices, meme marches ouverts. Le calcul reposait
  sur `regularMarketChangePercent`, un champ qui n'existe pas sur
  l'endpoint Yahoo Finance reellement appele (`/v8/finance/chart` ; ce
  champ n'existe que sur `/v7/finance/quote`), toujours `undefined` et
  donc toujours ramene a 0. La variation est desormais recalculee a
  partir du cours et de la cloture precedente (`previousClose`/
  `chartPreviousClose`). Le cours lui-meme n'etait pas affecte (deja lu
  depuis un champ existant).

## 1.9.1

- Correctif : le bouton flottant d'ajout (FAB) recouvrait le dernier
  element de la page une fois le contenu scrolle tout en bas (ex.
  l'action de suppression de la derniere alerte active, la rendant
  inaccessible). Ajout d'un espace reserve en bas de page (`padding-
  bottom` sur `body`, avec variante `safe-area-inset-bottom`) couvrant
  la hauteur du FAB et sa marge.

## 1.9.0

- Résolution complète de la dette technique reportée depuis les revues
  n°1 à n°6 (voir `CLAUDE.md` § Historique des revues, Session 30) :
  `GET /api/alertes` renvoie désormais un tableau au lieu d'une map
  (même convention que `GET /api/valeurs`), middleware d'erreurs
  centralisé, cache sur `GET /api/chart/:ticker`, jobs planifiés
  parallélisés, nouvelle poignée de glisser-déposer dédiée pour les
  sections (icône grip, comme pour les valeurs), mode placement d'une
  alerte piloté par CSS plutôt que par des attributs `hidden` individuels
  (corrige au passage un bug où le bouton Annuler restait visible hors
  mode placement), correction d'un bug de re-clamp du seuil lors d'un
  changement de période en cours de placement. Nombreuses factorisations
  internes sans changement de comportement observable (modales
  prompt/confirm, actions CRUD, glisser-déposer des valeurs,
  regroupement des valeurs par section). Voir `CLAUDE.md` pour le détail
  complet, correctif par correctif.

## 1.8.10

- Correctif de dette technique (aucun changement de comportement) :
  factorisation du squelette reseau bas niveau des appels Yahoo Finance
  (fetch, verification de `response.ok`, parsing JSON) dans un nouveau
  module `server/yahooFinance.js` (`fetchYahooFinanceJson`), reutilise
  par les quatre sites qui le reimplementaient independamment
  (`fetchYahooFinance()` dans `server/jobs/prices.js`, la route
  `GET /api/chart/:ticker`, et `rechercherTickers()` dans
  `server/valeurs.js`). Chaque site garde sa propre logique de
  validation metier (extraction du prix, gestion du cas "aucun
  resultat"). Correctif reporte depuis la revue de dette technique n°1,
  aggrave aux revues n°3, n°4 et n°6 (voir `CLAUDE.md` § Historique des
  revues de dette technique).

## 1.8.9

- Correctif : selectionner une suggestion de recherche a l'ajout d'une
  valeur (voir 1.8.7) redefinit desormais toujours le champ "Nom
  (optionnel)" avec le nom de la valeur choisie, y compris si un nom
  avait deja ete saisi manuellement (demande explicite utilisateur - le
  comportement precedent ne remplissait le champ que s'il etait vide).

## 1.8.8

- Une meme valeur peut desormais etre suivie dans plusieurs sections
  (demande explicite utilisateur), tant qu'elle n'est pas dupliquee dans
  la **meme** section (toujours refuse, 409). Nouveau bouton `+` dans
  l'en-tete de chaque section possedee pour y ajouter une valeur
  directement. Changement de contrat d'API : `GET /api/valeurs` et
  `GET /api/sections/:id/valeurs` renvoient desormais un tableau (chaque
  element porte son `ticker`) plutot qu'une map indexee par ticker,
  devenue ambigue ; `DELETE /api/valeurs/:id` prend desormais l'id de la
  ligne plutot que le ticker. Voir `BUSINESS_RULES.md` § Valeurs suivies
  et `DESIGN.md` § Valeurs suivies dupliquees entre sections.

## 1.8.7

- Recherche de valeur a l'ajout (demande explicite utilisateur : pouvoir
  saisir un nom approximatif, ex. "Schneider", plutot que de connaitre le
  ticker exact). Le champ Ticker de la modale d'ajout propose desormais
  des suggestions (ticker, nom, bourse) au fur et a mesure de la saisie,
  via une nouvelle route `GET /api/valeurs/recherche` (meme endpoint non
  officiel Yahoo Finance que le reste du projet). Cliquer une suggestion
  remplit le ticker et le nom ; le ticker choisi passe toujours par la
  validation Yahoo Finance existante (v1.8.5) a la soumission. Voir
  `DESIGN.md` § Recherche de valeur a l'ajout.

## 1.8.6

- Correctif : suppression impossible d'une valeur dont le ticker contient
  un caractere "/" (ex. "LVMH/SGE WT 26", ajoutee avant la validation
  Yahoo Finance de la v1.8.5). Le ticker n'etait pas encode dans l'URL
  cote client (`public/app.js`), ce qui cassait le routage Express
  (suppression de valeur, suppression de valeur dans une section
  partagee, ouverture du graphique). Le ticker est desormais passe par
  `encodeURIComponent()` dans ces trois appels.

## 1.8.5

- Validation du ticker a l'ajout d'une valeur (demande explicite
  utilisateur : n'importe quel texte pouvait etre ajoute comme valeur
  suivie, y compris un warrant, sans jamais afficher de cours). Le ticker
  est desormais verifie sur Yahoo Finance avant l'ajout
  (`POST /api/valeurs` et `POST /api/sections/:id/valeurs`) ; rejete (400)
  s'il est introuvable. Une valeur acceptee est inseree avec son cours
  reel des sa creation, sans attendre le prochain cycle de mise a jour.
  Voir `BUSINESS_RULES.md` § Valeurs suivies.

## 1.8.4

- Cartes d'alerte (section "Alertes actives") reduites (retour utilisateur
  explicite : trop imposantes une fois comparees a la liste des valeurs
  suivies compactee en 1.8.1). Padding, espacement et tailles de police
  alignes sur `.valeur-row`, desormais legerement plus compactes que celle-
  ci. Voir `DESIGN.md` § Carte alerte.

## 1.8.3

- Ajout du logo de l'application (demande explicite utilisateur) : visible
  en haut a gauche de l'en-tete de la page principale, et utilise comme
  icone d'application (favicon, icones du manifeste PWA 192/512,
  `apple-touch-icon`) lors d'un "Ajouter a l'ecran d'accueil" depuis
  iPhone. Voir `DESIGN.md` § Header / § PWA.

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
