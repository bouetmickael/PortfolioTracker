# BUSINESS_RULES.md — Règles métier non négociables

> Fichier propriétaire des règles métier qui ne rentrent pas naturellement
> dans le narratif fonctionnel (`SPECIFICATION_FONCTIONNELLE.md`) : des
> invariants de sécurité, de cohérence des données ou de comportement que
> tout code futur doit respecter, même si rien ne le rappelle
> explicitement dans la demande. Voir `CLAUDE.md` pour le point d'entrée.

## Isolation des données par utilisateur

- Toute lecture/écriture sur `valeurs` ou `alertes` est filtrée par
  `user_id` dans la requête SQL elle-même (jamais de filtrage a posteriori
  côté application). Voir `server/routes/valeurs.js` et
  `server/routes/alertes.js`. Aucune route ne doit exposer les données d'un
  autre utilisateur, y compris indirectement (agrégats, recherche globale).
- Toute route sous `/api/valeurs` et `/api/alertes` passe par
  `requireAuth` (`server/middleware/auth.js`) : une session valide
  (`req.session.userId`) est obligatoire.

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

## Intégrité des cours

- **Aucune donnée n'est simulée** : si la récupération du cours échoue
  (Yahoo Finance indisponible, ticker invalide, etc.), la tâche planifiée
  logue l'erreur et n'écrit rien en base — le `cours` reste à sa dernière
  valeur connue (ou `0` si jamais mis à jour). Ne jamais introduire de
  valeur par défaut inventée pour masquer un échec de récupération.

## Sécurité opérationnelle

- `SESSION_SECRET` doit être défini avant tout usage réel (y compris en
  local) : sans lui, le serveur démarre quand même avec un avertissement en
  log mais utilise une valeur par défaut non sécurisée.
- Le fichier `.env` (secrets : session, SMTP) ne doit jamais être committé
  (déjà exclu par `.gitignore`).
