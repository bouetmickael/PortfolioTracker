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

- Un ticker ne peut être suivi qu'une seule fois par utilisateur
  (contrainte `UNIQUE(user_id, ticker)`) ; tentative de doublon → 409.
- Supprimer une valeur suivie supprime aussi toutes les alertes associées à
  ce couple `(user_id, ticker)` (cascade applicative explicite dans la
  route, pas une contrainte SQL `ON DELETE CASCADE`).
- **Le ticker est vérifié sur Yahoo Finance avant l'ajout** (session
  2026-07-26, retour utilisateur explicite : n'importe quel texte pouvait
  être ajouté comme "valeur", y compris pour un warrant, sans jamais
  afficher de cours — voir `server/valeurs.js` § `verifierTickerExiste`,
  appelée par `POST /api/valeurs` et `POST /api/sections/:id/valeurs`).
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
- Un `sectionId` fourni a la creation d'une valeur (`POST /api/valeurs`)
  n'est accepte que s'il designe une section appartenant a l'utilisateur
  courant ; sinon la valeur est rattachee a la section par defaut de
  l'utilisateur (jamais a une section d'un autre utilisateur).

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
- Role `ecriture` : peut en plus ajouter et supprimer des valeurs dans la
  section partagee via des routes dediees
  (`POST`/`DELETE /api/sections/:id/valeurs/:ticker`), mais ne peut
  toujours pas renommer/supprimer la section ni gerer son partage.
- Les valeurs ajoutees dans une section partagee par un utilisateur en
  ecriture restent rattachees au `user_id` du **proprietaire** de la
  section, pas de l'utilisateur agissant : c'est la section qui est
  partagee (avec ses valeurs), jamais une copie de donnees creee chez
  l'utilisateur invite. La contrainte `UNIQUE(user_id, ticker)` s'applique
  donc toujours par rapport au proprietaire de la section, pas a
  l'utilisateur qui effectue l'ajout.
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
