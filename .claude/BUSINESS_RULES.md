# BUSINESS_RULES.md — Règles métier non négociables

> Fichier propriétaire des règles métier qui ne rentrent pas naturellement
> dans le narratif fonctionnel (`SPECIFICATION_FONCTIONNELLE.md`) : des
> invariants de sécurité, de cohérence des données ou de comportement que
> tout code futur doit respecter, même si rien ne le rappelle
> explicitement dans la demande. Voir `CLAUDE.md` pour le point d'entrée.

## Isolation des données par utilisateur

- Toute lecture/écriture sur `valeurs`, `alertes` ou `sections` est
  filtrée par `user_id` dans la requête SQL elle-même (jamais de filtrage
  a posteriori côté application). Voir `server/routes/valeurs.js`,
  `server/routes/alertes.js` et `server/routes/sections.js`. Aucune route
  ne doit exposer les données d'un autre utilisateur, y compris
  indirectement (agrégats, recherche globale).
- Toute route sous `/api/valeurs`, `/api/alertes` et `/api/sections`
  passe par `requireAuth` (`server/middleware/auth.js`) : une session
  valide (`req.session.userId`) est obligatoire.

## Authentification

- Mot de passe minimum 6 caractères (`server/routes/auth.js`), hashé avec
  `bcryptjs` (jamais stocké ni renvoyé en clair).
- Email unique par compte (contrainte `UNIQUE` sur `users.email`) ;
  tentative de doublon à l'inscription → 409.
- Pas d'authentification tierce (Google/OAuth) : retirée lors de la
  migration hors Firebase, flux jugé disproportionné pour 2-3 utilisateurs
  connus. Ne pas la réintroduire sans décision explicite.

## Valeurs suivies

- **Un ticker peut être suivi dans plusieurs sections d'un même
  utilisateur, mais pas deux fois dans la même section** (session
  2026-07-26, demande explicite utilisateur — amende la règle précédente
  qui limitait un ticker à une seule occurrence par utilisateur, tous
  sections confondues). Contrainte `UNIQUE(user_id, ticker, section_id)`
  (`server/db.js`, migration de recréation de table pour les bases
  existantes — SQLite ne permet pas de modifier une contrainte `UNIQUE`
  via `ALTER TABLE`) ; tentative de doublon **dans la même section** →
  409 (`Cette valeur est deja suivie dans cette section`).
  - `GET /api/valeurs`/`GET /api/sections/:id/valeurs` renvoient donc
    désormais un **tableau** (`toValeursArray()`, `server/valeurs.js`),
    plus une map indexée par ticker (impossible dès lors qu'un ticker
    peut apparaître plusieurs fois pour un même utilisateur) — chaque
    élément porte son propre `ticker` en plus de son `id`. **Changement
    de contrat d'API**, `id` est désormais le seul identifiant fiable
    d'une valeur suivie côté client (le ticker identifie l'instrument,
    pas une ligne précise) ; voir `public/app.js` (`supprimerValeur`,
    glisser-déposer déjà basé sur `valeur.id`).
  - `DELETE /api/valeurs/:id` (par id de ligne, plus par ticker) :
    supprimer une occurrence d'un ticker dans une section ne supprime
    pas ses occurrences dans d'autres sections.
  - Suppression d'une section : si une valeur à déplacer vers la section
    de repli y a déjà un homologue de même ticker, elle est supprimée
    (redondante) plutôt que déplacée (la contrainte `UNIQUE` l'interdit
    de toute façon) — voir `server/routes/sections.js` § `DELETE /:id`.
- Les alertes de seuil restent liées au **ticker** (`alertes.ticker`),
  pas à une ligne précise de `valeurs` : `hasAlerte`
  (`HAS_ALERTE_SUBQUERY`) et le job `checkAlerts()`
  (`server/jobs/alerts.js`) rejoignent sur `(user_id, ticker)`, jamais
  sur `valeurs.id`/`alertes.valeur_id` — une alerte créée sur un ticker
  suivi dans deux sections s'applique donc aux deux occurrences (même
  badge affiché sur les deux lignes). `checkAlerts()` regroupe désormais
  explicitement par `alertes.id` (`GROUP BY`) pour ne pas traiter (et
  emailer) une même alerte plusieurs fois quand son ticker correspond à
  plusieurs lignes `valeurs`. La colonne `alertes.valeur_id` existe
  toujours (compatibilité/historique) mais n'est plus utilisée par ces
  deux mécanismes — dette mineure à nettoyer dans une session dédiée
  (voir `CLAUDE.md` § Historique des revues).
- Supprimer la **dernière** occurrence d'un ticker pour un utilisateur
  (plus aucune section ne le suit) supprime aussi toutes les alertes
  associées à ce couple `(user_id, ticker)` (cascade applicative
  explicite dans la route, pas une contrainte SQL `ON DELETE CASCADE`) ;
  tant qu'une autre occurrence subsiste, les alertes sont conservées.
- **Le ticker est vérifié sur Yahoo Finance avant l'ajout** (session
  2026-07-26, retour utilisateur explicite : n'importe quel texte pouvait
  être ajouté comme "valeur", y compris pour un warrant, sans jamais
  afficher de cours — voir `server/valeurs.js` § `verifierTickerExiste`,
  appelée par `POST /api/valeurs`, seule route d'ajout depuis la fusion
  avec l'ancienne `POST /api/sections/:id/valeurs` — voir § Sections
  ci-dessous).
  Un ticker introuvable ou sans cours exploitable (`regularMarketPrice`
  absent ou nul) est rejeté (400, `Valeur introuvable sur Yahoo Finance`)
  plutôt qu'ajouté silencieusement avec un cours à 0 en attente du
  prochain cycle de la tâche planifiée. Une valeur acceptée est donc
  toujours insérée avec un cours réel dès sa création (pas de valeur à 0
  temporaire). Yahoo Finance restant la seule source de cours du projet
  (voir `ARCHITECTURE.md` § Points de vigilance), un warrant sans ticker
  Yahoo Finance valide (ex. un ISIN ou une désignation BoursoBank interne
  plutôt qu'un ticker coté) reste rejeté par cette même règle — pas une
  limitation spécifique aux warrants.

## Sections (liste des valeurs suivies)

- Chaque utilisateur possede toujours au moins une section : une section
  "General" est creee automatiquement a l'inscription
  (`server/routes/auth.js`) et, pour les comptes deja existants avant
  l'introduction des sections, par la migration/backfill au demarrage du
  serveur (`server/db.js`). La suppression de la derniere section d'un
  utilisateur est refusee (400).
- Supprimer une section reassigne automatiquement (dans la meme
  transaction) toutes les valeurs qu'elle contient vers une autre section
  restante de l'utilisateur (`server/routes/sections.js`) — jamais de
  valeur orpheline sans section.
- Une section et les valeurs qu'elle contient n'appartiennent qu'a un
  seul `user_id` (son proprietaire) ; elle peut neanmoins etre partagee
  en lecture ou en ecriture avec d'autres utilisateurs sans changer de
  proprietaire — voir § Partage de section (lecture/ecriture) ci-dessous
  pour le detail de cette exception.
- Un `sectionId` fourni a la creation d'une valeur (`POST /api/valeurs`,
  voir § Sections ci-dessous pour l'unification de cette route) n'est
  accepte que s'il designe une section possedee par l'utilisateur courant
  ou partagee en ecriture avec lui ; sinon la requete est rejetee (403,
  `Section invalide`) plutot que rattachee silencieusement a une autre
  section. Aucun `sectionId` fourni : repli sur la section par defaut de
  l'utilisateur (premiere section possedee, meme comportement qu'avant).

## Partage de section (lecture/ecriture)

> **Amendement explicite a la regle d'isolation stricte ci-dessus** (Session
> D, voir `BACKLOG.md`) : une section peut desormais etre visible et, selon
> le role, modifiable par un utilisateur autre que son proprietaire. Ceci ne
> remet pas en cause l'isolation par defaut (une section non partagee reste
> invisible a tout autre utilisateur) ; c'est une exception explicite,
> opt-in par le proprietaire, jamais un filtrage a posteriori.

- Une section peut etre partagee par son proprietaire avec un autre
  utilisateur connu (par email), avec un role `lecture` ou `ecriture`
  (table `section_shares`, colonnes `section_id`/`user_id`/`role`). Voir
  `server/partage.js` (`rolesSection`, `peutEcrire`) et
  `server/routes/sections.js`.
- Seul le proprietaire d'une section (`sections.user_id`) peut la renommer,
  la supprimer, la partager ou revoquer un partage — un utilisateur avec qui
  une section est partagee n'a jamais ces droits, quel que soit son role
  (`PUT/DELETE /api/sections/:id` et `GET/POST/DELETE /api/sections/:id/
  partages` verifient explicitement `user_id = proprietaire` en SQL).
- Role `lecture` : consultation seule des valeurs de la section partagee
  (`GET /api/sections/:id/valeurs`), aucune ecriture possible.
- Role `ecriture` : peut en plus ajouter des valeurs dans la section
  partagee via `POST /api/valeurs` (avec `sectionId`, route unique
  partagee avec l'ajout dans une section possedee — voir § Valeurs
  suivies) et en supprimer via `DELETE /api/sections/:id/valeurs/:ticker`,
  mais ne peut toujours pas renommer/supprimer la section ni gerer son
  partage.
- Les valeurs ajoutees dans une section partagee par un utilisateur en
  ecriture restent rattachees au `user_id` du **proprietaire** de la
  section, pas de l'utilisateur agissant : c'est la section qui est
  partagee (avec ses valeurs), jamais une copie de donnees creee chez
  l'utilisateur invite. La contrainte `UNIQUE(user_id, ticker, section_id)`
  (voir § Valeurs suivies) s'applique donc toujours par rapport au
  proprietaire de la section, pas a l'utilisateur qui effectue l'ajout.
- `GET /api/valeurs` (liste principale de l'utilisateur courant) continue de
  ne renvoyer que ses propres valeurs, filtrees par `user_id` en SQL —
  **inchange par cette fonctionnalite**. Les valeurs des sections partagees
  avec l'utilisateur ne sont exposees que par les routes dediees
  `GET /api/sections/:id/valeurs` (une section a la fois, donc sans
  ambiguite de ticker entre utilisateurs), elles-memes protegees par un
  controle d'acces explicite (`section_shares` ou propriete), jamais par un
  filtrage a posteriori cote application.
- `PUT /api/sections/reorder` accepte desormais aussi bien les sections
  possedees que les sections partagees en ecriture, mais ne modifie
  l'`ordre` de la section elle-meme (position dans la liste) que pour son
  proprietaire — un utilisateur en ecriture peut reordonner les valeurs a
  l'interieur d'une section partagee, jamais la position de cette section
  parmi les sections d'un autre utilisateur.
- Les alertes de seuil restent strictement privees par utilisateur
  (`alertes.user_id`), **non affectees par le partage de section** : un
  utilisateur avec un acces en ecriture a une section partagee ne peut pas
  creer d'alerte "au nom" du proprietaire de la section — hors perimetre de
  cette fonctionnalite, non demande.
- `GET /api/users` expose une liste restreinte (id, email, displayName) des
  autres comptes connus, utilisee uniquement pour choisir un destinataire de
  partage — aucune autre donnee (mot de passe, valeurs, sections) n'est
  exposee par cette route.

## Portefeuilles (positions detenues)

- Concept distinct des « Valeurs suivies » : un portefeuille reconstitue
  une position reellement detenue (quantite de titres + prix de revient),
  la liste des valeurs suivies ne suit qu'un cours sans quantite ni cout.
  Les deux listes sont independantes (une valeur suivie n'a pas besoin
  d'etre dans un portefeuille, et inversement).
- Un portefeuille (table `portefeuilles`) n'appartient qu'a un seul
  `user_id`, aucun partage possible (contrairement aux sections) : toute
  lecture/ecriture sur `portefeuilles`/`portefeuille_lignes` est filtree
  par `user_id` en SQL (`portefeuillePossede()`,
  `server/routes/portefeuilles.js`), meme regle d'isolation que
  `valeurs`/`alertes`/`sections`. Toutes les routes exigent `requireAuth`.
- Un utilisateur peut creer plusieurs portefeuilles, sans minimum requis
  (contrairement aux sections, qui exigent toujours au moins une section
  "General") : supprimer le dernier portefeuille d'un utilisateur est
  autorise, l'application affiche alors un etat vide invitant a en
  recreer un.
- **Une meme valeur ne peut apparaitre qu'une fois par portefeuille**
  (contrainte `UNIQUE(portefeuille_id, ticker)`), tentative de doublon
  dans le meme portefeuille -> 409. Contrairement aux sections de la
  liste des valeurs suivies, rien n'empeche en revanche la meme valeur
  d'etre presente dans plusieurs portefeuilles differents de
  l'utilisateur (chaque portefeuille est une reconstitution independante,
  ex. un CTO et un PEA peuvent tous deux detenir la meme action).
- **Le ticker est verifie sur Yahoo Finance avant l'ajout d'une position**
  (`verifierTickerExiste`, meme fonction partagee que pour l'ajout d'une
  valeur suivie, voir § Valeurs suivies) : une position est toujours
  creee avec un cours reel des sa creation, jamais a 0 en attendant le
  prochain cycle de la tache planifiee.
- La quantite doit etre strictement positive et le prix de revient
  positif ou nul (400 sinon) ; la quantite et le prix de revient d'une
  position existante peuvent etre modifies (`PUT
  /api/portefeuilles/:id/positions/:positionId`) sans recreer la ligne.
- Supprimer un portefeuille supprime toutes ses positions (`ON DELETE
  CASCADE` sur `portefeuille_lignes.portefeuille_id`, contrairement a la
  suppression d'une section qui reassigne ses valeurs plutot que de les
  supprimer).
- Le cours de chaque position est mis a jour par une tache planifiee
  dediee (`updatePortefeuilleLignes()`, `server/jobs/prices.js`, meme
  cadence de 2 minutes que les valeurs suivies et les indices) - meme
  regle d'integrite des cours que le reste de l'application (voir §
  Integrite des cours ci-dessous) : aucune donnee inventee en cas
  d'echec.
- **Aucune alerte de seuil sur une position de portefeuille** : le
  formulaire/le glisser-depose de creation d'alerte restent reserves aux
  valeurs de la liste "Valeurs suivies" de l'utilisateur (voir §
  Alertes de seuil ci-dessous, meme raison technique -
  `checkAlerts()` ne rejoint que la table `valeurs`, jamais
  `portefeuille_lignes`) - non demande, pas implemente.

## Alertes de seuil

- Une alerte doit définir au moins un seuil (`seuilHaut` ou `seuilBas`) ;
  refusée sinon (400).
- **Anti-répétition** : une alerte ne se redéclenche que si le dernier
  cours enregistré au moment de la précédente alerte
  (`dernier_cours_alerte`) était encore en dehors du seuil franchi. Cela
  évite de renvoyer un email à chaque cycle de 2 minutes tant que le cours
  reste au-delà du seuil (`server/jobs/alerts.js`). Ne pas remplacer cette
  logique par un simple `cours >= seuil` sans la condition sur
  `dernier_cours_alerte`, sous peine de spammer l'utilisateur.
- L'envoi d'email est optionnel et non bloquant : sans `SMTP_*` configuré,
  l'alerte est seulement loguée (`Email non envoye (SMTP non configure)`),
  jamais une erreur qui bloque le reste de l'application.
- **Le déclenchement (`dernier_cours_alerte`/`derniere_alerte`) est
  toujours enregistré avant la tentative d'envoi d'email, jamais après**
  (`server/jobs/alerts.js`) — l'envoi est entouré de son propre
  `try/catch` qui ne fait que loguer un échec, sans jamais empêcher
  l'écriture déjà faite. Bug réel corrigé en v1.9.6 (retour utilisateur
  du 2026-07-27) : l'ordre inverse (email envoyé avant l'écriture)
  faisait qu'un SMTP configuré mais en échec (mauvais mot de passe, port
  bloqué…) empêchait indéfiniment `dernier_cours_alerte`/
  `derniere_alerte` d'être écrits — l'alerte n'apparaissait alors plus
  jamais comme déclenchée nulle part, ni dans l'app (voir `DESIGN.md` §
  Carte alerte) ni par email au cycle suivant. Ne pas réintroduire cet
  ordre : l'échec de l'email ne doit jamais pouvoir empêcher
  l'enregistrement du franchissement de seuil.
- **Portée technique de toute voie de création d'alerte** (formulaire
  `#modalCreateAlerte` ou glisser-déposer sur le graphique, voir
  `DESIGN.md` § Alerte depuis le graphique) : `checkAlerts()`
  (`server/jobs/alerts.js`) n'évalue une alerte que via une jointure
  stricte `valeurs.user_id = alertes.user_id AND valeurs.ticker =
  alertes.ticker`. Une alerte créée sur un ticker absent de `valeurs`
  pour l'utilisateur courant (un indice de marché, ou la valeur d'un
  autre compte via une section partagée) n'est donc **jamais évaluée** —
  silencieusement morte, pas une erreur visible. Toute nouvelle UI de
  création d'alerte doit donc rester restreinte aux valeurs de ma propre
  liste "Valeurs suivies", jamais aux indices ni aux sections partagées
  avec moi.

## Indices de marché (données globales)

- Les 3 indices suivis (SBF 120, Nasdaq-100, S&P 500, table
  `indices_marche`, `server/indices.js`) sont des données de marché
  **globales**, pas des données utilisateur : contrairement à `valeurs`/
  `alertes`/`sections`, ils ne sont pas filtrés par `user_id` et sont
  identiques pour tous les comptes. `GET /api/indices` reste protégée par
  `requireAuth` (cohérence avec le reste de l'API, pas de fuite
  d'information avant authentification), mais ce n'est pas une exception
  à isoler comme le partage de section — il n'y a jamais eu de
  `user_id` sur ces données.

## Intégrité des cours

- **Aucune donnée n'est simulée** : si la récupération du cours échoue
  (Yahoo Finance indisponible, ticker invalide, etc.), la tâche planifiée
  logue l'erreur et n'écrit rien en base — le `cours` reste à sa dernière
  valeur connue (ou `0` si jamais mis à jour). Ne jamais introduire de
  valeur par défaut inventée pour masquer un échec de récupération. Règle
  identique pour les indices de marché (`indices_marche`,
  `server/jobs/prices.js` § `updateIndices`).

## Sécurité opérationnelle

- `SESSION_SECRET` doit être défini avant tout usage réel (y compris en
  local) : sans lui, le serveur démarre quand même avec un avertissement en
  log mais utilise une valeur par défaut non sécurisée.
- Le fichier `.env` (secrets : session, SMTP) ne doit jamais être committé
  (déjà exclu par `.gitignore`).
