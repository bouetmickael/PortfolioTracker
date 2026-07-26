# SPECIFICATION_FONCTIONNELLE.md — Ce que l'application doit faire

> Fichier propriétaire du périmètre fonctionnel : parcours utilisateur,
> écrans, comportements attendus. Pour les règles métier transverses
> (isolation des données, anti-spam des alertes, etc.), voir
> `BUSINESS_RULES.md`. Pour l'aspect visuel (palette, composants), voir
> `DESIGN.md`. Voir `CLAUDE.md` pour le point d'entrée.

## Contexte d'usage

Outil personnel de suivi de portefeuille (actions et warrants CTO
BoursoBank), auto-hébergé, pour un usage à 2-3 utilisateurs connus (pas de
gestion de rôles, pas d'inscription publique protégée par invitation — voir
`BUSINESS_RULES.md` pour les règles d'authentification).

## Écran de connexion (`public/login.html`)

- Formulaire email/mot de passe.
- Lien « S'inscrire » : saisie email + mot de passe via `prompt()`
  JavaScript natifs (pas de formulaire d'inscription dédié).
- Redirection automatique : un utilisateur déjà authentifié arrivant sur
  cette page est renvoyé vers l'écran principal ; un utilisateur non
  authentifié arrivant sur l'écran principal est renvoyé ici
  (`checkAuthAndRedirect`, `public/auth.js`).

## Écran principal (`public/index.html`)

- **En-tête** : titre « Portfolio », bouton d'actualisation manuelle,
  bouton menu utilisateur (nom, email, déconnexion).
- **Bloc statistiques** : 3 tuiles de suivi des indices de marché SBF 120,
  Nasdaq-100 et S&P 500 (nom, cours avec sa devise d'origine, variation du
  jour) — voir `DESIGN.md` § Cartes statistiques et `BUSINESS_RULES.md`
  § Indices de marché.
- **Section « Valeurs suivies »** : une carte par valeur (ticker, type
  Action/Warrant, nom optionnel, cours, variation en %, heure de dernière
  mise à jour, volume si disponible). Actions disponibles par carte :
  ouvrir le graphique, créer une alerte, supprimer la valeur. État vide
  avec appel à l'action « Ajouter une valeur ».
- **Section « Alertes actives »** : une carte par alerte active (ticker,
  seuils haut/bas), action de suppression. État vide sobre (pas de CTA).
- **Ajout d'une valeur** : bouton flottant (FAB) ou bouton de section,
  ouvre une modale (ticker, type Action/Warrant, nom optionnel). Le ticker
  est normalisé en majuscules côté serveur.
- **Création d'une alerte** : depuis une carte valeur, ouvre une modale avec
  le ticker préreempli (lecture seule) et deux champs de seuil optionnels
  (au moins un requis, voir `BUSINESS_RULES.md`).
- **Graphique** : modale plein écran avec sélecteur de période (1 jour,
  1 semaine, 1 mois, 1 an, Max) et rendu en courbe (Chart.js), cours en
  EUR sur l'axe Y et en infobulle.
- **Rafraîchissement des données** : polling HTTP toutes les 30 secondes
  pour les valeurs et les alertes (pas de mise à jour temps réel poussée
  par le serveur), plus un bouton d'actualisation manuelle immédiate.
- **Retours utilisateur** : toasts de confirmation/erreur (succès,
  avertissement, erreur, info), loader plein écran pendant les actions
  d'écriture (ajout/suppression de valeur ou d'alerte).

## Alertes de seuil par email

- Une alerte franchie (seuil haut dépassé ou seuil bas atteint) déclenche
  l'envoi d'un email à l'utilisateur propriétaire si `SMTP_*` est
  configuré (sinon simple log, voir `BUSINESS_RULES.md`).

## PWA (Progressive Web App)

- Installable sur mobile (Android/iOS) comme application quasi-native
  (`manifest.json`, mode `standalone`, icônes 192/512 — voir `DESIGN.md`
  pour leur statut provisoire).
- Service worker (`public/sw.js`) : cache offline des seuls fichiers
  statiques de l'application (HTML/CSS/JS), jamais des réponses `/api/*`
  (les données de portefeuille ne sont donc pas consultables hors ligne).

## Source de données et limites connues (assumées, pas un backlog)

- Cours et historique proviennent de Yahoo Finance (endpoint public non
  officiel, délai d'environ 15 minutes sur les marchés US, sans garantie de
  service — voir `ARCHITECTURE.md` §5).
- **Warrants identifiés par ISIN ou designation BoursoBank interne (ex.
  `DE000SJ1SRC8`, `LVMH/SGE WT 26`) non supportés** (session 2026-07-26,
  arbitrage explicite utilisateur apres recherche de faisabilite) : Yahoo
  Finance ne propose aucune recherche par ISIN et n'indexe pas ces
  produits structures (voir `BUSINESS_RULES.md` § Valeurs suivies, la
  verification du ticker a l'ajout les rejette donc systematiquement).
  Seule alternative identifiee, Boursorama (source du CTO BoursoBank),
  n'expose aucune API publique documentee — seulement des projets tiers
  de retro-ingenierie (scraping HTML/endpoints non officiels), ce qui
  demanderait une deuxieme source de donnees non contractuelle en plus de
  Yahoo Finance (resolution ISIN -> symbole interne Boursorama, schema de
  reponse different, maintenance propre) : juge trop couteux pour un
  correctif ponctuel, ecarte au profit du statu quo (warrants avec un
  ticker Yahoo Finance valide fonctionnent normalement ; les autres sont
  rejetes a l'ajout plutot que d'afficher un cours absent). A reconsiderer
  uniquement si l'utilisateur priorise explicitement une deuxieme source
  de donnees dans une session dediee.
- Non disponible en l'état, et non prévu à court terme : PER sectoriel
  moyen, screening automatique par critère, Greeks/delta des warrants,
  volatilité implicite, parité. Ce sont des limites assumées documentées
  dans le README public, pas des éléments du backlog (voir `BACKLOG.md` si
  l'utilisateur souhaite un jour les prioriser).
