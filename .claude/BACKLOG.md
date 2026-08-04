# BACKLOG.md — Avancement, session en cours, backlog produit

> Fichier propriétaire de l'état d'avancement et du compteur de sessions
> (cycle défini dans `METHOD.md` §0.1/§0.2). Voir `CLAUDE.md` pour le point
> d'entrée.

## Compteur de sessions depuis la dernière revue de dette technique

**1/5** — Session 47 (2026-08-04, v1.9.15) : ajout du canal de
régression (droite de tendance + bandes ±1/±2 écarts-types) affiché sur
le graphique en orientation paysage, calculé sur la période Max de
l'historique de la valeur (voir `DESIGN.md` § Canal de régression en
orientation paysage). Retrait du verrouillage `orientation:
"portrait-primary"` du manifeste PWA (prérequis : sans ce retrait, une
PWA installée sur Android ne pivote jamais en paysage, rendant la
fonctionnalité inatteignable dans le mode d'usage principal de
l'application).

Compteur avant cette session :

0/5 — Session 46 (2026-08-04), cycle de revue de dette technique
obligatoire (`METHOD.md` §0.2, Revue n°8, voir `CLAUDE.md` §
Historique des revues pour le detail complet). Portee couverte : diff
cumule depuis la cloture de la Revue n°7 (`767a2cd`) jusqu'a `HEAD`
(`d15c6a3`), Sessions 40 a 45 (v1.9.9 a v1.9.14). Correctifs a risque
faible/comportement inchange appliques (extraction de `pctChange()`/
`extraireResultatChart()` dans `server/jobs/prices.js`, boucle de
migration `avant_bourse_*` dans `server/db.js`, discriminant explicite
`reference: true` remplacant une comparaison de texte d'infobulle dans
`public/app.js`, fusion de regles CSS identiques `.stat-variation`/
`.stat-avant-bourse` et `.valeur-variation`/`.valeur-avant-bourse` dans
`public/styles.css`) ; correctifs plus profonds documentes et reportes
(fuite du calcul avant-bourse dans le chemin synchrone d'ajout de
valeur, refetch de la serie 1 minute complete a chaque cycle du job,
duplication `previousClose` aggravant la dette Yahoo Finance deja
suivie, duplication du ternaire de classe de signe dans
`public/index.html`, duplication de mocks de test). Aucun changement de
comportement observable par l'utilisateur : version applicative non
incrementee (`METHOD.md` §5.5), reste `1.9.14`. Pas de nouvelle
fonctionnalite du backlog produit traitee cette session, conformement a
l'obligation du cycle de revue.

Compteur avant cette session :

5/5 — Session 45 (2026-07-28, v1.9.14), **deuxieme correctif hors
plan consecutif** : retour utilisateur direct sur deux bugs distincts
(cours avant-bourse jamais affiche malgre une fenetre de pre-ouverture
reelle ; pastille d'alerte existante masquant completement la courbe en
arriere-plan) - voir entree detaillee ci-dessous. Compteur deja a 5/5
avant cette session (Session 44) ; reste a 5/5 (un correctif hors plan
ne l'incremente pas au-dela du plafond). **La revue de dette technique
(`METHOD.md` §0.2) est desormais due sans exception a la prochaine
session — deux sessions hors plan consecutives (44 et 45) l'ont deja
repoussee, aucune nouvelle deviation ne doit etre acceptee sans un motif
au moins aussi serieux (meme mise en garde deja formulee lors d'un
episode similaire, Sessions 36/37).**

Compteur avant cette session :

5/5 — Session 44 (2026-07-28, v1.9.13), **correctif hors plan** :
retour utilisateur direct (iPhone, mode selection de texte natif
declenche par un appui prolonge sur la courbe du graphique) - voir
entree detaillee ci-dessous. **Compteur a 5/5 : la prochaine session
DOIT etre le cycle de revue de dette technique (`METHOD.md` §0.2),
sans exception, avant toute nouvelle fonctionnalite du backlog.**

Compteur avant cette session :

4/5 — Session 43 (2026-07-28, v1.9.12) : ajout d'une ligne de
reference sur le graphique indiquant le cours de cloture de la veille
(voir entree detaillee ci-dessous).

Compteur avant cette session :

3/5 — Session 42 (2026-07-28, v1.9.11) : correctif same-day de la
Session 41 - la periode de graphique retenue est desormais persistee
dans `localStorage` (survit a un rafraichissement de page et a une
fermeture/reouverture de la PWA), plutot que seulement memorisee en
memoire pour la session applicative en cours (voir entree detaillee
ci-dessous).

Compteur avant cette session :

2/5 — Session 41 (2026-07-28, v1.9.10) : le graphique s'ouvre
desormais sur la derniere periode consultee au lieu de toujours revenir
sur 1 mois (voir entree detaillee ci-dessous).

Compteur avant cette session :

1/5 — Session 40 (2026-07-28, v1.9.9) : ajout de l'affichage du
cours avant-bourse (voir entrée détaillée ci-dessous). Première session
fonctionnelle depuis la Revue n°7.

Compteur avant cette session :

0/5 — Revue de dette technique n°7 effectuée le 2026-07-28 (voir
`CLAUDE.md` § Historique des revues), portant sur le diff cumulé depuis
la revue n°6 (Sessions 29 à 38 : factorisation Yahoo Finance, résolution
complète de la dette n°1-n°6, correctifs FAB/variation du jour, fusion
des endpoints d'ajout de valeur + retrait de `alertes.valeur_id` +
graphique de volume, affichage du dernier déclenchement d'alerte,
correctif largeur axe Y, correctif critique ordre écriture/email de
`checkAlerts()`, pastilles de notification, correctif scroll recherche
mobile). Quatre correctifs à risque faible appliqués (`executerAction()`
propage désormais la valeur résolue par `fn()` au lieu de la faire
disparaître, simplifiant `creerAlerteAPI()` ; pastille
`.badge-notif-count` recalculée une seule fois par évaluation réactive
au lieu de deux ; `chargerGraphiqueVolume()` reçoit `couleurTexte` en
paramètre au lieu de le re-dériver ; extraction de
`reinitialiserCanvasVolume()`), un correctif évalué et explicitement
écarté (enveloppe `asyncHandler` inutile mais inoffensive sur
`GET /api/valeurs/recherche`, laissée pour la cohérence avec les routes
voisines), trois correctifs plus profonds documentés et reportés
(duplication `roleSection()`/`rolesSection()`, duplication de la recette
de recréation de table entre migrations SQLite, quasi-duplication
structurelle restante entre `updatePrices()`/`updateIndices()`) — voir
`CLAUDE.md` pour le détail correctif par correctif. Pas d'incrément de
version (`METHOD.md` §5.5) : les quatre correctifs appliqués sont
strictement internes, comportement vérifié identique par un parcours
Playwright dédié (appel direct de `executerAction()`/
`chargerGraphiqueVolume()`, injection d'alertes dans le store), aucun
changement observable par l'utilisateur.

Historique du compteur avant ce reset (conservé pour mémoire) :

5/5 — Session 38 (2026-07-27, v1.9.8), **correctif bloquant hors
plan** : retour utilisateur (capture d'écran) — impossible de faire
défiler la liste de résultats de recherche d'une valeur à l'ajout
(`#rechercheResultats`, Session 26/v1.8.7) sur mobile, empêchant
d'atteindre un résultat situé plus bas (cas réel : « Renault SA · Paris »
précédée de 5 doublons d'autres bourses). Cause : la sélection d'un
résultat écoutait `pointerdown` avec `preventDefault()` (pour agir avant
le `blur` du champ Ticker) — `preventDefault()` sur `pointerdown`
supprime aussi le scroll tactile natif du conteneur, et chaque item
couvrant presque toute la hauteur visible, plus aucun scroll n'était
possible. Remplacé par une sélection sur `click` (naturellement
insensible à un geste de glisser) et une fermeture du menu au clic
extérieur plutôt que sur `blur` + délai. Vérifié par un geste tactile
CDP réel (`Input.dispatchTouchEvent`) confirmant le scroll fonctionnel.
**Troisième déviation consécutive à `METHOD.md` §0.2** (compteur à 5/5
depuis la Session 35) : un bug bloquant une action cœur (impossible
d'ajouter certaines valeurs par recherche) prime à nouveau sur
l'ordonnancement du cycle. **La revue de dette technique est due sans
exception à la prochaine session — aucune nouvelle déviation ne devra
être acceptée sans un motif au moins aussi sérieux.** Voir
`CHANGELOG.md` 1.9.8.

Session 37 (2026-07-27, v1.9.7), **petite fonctionnalité hors
plan** : une fois le correctif de la Session 36 confirmé (capture
d'écran montrant « Déclenchee a hh:mm » sur une carte), demande
explicite utilisateur — le texte seul restait trop discret, souhait de
« pastilles comme pour les notifications », choix du positionnement/
gabarit exact laissé à l'appréciation de la session. Voir `DESIGN.md` §
Carte alerte pour le détail des trois emplacements retenus (badge cloche
de la liste des valeurs, carte d'alerte, en-tête de section). Utilisateur
a par ailleurs confirmé une erreur SMTP dans ses logs (« Invalid login:
535-5.7.8 Username and Password not accepted » — Gmail rejette les
identifiants), en cours d'investigation de son côté, aucune action code
associée. **Déviation à `METHOD.md` §0.2 toujours en cours** (compteur à
5/5 depuis la Session 35, cf. Sessions 36/37 ci-dessous et au-dessus) :
la revue de dette technique reste due, sans exception cette fois, à la
**prochaine session** — deux sessions hors plan consécutives ont
suffisamment repoussé le cycle. Voir `CHANGELOG.md` 1.9.7.

Session 36 (2026-07-27, v1.9.6), **correctif critique hors
plan** : retour utilisateur (capture d'écran) — plusieurs alertes de
seuil clairement franchies (ex. seuil haut à 238.68 EUR pour un cours à
243.60 EUR) toujours affichées « Jamais déclenchée », aucune notification
ni dans l'app ni par email. Cause réelle : `checkAlerts()`
(`server/jobs/alerts.js`) appelait `sendMail()` **avant** d'écrire
`dernier_cours_alerte`/`derniere_alerte` en base ; un SMTP configuré mais
en échec (probablement suite à la config Gmail demandée en Session 34)
faisait donc systématiquement échouer l'écriture, empêchant l'alerte
d'apparaître déclenchée nulle part, indéfiniment — bug distinct de celui
diagnostiqué en Session 34 (SMTP absent), plus grave puisqu'il cassait
aussi l'indicateur in-app censé fonctionner indépendamment de l'email.
Correctif : écriture en base déplacée avant la tentative d'envoi, échec
d'email capturé localement (voir `BUSINESS_RULES.md` § Alertes de
seuil), test de régression dédié simulant un SMTP configuré qui échoue.
**Déviation assumée à `METHOD.md` §0.2** : le compteur était déjà à 5/5
après la Session 35 (revue de dette due à la session suivante), mais un
correctif de sévérité critique (fonctionnalité cœur totalement inopérante
pour l'utilisateur) prime sur l'ordonnancement du cycle — la revue de
dette reste due à la **prochaine** session, non reportée davantage. Voir
`CHANGELOG.md` 1.9.6.

Session 35 (2026-07-27, v1.9.5) : retour utilisateur direct
(capture d'écran) sur le graphique de volume ajouté en v1.9.3 : libellés
de l'axe Y des cours tronqués (largeur d'axe figée à 50px, trop étroite
pour un cours à 3 chiffres) et bouton cloche d'ajout d'alerte recouvrant
les libellés de l'axe Y du volume (positionné par rapport à l'ensemble
du bloc graphique au lieu du seul graphique de cours). Deux correctifs :
largeur d'axe Y calculée dynamiquement et partagée entre les deux
graphiques (`alignerLargeurAxeY`, `public/app.js`), nouveau conteneur
`#graphiquePriceZone` dédié au graphique de cours pour le positionnement
des éléments superposés (`public/index.html`/`styles.css`). Compteur à
5/5 : **la prochaine session est donc obligatoirement un cycle de revue
de dette technique** (`METHOD.md` §0.2), portant sur le diff cumulé
depuis la clôture de la Revue n°6 (commit `d22e4f8`, « Session 28 -
technical debt review n6 », voir `CLAUDE.md` § Historique des revues)
jusqu'à `HEAD` — couvre nominalement les Sessions 29 à 35, à vérifier par
`git log` en début de revue plutôt qu'à supposer exact (plusieurs revues
précédentes ont dû corriger cette borne, voir Revues n°3/n°4/n°5/n°6
ci-dessus pour ce même type de correction récurrent). Voir `CHANGELOG.md`
1.9.5.

4/5 — Session 34 (2026-07-27, v1.9.4) : retour utilisateur explicite
(deux seuils d'alerte franchis un matin sans aucune notification visible).
Diagnostic : mécanisme de déclenchement (`checkAlerts()`) sain et
vérifié par test dédié (`server/test/alerts-job.test.js`), mais l'email
est le seul canal de notification et il est silencieusement désactivé
sans `SMTP_*` configuré (comportement volontaire, voir
`BUSINESS_RULES.md` § Alertes de seuil) — cause la plus probable sur le
déploiement de l'utilisateur, à confirmer une fois SMTP configuré.
Correctif appliqué : indicateur « Déclenchée à hh:mm »/« Jamais
déclenchée » sur chaque carte d'alerte (`derniereAlerte`, déjà renvoyée
par l'API mais jamais affichée), pour que l'app reste un canal de
vérification même sans email. Voir `CHANGELOG.md` 1.9.4.

3/5 — Session 33 (2026-07-27, v1.9.3) : fusion de `POST /api/valeurs`
et `POST /api/sections/:id/valeurs` en un seul endpoint déterminant
lui-même l'autorisation d'écriture, suppression de la colonne FK
vestigiale `alertes.valeur_id` (migration de recréation de table) — deux
correctifs de dette technique reportés depuis la Revue n°6/Session 30
(voir `CLAUDE.md` § Historique des revues) — et ajout d'un graphique du
volume échangé sous le graphique de cours d'une valeur (nouvelle
fonctionnalité, demande explicite utilisateur). Voir `CHANGELOG.md`
1.9.3 pour le détail.

2/5 — Session 32 (2026-07-27, v1.9.2) : correctif de la variation du
jour, restée à `+0.00%` pour toutes les valeurs/indices même marchés
ouverts — calcul reposant sur un champ Yahoo Finance
(`regularMarketChangePercent`) absent de l'endpoint `/v8/finance/chart`
réellement appelé, donc toujours `undefined`. Recalcul à partir du cours
et de la clôture précédente (`previousClose`/`chartPreviousClose`). Voir
`server/jobs/prices.js` § `fetchYahooFinance`.

Session 31 (2026-07-27, v1.9.1) : correctif du FAB (bouton
flottant d'ajout) qui recouvrait le dernier élément de la page une fois
scrollée tout en bas (ex. l'action de suppression de la dernière alerte
active), le rendant inaccessible — espace réservé en bas de `body`
(hauteur du FAB + marge, avec variante safe-area iOS). Comportement
utilisateur observable, comptée comme une session au sens du compteur
(`METHOD.md` §0.1).

Compteur réinitialisé à 0/5 et seuil de déclenchement porté de 3 à 5
sessions sur demande explicite de l'utilisateur (2026-07-26, juste après
la Session 30). Voir `METHOD.md` §0.2 (règle de méthode mise à jour en
conséquence — « toutes les 5 sessions », compteur cible `5/5`). Ce reset
n'est pas la clôture d'un cycle de revue (§0.2, qui suppose un
`/simplify` effectivement lancé sur le diff cumulé) : c'est une remise à
zéro directe demandée par l'utilisateur, immédiatement après la Session
30 qui venait de traiter l'intégralité de la dette reportée jusqu'alors
(voir ci-dessous et `CLAUDE.md` § Historique des revues).

Historique du compteur avant ce reset (conservé pour mémoire, les
mentions `X/3` ci-dessous reflètent l'ancien seuil, en vigueur au moment
de ces sessions) :

Session 30 (2026-07-26, v1.9.0) avait porté le compteur à 2/3 en
traitant, sur demande explicite de l'utilisateur, l'ensemble des
correctifs de dette technique reportés cumulés depuis les Revues n°1 à
n°6 (voir `CLAUDE.md` § Historique des revues, entrée « Session 30 »
pour le détail correctif par correctif) — comptée comme une session au
sens du compteur (§0.1 de `METHOD.md`), pas comme un nouveau cycle de
revue (§0.2), puisqu'aucun nouveau `/simplify` n'a été lancé sur un diff
cumulé : il s'agissait de résoudre le backlog déjà identifié, pas d'en
détecter un nouveau.

Session 29 (2026-07-26, v1.8.10) avait déjà traité un premier correctif
de dette technique reporté (« duplication de la logique Yahoo
Finance »), sans changement de comportement observable.

Revue de dette technique n°6 effectuée le 2026-07-26 (voir
`CLAUDE.md` § Historique des revues de dette technique), portant sur le
diff cumulé depuis la revue n°5 (Session 23 logo de l'application,
Session 24 densité des cartes d'alerte, Session 25 validation du ticker
Yahoo Finance, Session 26 recherche de valeur à l'ajout, Session 27 une
même valeur dans plusieurs sections, + les correctifs same-day v1.8.6 et
v1.8.9). Attention particulière portée aux mécanismes transverses de la
Session 27 (contrat d'API en tableau, cascade de suppression liée au
ticker, jointures d'alertes) comme demandé. Correctifs à risque faible
appliqués (factorisation des trois sites de suppression d'une valeur en
deux helpers partagés `supprimerValeurEtDetacherAlertes()`/
`supprimerAlertesOrphelines()`, correction du N+1 dans la fusion de
sections, remplacement du `GROUP BY` de `checkAlerts()` par une
sous-requête corrélée pour ne plus dépendre d'un invariant non garanti,
renommage `sectionCibleAjoutPartagee` → `sectionCibleAjout`) ; correctifs
plus profonds documentés et reportés (voir Revue n°6) — notamment la
duplication Yahoo Finance à nouveau aggravée (`rechercherTickers()`) et
`alertes.valeur_id` devenue une colonne FK vestigiale.

Revue n°5 effectuée le
2026-07-26 (voir
`CLAUDE.md` § Historique des revues de dette technique), portant sur le
diff cumulé depuis la revue n°4 (Session 19 alertes existantes sur le
graphique, Session 20 densité de la liste des valeurs, Session 21 zoom
désactivé + tuiles d'indices recompactées). Correctifs à risque faible
appliqués (index d'alertes par ticker simplifié en tableau plat, cache de
l'échelle Chart.js, factorisation de la création des éléments d'overlay
du graphique, fusion CSS des pastilles `.alerte-existante-badge`/
`.alerte-hors-limite`) ; correctifs plus profonds documentés et reportés
(voir Revue n°5).

## Session 30 - résolution complète de la dette reportée (2026-07-26, v1.9.0)

Demande explicite de l'utilisateur : traiter en une seule session tous
les points reportés cumulés depuis les Revues n°1 à n°6 (voir
`CLAUDE.md` § Historique des revues, entrée « Session 30 » pour le
détail correctif par correctif — vingt et un correctifs appliqués, deux
évalués et explicitement écartés après vérification plutôt que reportés
une nouvelle fois, trois points restant hors périmètre car changement de
contrat d'API/migration de schéma). Contrairement aux revues
précédentes, Playwright/Chromium était disponible cette session
(indisponible auparavant), ce qui a permis de traiter plusieurs points
explicitement reportés faute de moyen de vérification visuelle
(glisser-déposer réel, mode placement d'une alerte, modales) — un vrai
bug a d'ailleurs été débusqué en cours de route par cette vérification
(le bouton Annuler du mode placement restait visible en permanence
avant correction, voir `CLAUDE.md`).

Vérifié par `node --test test/*.test.js` (45/45, dont un nouveau
`chart.test.js` pour le cache) et un parcours Playwright complet contre
un serveur local (Chart.js servi depuis un paquet npm local le temps du
test, le CDN `jsdelivr` étant bloqué par la politique réseau du bac à
sable) : rendu de la liste de valeurs/sections/alertes (API alertes en
tableau), modale prompt (renommage de section), modale confirm
(annulation `Échap` puis confirmation positive de suppression),
graphique + mode placement d'une alerte avec bascule de période en cours
de placement, glisser-déposer réel d'une section (simulation souris
complète) avec vérification de l'ordre persisté côté API, bascule de
thème — aucune erreur console sur l'ensemble du parcours.

## Session 29 - factorisation du squelette reseau Yahoo Finance (2026-07-26, v1.8.10)

Traite le correctif de dette technique reporté « duplication de la
logique Yahoo Finance », identifié en Revue n°1 et aggravé aux Revues
n°3, n°4 et n°6 (voir `CLAUDE.md` § Historique des revues). Quatre sites
réimplémentaient indépendamment le squelette `fetch(url)` → vérifier
`response.ok` → parser le JSON → gérer l'erreur : `fetchYahooFinance()`
(`server/jobs/prices.js`, cours d'une valeur/d'un indice), la route
`GET /api/chart/:ticker` (`server/routes/chart.js`, historique), et
`rechercherTickers()` (`server/valeurs.js`, recherche par nom).
Nouveau module `server/yahooFinance.js` (`fetchYahooFinanceJson(url)`)
partagé par les trois — `verifierTickerExiste()` (`server/valeurs.js`)
en bénéficie indirectement puisqu'il appelle déjà `fetchYahooFinance()`.
Chaque site garde sa propre logique de validation métier au-dessus
(extraction du prix, gestion du cas « aucun résultat », forme de la
réponse) : seul le squelette réseau bas niveau est partagé, comme
demandé. Aucun changement de comportement — `server/routes/chart.js`
gagne au passage une vérification de `response.ok` qu'il n'avait
jamais eue (un statut HTTP en erreur tombait auparavant directement sur
le parsing JSON), mais le chemin d'erreur résultant (capturé par le
`try/catch` de la route, réponse 500 avec `error.message`) reste
identique pour l'utilisateur.

Vérifié par tests unitaires (`node --test test/*.test.js`, 44/44 —
`npm test` échoue toujours dans ce bac à sable avec la même anomalie
d'environnement préexistante déjà documentée en Revue n°6, non liée à
cette session) et un parcours API réel sur un serveur local dédié avec
les mêmes mocks Yahoo Finance que les tests (register, recherche
`GET /api/valeurs/recherche?q=schneider`, ajout d'une valeur
`POST /api/valeurs`, `GET /api/chart/:ticker`, exécution directe de
`updatePrices()`/`updateIndices()`) — tous les quatre sites confirmés
fonctionnels après le changement. Pas de test manuel navigateur/
Playwright (aucun changement d'UI, la sandbox de développement bloque
de toute façon les appels sortants réels vers
`query1.finance.yahoo.com`, comme documenté aux sessions précédentes).

## Session hors plan — Session 25 - validation du ticker a l'ajout d'une valeur (2026-07-26, v1.8.5)

Demande explicite de l'utilisateur (capture d'ecran a l'appui) : n'importe
quel texte pouvait etre ajoute comme valeur suivie (ex. "PAS DE CONTROLE"),
et les warrants ajoutes avec un ISIN ou une designation BoursoBank interne
(ex. "DE000SJ1SRC8", "LVMH/SGE WT 26") n'affichaient jamais de cours
(`MAJ: -`) sans jamais etre rejetes. `POST /api/valeurs` et
`POST /api/sections/:id/valeurs` interrogent desormais Yahoo Finance
(`verifierTickerExiste`, `server/valeurs.js`) avant l'insertion et
rejettent (400) un ticker introuvable ou sans cours exploitable — meme
cause racine pour les deux symptomes de la capture (aucune validation
n'existait avant cette session, y compris pour les warrants, qui
n'utilisent pas de source de donnees differente des actions ; voir
`BUSINESS_RULES.md` § Valeurs suivies). Une valeur acceptee est desormais
inseree avec son cours reel des sa creation (au lieu d'un cours a 0 en
attente du prochain cycle de la tache planifiee). Tests ajoutes
(`server/test/valeurs.test.js`, `server/test/partage.test.js`) avec un
mock de l'appel Yahoo Finance dans `server/test/support/helpers.js`
(`npm test`, 32/32, puis 33/33 apres le correctif ci-dessous) — la
sandbox de developpement bloque les appels
sortants reels vers `query1.finance.yahoo.com` (host non liste dans
l'allowlist reseau), donc le chemin de succes n'a pu etre verifie qu'avec
ce mock, pas contre l'API Yahoo Finance reelle ; a confirmer sur un
deploiement reel (Raspberry Pi) avec un ticker valide.

**Correctif (même jour, v1.8.6)** : retour utilisateur — suppression
impossible de la valeur "LVMH/SGE WT 26" (ajoutee avant la validation
ci-dessus), toast "Erreur: Erreur suppression valeur". Cause : le ticker
n'etait pas encode (`encodeURIComponent`) dans les URL construites cote
client (`public/app.js`), donc un ticker contenant un caractere "/"
cassait le routage Express (segments d'URL supplementaires, route
`/:ticker` non matchee). Corrige sur les trois appels concernes
(suppression d'une valeur, suppression d'une valeur dans une section
partagee, ouverture du graphique). Test de non-regression ajoute
(`server/test/valeurs.test.js`, insertion directe en base d'un ticker
"legacy" contenant un "/", verification que la suppression via l'URL
encodee fonctionne) ; verifie egalement manuellement en reproduisant le
bug (URL non encodee echoue, URL encodee reussit) sur un serveur local.

## Session hors plan — Session 26 - recherche de valeur a l'ajout (2026-07-26, v1.8.7)

Demande explicite de l'utilisateur : pouvoir saisir un nom approximatif
(ex. "Schneider") plutot que de connaitre le ticker exact (`SU.PA`) lors
de l'ajout d'une valeur. Nouvelle route `GET /api/valeurs/recherche?q=...`
(`rechercherTickers()`, `server/valeurs.js`) qui interroge l'endpoint de
recherche non officiel Yahoo Finance (`query1.finance.yahoo.com/v1/
finance/search`, meme famille d'endpoint que `fetchYahooFinance` deja
utilise ailleurs dans le projet - pas de deuxieme source de donnees).
Cote client, le champ Ticker de `#modalAddValeur` declenche la recherche
a la saisie (debounce 300ms, a partir de 2 caracteres) et affiche un menu
deroulant de suggestions (ticker, nom, bourse) ; en choisir une remplit
le ticker et le nom. Voir `DESIGN.md` § Recherche de valeur a l'ajout
pour le detail du composant. Le ticker choisi reste soumis a la
validation Yahoo Finance existante (v1.8.5) a l'ajout reel - cette
recherche est une aide a la saisie, pas un raccourci de validation.
Comme deja documente (`SPECIFICATION_FONCTIONNELLE.md` § Source de
donnees et limites connues), les warrants identifies par ISIN ne
remonteront generalement aucune suggestion, meme limite que la
validation elle-meme.

Tests ajoutes (`server/test/valeurs.test.js`) : recherche avec
correspondance, recherche sans correspondance, requete trop courte (< 2
caracteres), authentification requise. Mock etendu
(`server/test/support/helpers.js`) pour simuler l'endpoint de recherche
Yahoo Finance sans appel reseau reel (`npm test`, 37/37). Verifie
manuellement en navigateur (Playwright, Chromium headless fourni par
l'environnement) avec la reponse de recherche interceptee/simulee (le
bac a sable de developpement bloque les appels sortants reels vers
`query1.finance.yahoo.com`, meme limite que documentee en Session 25) :
saisie "schneider" -> menu affiche deux suggestions, clic sur une
suggestion remplit ticker + nom et referme le menu, requete sans
correspondance masque le menu, theme clair et sombre verifies (contraste
correct dans les deux, capture d'ecran a l'appui).

**Correctif (v1.8.9, apres la Session 27)** : retour utilisateur - le
champ "Nom (optionnel)" ne devait etre rempli par une suggestion
selectionnee que s'il etait vide (ne remplacait pas une saisie
manuelle) ; l'utilisateur souhaite au contraire qu'il soit **toujours**
redefini avec le nom de la valeur choisie. `selectionnerResultatRecherche()`
(`public/app.js`) simplifiee en consequence (plus de condition sur la
valeur existante). Verifie manuellement en navigateur (Playwright) :
nom saisi manuellement puis ecrase par la selection d'une suggestion.

## Session hors plan — Session 27 - une meme valeur dans plusieurs sections (2026-07-26, v1.8.8)

Demande explicite de l'utilisateur : pouvoir ajouter une valeur deja
suivie dans une section a une autre section, sans que ce soit un doublon
- seul un doublon **dans la meme section** doit rester refuse. Changement
plus profond que prevu au premier abord : le ticker etait jusqu'ici
l'identifiant unique d'une valeur pour un utilisateur (contrainte
`UNIQUE(user_id, ticker)`), utilise comme tel a plusieurs endroits.

- **Base de donnees** : contrainte remplacee par
  `UNIQUE(user_id, ticker, section_id)` (`server/db.js`). SQLite ne
  permettant pas de modifier une contrainte `UNIQUE` via `ALTER TABLE`,
  une migration recree la table pour les bases existantes (idempotente,
  detectee via `sqlite_master.sql`, execute apres le backfill de
  `section_id` ; verifiee manuellement sur une base "avant migration"
  simulee - id de ligne et `alertes.valeur_id` preserves, deuxieme
  execution sans effet).
- **Contrat d'API (changement de forme)** : `GET /api/valeurs` et
  `GET /api/sections/:id/valeurs` renvoient desormais un **tableau**
  (`toValeursArray()`, `server/valeurs.js`) au lieu d'une map indexee par
  ticker (dette deja identifiee en Revue n°1, "format de reponse API en
  map" - le ticker n'identifiant plus une valeur de facon unique, la map
  aurait silencieusement ecrase un doublon). `id` est desormais le seul
  identifiant fiable d'une ligne cote client.
- **Suppression** : `DELETE /api/valeurs/:id` prend l'id de la ligne (pas
  le ticker, qui supprimerait a tort toutes les occurrences du ticker
  d'un coup). Les alertes (liees au ticker, pas a une ligne precise) ne
  sont supprimees que si plus aucune section de l'utilisateur ne suit
  encore ce ticker apres la suppression.
- **Alertes** : `HAS_ALERTE_SUBQUERY` et `checkAlerts()`
  (`server/jobs/alerts.js`) rejoignent deja sur `(user_id, ticker)`, pas
  sur `valeur_id` - coherent avec "une alerte s'applique au ticker",
  desormais documente explicitement. `checkAlerts()` regroupe par
  `alertes.id` (`GROUP BY`) pour ne pas traiter/emailer une alerte deux
  fois quand son ticker correspond a deux lignes `valeurs`.
- **Bug latent corrige au passage** (jamais exerce avant cette session,
  aucune regression introduite) : supprimer une ligne `valeurs` alors
  qu'une alerte la referencait via `alertes.valeur_id` (FK) faisait
  echouer la suppression (`FOREIGN KEY constraint failed`) - decouvert
  par les nouveaux tests de cette session. Corrige en detachant
  `valeur_id` (mis a `NULL`) avant la suppression, aux trois endroits qui
  suppriment une ligne `valeurs` directement.
- **Suppression de section** : si une valeur a deplacer vers la section
  de repli y a deja un homologue de meme ticker, elle est supprimee
  (redondante) plutot que deplacee (la nouvelle contrainte `UNIQUE`
  l'interdirait de toute facon).
- **UI** : nouveau bouton `icon-plus` dans l'en-tete de chaque section
  possedee (`.valeurs-section-actions`), premier de la liste, pour
  ajouter une valeur directement dans cette section (jusqu'ici seul le
  FAB/bouton global existait, toujours vers la section par defaut).
  `ajouterValeur()` route vers `/api/valeurs` (avec `sectionId`) pour une
  section possedee, vers `/api/sections/:id/valeurs` uniquement pour une
  section partagee en ecriture. Voir `DESIGN.md` § Valeurs suivies
  dupliquees entre sections.

Tests : 13 nouveaux/modifies au total (contrat en tableau, doublon
refuse dans la meme section, meme valeur dans deux sections, suppression
partielle, cascade d'alerte conditionnelle a la derniere occurrence,
fusion sans erreur a la suppression d'une section, badge d'alerte sur
toutes les occurrences) - `npm test`, 44/44. Verifie manuellement en
navigateur (Playwright) : ajout d'AAPL dans "General" puis dans une
nouvelle section "Watchlist" via son bouton `+` dedie (titre de modale
"Ajouter une valeur - Watchlist"), les deux lignes s'affichent, tentative
d'un troisieme ajout dans "General" refusee (toast "Cette valeur est
deja suivie dans cette section"), suppression de l'occurrence
"Watchlist" laissant intacte celle de "General" - captures d'ecran a
l'appui. Egalement verifie directement en base qu'une base "avant
migration" (schema pre-session, contrainte `UNIQUE(user_id, ticker)`)
migre correctement au demarrage et accepte ensuite un deuxieme ajout du
meme ticker dans une nouvelle section.

## Session hors plan — Session 23 - logo de l'application (2026-07-26, v1.8.3)

Demande explicite de l'utilisateur (logo fourni en pièce jointe) : le
rendre visible en haut à gauche de la page principale et l'utiliser comme
icône d'application lors d'un « Ajouter à l'écran d'accueil » depuis
iPhone. Voir `DESIGN.md` § Header / § PWA pour le détail (traitement de
l'image source, fichiers générés, gabarit du logo d'en-tête). Pas de
changement côté serveur ; `npm test` toujours 29/29.

**Correctif (même jour, v1.8.4)** : retour utilisateur après capture
d'écran réelle sur iPhone — les cartes de la section "Alertes actives"
restaient nettement plus imposantes que les lignes de la liste des
valeurs suivies (déjà compactée en v1.8.1), demande explicite de les
ramener au maximum à la même taille, idéalement plus petites. Padding,
espacement et tailles de police de `.alerte-card` alignés sur
`.valeur-row` ; résultat mesuré plus compact (37.75px de haut contre
47.75px). Voir `DESIGN.md` § Carte alerte.

## Session hors plan — refonte visuelle + theme clair/sombre (2026-07-25)

Demande explicite de l'utilisateur (captures d'écran de l'ancienne
version du projet, avant la refonte Material sobre) : retour au style
visuel de l'ancienne version (en-tête bleu marine, accent or, icônes SVG,
sections repliables, cartes stats à bordure colorée) + thème clair/sombre
fonctionnel. Détail complet dans `DESIGN.md` (nouvelle direction
générale) et `TODO.md`. Deux éléments vus sur les captures explicitement
**non repris** cette session (voir arbitrage utilisateur) :
- badges de recommandation (ACHAT/NEUTRE) : aucune donnée correspondante
  dans le modèle actuel, pas demandé comme nouvelle fonctionnalité ;
- portefeuilles partagés : correspond à la Session D déjà planifiée
  ci-dessous, ordre du backlog conservé (Session C avant Session D).

**Correctif (même jour, v1.3.1)** : retour utilisateur après vérification
visuelle — le glisser-déposer d'une valeur ne doit pas se déclencher
depuis n'importe quel point de la ligne, sous peine de gêner le scroll
tactile de la page. Ajout d'une poignée dédiée (`.valeur-drag-handle`,
icône `icon-grip`) à gauche de chaque ligne, seule à porter `touch-
action: none` ; le reste de la ligne reste cliquable (ouverture du
graphique) et scrolle normalement. Voir `DESIGN.md` § Liste des valeurs
suivies.

**Correctif (même jour, v1.3.2)** : autre retour utilisateur — les
popups navigateur natives (`prompt()`/`confirm()`, utilisées pour créer/
renommer/supprimer une section ou supprimer une valeur/alerte) gardaient
l'apparence brute du système, hors charte graphique et incohérentes avec
le thème clair/sombre. Remplacées par deux modales génériques
réutilisables (`#modalPrompt`/`#modalConfirm`, résolues comme des
`Promise`). Voir `DESIGN.md` § Modales.

## Fonctionnalité en cours

**Refonte ergonomie liste des valeurs** (plan multi-sessions approuvé le
2026-07-24, voir `/root/.claude/plans/fluttering-spinning-swing.md` pour
l'architecture complète) : glisser-déposer, sections, badges d'alerte,
partage RW de section entre utilisateurs. **Plan complet, les quatre
sessions sont livrées** (voir découpage ci-dessous). Aucune fonctionnalité
en cours actuellement. Sessions 31 à 38 (v1.9.1 à v1.9.8) ont traité des
correctifs ponctuels signalés par l'utilisateur (FAB, variation du jour,
fusion des endpoints d'ajout de valeur, retrait de `alertes.valeur_id`,
graphique de volume, affichage du dernier déclenchement d'une alerte,
largeur d'axe Y, ordre écriture/email de `checkAlerts()`, pastilles de
notification, scroll de la liste de recherche), portant le compteur à
5/5 (voir ci-dessus) — la Revue de dette technique n°7 a ensuite été
effectuée (2026-07-28, voir `CLAUDE.md` § Historique des revues), compteur
remis à 0/5. Session 40 (2026-07-28, v1.9.9), demande explicite
utilisateur hors backlog : affichage du cours avant-bourse ("Avant-bourse")
sur les valeurs suivies et les tuiles d'indices (Nasdaq-100/S&P 500),
visible uniquement lorsque le marché du ticker concerné est effectivement
en pré-ouverture (`meta.marketState === 'PRE'` sur l'endpoint Yahoo
Finance déjà utilisé) — voir `DESIGN.md` § Avant-bourse et `CHANGELOG.md`
1.9.9. Migration DB (`avant_bourse_cours`/`avant_bourse_variation` sur
`valeurs` et `indices_marche`, nullable, `ALTER TABLE` gardé par
`columnExists()`) vérifiée sur une base fraîche et sur deux simulations de
base existante (avec/sans la migration `UNIQUE(user_id, ticker,
section_id)` déjà appliquée). Compteur porté à 1/5. Session 41
(2026-07-28, v1.9.10), demande explicite utilisateur hors backlog : le
graphique s'ouvrait toujours sur la période 1 mois quelle que soit la
période choisie à la précédente ouverture — `openGraphique()`
(`public/app.js`) réutilise désormais `dernierePeriodeGraphique` (état en
mémoire, non persisté) au lieu de la valeur fixe `'1M'`, mise à jour à
chaque clic sur un bouton de période. Voir `DESIGN.md` § Sélecteur de
période (graphique) et `CHANGELOG.md` 1.9.10. Vérifié par un parcours
Playwright réel (Chart.js servi depuis un paquet npm local le temps du
test, référence CDN restaurée avant le commit) : ouverture du graphique
d'une valeur (période active 1M par défaut), sélection de la période 1S,
fermeture puis réouverture du même graphique (période active toujours 1S
à la réouverture). Compteur porté à 2/5. Session 42 (2026-07-28,
v1.9.11), correctif same-day suite à retour utilisateur direct : la
persistance de la Session 41 ne survivait pas à un rafraîchissement de
page (état en mémoire uniquement) — `dernierePeriodeGraphique` est
désormais persistée dans `localStorage` (clé `graphique_periode`, même
mécanisme que le thème clair/sombre), lue au chargement avec une
whitelist des 5 périodes valides pour ignorer sans erreur une valeur
corrompue. Voir `DESIGN.md` § Sélecteur de période (graphique) et
`CHANGELOG.md` 1.9.11. Vérifié par un parcours Playwright réel incluant
un `page.reload()` complet (équivalent fermeture/réouverture de la PWA) :
période par défaut 1M sans historique, sélection de 1A, valeur `1Y`
confirmée en `localStorage`, période active toujours 1A après rechargement
complet de la page. Compteur porté à 3/5. Session 43 (2026-07-28,
v1.9.12), demande explicite utilisateur hors backlog : ajout d'une ligne
de référence pointillée sur le graphique indiquant le cours de clôture
de la veille (`previousClose`), quelle que soit la période et pour toute
valeur/indice ouvert. `GET /api/chart/:ticker` (`server/routes/chart.js`)
expose désormais ce champ (déjà calculé côté job de mise à jour des
cours pour la variation du jour, jamais exposé jusqu'ici) ;
`chargerGraphique()` (`public/app.js`) ajoute un second dataset Chart.js
constant plutôt qu'un overlay DOM positionné en pixels (comme les seuils
d'alerte) — Chart.js élargit nativement l'échelle Y pour l'inclure, sans
logique de hors-limite à gérer. Voir `DESIGN.md` § Clôture de la veille
sur le graphique et `CHANGELOG.md` 1.9.12. Vérifié par tests unitaires
(`chart.test.js`, nouveau cas sur `previousClose`) et par un parcours
Playwright réel (Chart.js servi depuis un paquet npm local le temps du
test, référence CDN restaurée avant le commit) : introspection directe de
`Chart.instances` confirmant la présence des 2 datasets attendus (prix +
« Cloture veille » à la valeur mockée), capture d'écran confirmant le
rendu visuel de la ligne pointillée grise distincte de la courbe dorée.
Compteur porté à 4/5. Session 44 (2026-07-28, v1.9.13), **correctif
critique hors plan** : retour utilisateur direct — sur iPhone, un appui
prolongé sur la courbe (pour lire l'infobulle à un point donné ou pour
glisser la ligne du mode placement d'une alerte) déclenchait le mode
sélection de texte natif de Safari (surlignage puis menu Copier),
rendant le geste de positionnement complètement inutilisable.
`#graphiqueContainer`/`#graphiqueVolumeContainer` (`public/styles.css`)
portent désormais `touch-action: none` en permanence (au lieu de
seulement pendant le mode placement) ainsi que
`-webkit-touch-callout: none`/`-webkit-user-select: none`/
`user-select: none`, qui gèrent spécifiquement le menu de sélection
(`touch-action: none` seul n'empêche que le scroll/zoom natif). Voir
`DESIGN.md` § Sélection de texte désactivée sur le graphique et
`CHANGELOG.md` 1.9.13. Vérifié par un parcours Playwright réel en
contexte tactile (`hasTouch`/`isMobile`) : propriétés CSS calculées
confirmées (`touch-action: none`, `user-select: none`) sur
`#graphiqueContainer` **hors** mode placement (le scénario du rapport
utilisateur, jusqu'ici non couvert par `touch-action: none`), puis geste
de glisser-déposer complet du mode placement rejoué avec succès
(pastille affichant un prix cohérent) pour confirmer l'absence de
régression sur la fonctionnalité existante. Compteur porté à 5/5. Session
45 (2026-07-28, v1.9.14), **deuxième correctif hors plan consécutif** :
retour utilisateur direct sur deux bugs distincts constatés en usage réel
(captures d'écran) :
  - Le cours avant-bourse (Session 40, v1.9.9) ne s'affichait en réalité
    **jamais**, y compris pour NVIDIA en pré-ouverture réelle constatée
    par l'utilisateur. Root cause identifiée : `meta.marketState`/
    `meta.preMarketPrice`, utilisés par l'implémentation initiale,
    n'existent pas sur `/v8/finance/chart` (vérifié via le schéma
    `ChartMeta` de la bibliothèque `yahoo-finance2`, qui documente les
    champs réels de cet endpoint — ces champs appartiennent à
    `/v7/finance/quote`, un endpoint nécessitant un jeton de session non
    implémenté par ce projet). `fetchYahooFinance()` (`server/jobs/
    prices.js`) utilise désormais `meta.currentTradingPeriod.pre`
    (horaires Unix de la séance avant-bourse, bien présent sur
    `/v8/finance/chart`) pour détecter la fenêtre avant-bourse, puis un
    second appel ciblé (`interval=1m&includePrePost=true`, même endpoint,
    déclenché uniquement quand la fenêtre est active) pour lire le
    dernier prix réellement échangé. Voir `DESIGN.md` § Avant-bourse et
    `CHANGELOG.md` 1.9.14.
  - La pastille de prix d'une alerte existante sur le graphique
    (`.alerte-existante-badge`/`.alerte-hors-limite`) était entièrement
    opaque et pouvait masquer complètement la courbe de cours en
    arrière-plan lorsque le seuil se trouvait proche du prix affiché
    (position X fixe ancrée à droite, qui chevauche alors la partie la
    plus récente de la courbe). Fond translucide (`color-mix(in srgb,
    var(--bg) 85%, transparent)`). Voir `DESIGN.md` § Alertes existantes
    sur le graphique.

  Vérifié par tests unitaires réécrits (`server/test/prices.test.js`,
  `server/test/prices-job.test.js` — l'ancien mécanisme testé était
  auto-cohérent avec un mock reproduisant la même hypothèse erronée que
  l'implémentation, donc silencieusement faux ; les nouveaux tests
  simulent `currentTradingPeriod`/le second appel `interval=1m`) et par
  un parcours Playwright réel : capture d'écran confirmant la translucidité
  du badge (courbe visible en transparence), `getComputedStyle()`
  confirmant un canal alpha < 1. `node --test test/*.test.js`, 62/62
  verts. **Compteur reste à 5/5 (plafond) : la revue de dette technique
  (`METHOD.md` §0.2) est due sans exception à la prochaine session — deux
  sessions hors plan consécutives (44 et 45) l'ont déjà repoussée, aucune
  nouvelle déviation ne doit être acceptée sans un motif au moins aussi
  sérieux (même mise en garde déjà formulée lors d'un épisode similaire,
  Sessions 36/37).**

- [x] **Session A — socle Alpine.js** : Alpine.js vendorisé
  (`public/vendor/alpine.min.js`), rendu de la liste des valeurs migré sur
  un store réactif (`Alpine.store('portfolio')`), parité visuelle stricte
  avec l'existant (aucune fonctionnalité nouvelle visible). Fait cette
  session.
- [x] **Session B — sections + drag-and-drop** (perso, sans partage) :
  migration DB (`sections`, `section_id`/`ordre` sur `valeurs`, backfill
  d'une section "General" pour les comptes existants), API sections
  (`server/routes/sections.js`, CRUD + `PUT /reorder`), UI créer
  (`+ Nouvelle section`) / renommer (`M`) / supprimer (`X`) une section
  et glisser-déposer (SortableJS vendorisé, valeurs entre/dans les
  sections + sections elles-mêmes). Fait cette session (2026-07-25).
- [x] **Session C — badges d'alerte** : `alertes.valeur_id` + backfill,
  `hasAlerte` exposé par l'API, badge visuel sur les lignes. Fait cette
  session (2026-07-25).
- [x] **Session D — partage RW de section** : table `section_shares`
  (section_id/user_id/role), `GET /api/users` (liste restreinte pour la
  sélection d'un destinataire), routes imbriquées
  `/api/sections/:id/partages` (CRUD des partages, réservé au
  propriétaire) et `/api/sections/:id/valeurs` (consultation/écriture
  d'une section partagée selon le rôle), modale de partage
  (`#modalPartage`) et nouveau bloc "Partagé avec moi" dans l'UI,
  amendement explicite de `BUSINESS_RULES.md` (§ Partage de section),
  tests d'accès croisé entre deux comptes
  (`server/test/partage.test.js`). Fait cette session (2026-07-25).
  `GET /api/valeurs` (liste principale) reste inchangée et strictement
  limitée aux valeurs propres de l'utilisateur ; les valeurs des sections
  partagées ne sont exposées que par les nouvelles routes dédiées, une
  section à la fois (évite toute ambiguïté de ticker entre comptes).

## Sessions précédentes

- [x] **Session E — tuiles d'indices de marché** (demande explicite
  utilisateur, 2026-07-24) : les cartes `stat-card` (`#statTotal`/
  `#statHausse`/`#statBaisse`, comptage des valeurs suivies en
  hausse/baisse) sont remplacées par le suivi de 3 indices boursiers :
  **SBF 120** (`^SBF120`), **Nasdaq-100** (`^NDX`), **S&P 500**
  (`^GSPC`). Arbitrage utilisateur (voir historique de session) : même
  mécanisme Yahoo Finance que les valeurs suivies, même fréquence de
  rafraîchissement (cron 2 min), tuile affichant nom + cours (avec
  devise d'origine EUR/USD) + variation du jour. Nouvelle table
  `indices_marche` (données globales, non rattachées à un utilisateur —
  voir `BUSINESS_RULES.md` § Indices de marché), nouvelle route
  `GET /api/indices`, `updateIndices()` dans `server/jobs/prices.js`.
  Fait le 2026-07-25.
- [x] **Revue de dette technique n°3** : voir `CLAUDE.md` § Historique
  des revues de dette technique. Compteur remis à 0/3 (voir ci-dessus).
  Fait le 2026-07-25.
- [x] **Correctif tuiles d'indices de marché (v1.6.1)** : retour
  utilisateur sur la Session E (v1.6.0) — les tuiles `.stat-card`
  n'avaient aucune interaction au clic, et le cours suivi de sa devise
  (ex. « 28128.34 USD ») repassait à la ligne sur mobile, rendant les
  tuiles disproportionnellement hautes. Les tuiles sont désormais
  cliquables (ouvrent le graphique historique de l'indice via le même
  mécanisme `openGraphique()` que les valeurs suivies) et compactées sur
  mobile (`DESIGN.md` § Cartes statistiques). Fait le 2026-07-25.
- [x] **Précision de périmètre : usage exclusivement smartphone (v1.6.2)**
  (demande explicite utilisateur) : documenté dans `CLAUDE.md` §
  Présentation du projet — l'application n'a jamais vocation à être
  utilisée depuis un navigateur de bureau ou une tablette. Conséquence
  appliquée à `public/styles.css` (`DESIGN.md` § Responsive) : retrait du
  système à deux niveaux (style de base large + correctif
  `@media (max-width: 640px)`), les valeurs mobiles deviennent les
  valeurs par défaut uniques, plus aucune règle `@media` de largeur dans
  la feuille de style. Aucun changement visuel pour l'utilisateur sur un
  vrai téléphone (déjà piloté par le correctif mobile auparavant). Fait
  le 2026-07-25.
- [x] **Alerte depuis le graphique (v1.7.0)** (demande explicite
  utilisateur, captures d'écran TradingView) : nouvelle voie de création
  d'une alerte de seuil par glisser-déposer directement sur le graphique
  historique d'une valeur (voir `DESIGN.md` § Alerte depuis le
  graphique), en plus du formulaire existant. Disponible uniquement sur
  mes propres valeurs suivies — jamais sur un indice de marché ni sur une
  valeur d'une section partagée avec moi, ces deux cas ne pouvant
  techniquement jamais déclencher d'alerte (voir `BUSINESS_RULES.md` §
  Alertes de seuil, jointure de `checkAlerts()`). Fait le 2026-07-25.
- [x] **Revue de dette technique n°4** : voir `CLAUDE.md` § Historique
  des revues de dette technique. Compteur remis à 0/3. Fait le
  2026-07-25.
- [x] **Alertes existantes sur le graphique (v1.8.0)** (demande explicite
  utilisateur) : les seuils d'alerte actifs d'une valeur suivie sont
  désormais matérialisés sur son graphique historique par une ligne fine
  pointillée et une pastille de prix (voir `DESIGN.md` § Alertes
  existantes sur le graphique). Un seuil hors de la plage de valeurs
  affichée par le graphique pour la période courante n'est pas tracé :
  un repère compact « hors limites » (flèche + prix) est affiché en haut
  ou en bas du graphique à la place, plutôt que de fausser l'échelle ou
  de masquer silencieusement l'alerte. Même restriction que la Session
  17 : uniquement sur mes propres valeurs suivies, jamais sur un indice
  de marché ni sur une valeur d'une section partagée. Fait le 2026-07-25.
- [x] **Densité de la liste des valeurs suivies (v1.8.1)** (demande
  explicite utilisateur : voir au moins 8 valeurs sur un même écran sans
  scroller) : réduction des tailles de police et du padding de
  `.valeur-row` et de son contenu (voir `DESIGN.md` § Densité de la liste
  des valeurs suivies). Reste de l'application inchangé (en-tête, cartes
  d'indices, modales, carte alerte). Fait le 2026-07-25.
- [x] **Zoom désactivé + tuiles d'indices recompactées (v1.8.2)** (deux
  demandes explicites utilisateur dans la même session) : correctif du
  zoom intempestif (cause principale : champs de formulaire en 14px, sous
  le seuil de 16px déclenchant le zoom automatique iOS au focus ; voir
  `DESIGN.md` § PWA) et deuxième réduction des tuiles `.stat-card`
  (toujours disproportionnées une fois la liste des valeurs compactée en
  v1.8.1, voir `DESIGN.md` § Cartes statistiques). Fait le 2026-07-25.
- [x] **Revue de dette technique n°5** : voir `CLAUDE.md` § Historique
  des revues de dette technique. Compteur remis à 0/3 (voir ci-dessus).
  Fait le 2026-07-26.
- [x] **Logo de l'application (v1.8.3) + correctif densité cartes
  d'alerte (v1.8.4)** : voir Session hors plan ci-dessus. Fait le
  2026-07-26.
- [x] **Validation du ticker à l'ajout d'une valeur (v1.8.5) + correctif
  encodage URL (v1.8.6)** : voir Session hors plan ci-dessus. Fait le
  2026-07-26.
- [x] **Recherche de valeur à l'ajout (v1.8.7) + correctif suggestion
  toujours écrasante (v1.8.9)** : voir Session hors plan ci-dessus. Fait
  le 2026-07-26.
- [x] **Une même valeur dans plusieurs sections (v1.8.8)** : voir
  Session hors plan ci-dessus. Fait le 2026-07-26.
- [x] **Revue de dette technique n°6** : voir `CLAUDE.md` § Historique
  des revues de dette technique. Compteur remis à 0/3 (voir ci-dessus).
  Fait le 2026-07-26.
- [x] **Session 29 — factorisation Yahoo Finance (v1.8.10)** : voir
  ci-dessus. Fait le 2026-07-26.
- [x] **Session 30 — résolution complète de la dette reportée n°1-n°6
  (v1.9.0)** : voir ci-dessus. Fait le 2026-07-26.
- [x] **Session 31 — correctif FAB (v1.9.1)** et **Session 32 — correctif
  variation du jour (v1.9.2)** : voir `CHANGELOG.md` 1.9.1/1.9.2. Faits
  le 2026-07-27.
- [x] **Session 33 — fusion des endpoints d'ajout de valeur, retrait de
  `alertes.valeur_id`, graphique de volume (v1.9.3)** : voir
  `CHANGELOG.md` 1.9.3. Fait le 2026-07-27.
- [x] **Session 34 — affichage du dernier déclenchement d'une alerte
  (v1.9.4)** : voir `CHANGELOG.md` 1.9.4. Fait le 2026-07-27.
- [x] **Session 35 — correctif largeur d'axe Y/bouton cloche (v1.9.5)** :
  voir `CHANGELOG.md` 1.9.5. Fait le 2026-07-27.
- [x] **Session 36 — correctif critique ordre écriture/email de
  `checkAlerts()` (v1.9.6)** : voir `CHANGELOG.md` 1.9.6. Fait le
  2026-07-27.
- [x] **Session 37 — pastilles de notification (v1.9.7)** : voir
  `CHANGELOG.md` 1.9.7. Fait le 2026-07-27.
- [x] **Session 38 — correctif scroll de la liste de recherche sur
  mobile (v1.9.8)** : voir `CHANGELOG.md` 1.9.8. Fait le 2026-07-27.
- [x] **Revue de dette technique n°7** : voir `CLAUDE.md` § Historique
  des revues de dette technique. Compteur remis à 0/5 (voir ci-dessus).
  Fait le 2026-07-28.

## Backlog produit

À compléter au-delà de ce point — aucune autre source du dépôt (issue
tracker, notes de session, roadmap) ne liste de prochaines fonctionnalités
prévues au-delà du plan livré (Sessions A à E) et des sessions listées
ci-dessus. Ne pas confondre avec les « limites connues » listées dans
`SPECIFICATION_FONCTIONNELLE.md` (PER sectoriel, screening, Greeks,
volatilité implicite, parité) : ce sont des limites assumées par le
README public, pas des éléments déjà priorisés pour une future session —
à faire arbitrer par l'utilisateur avant de les inscrire ici. Le compteur
de revue est à 0/5 (voir ci-dessus) : la Revue n°7 vient d'être effectuée
et n'a laissé que des correctifs de dette technique jugés plus profonds
ou risqués, documentés et reportés dans `CLAUDE.md` (duplication
`roleSection()`/`rolesSection()`, duplication de la recette de
recréation de table entre migrations SQLite, quasi-duplication
structurelle entre `updatePrices()`/`updateIndices()`) — aucun d'entre
eux n'est classé comme fonctionnalité produit. La prochaine session porte
donc sur un point de ce backlog produit, à arbitrer avec l'utilisateur.
