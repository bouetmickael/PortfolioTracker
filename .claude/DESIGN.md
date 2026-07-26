# DESIGN.md — Palette, typographie, composants

> Fichier propriétaire de toute question d'UI. En cas d'écart avec un autre
> document, ce fichier fait foi sur le visuel. Source unique du style :
> `public/styles.css`. Voir `CLAUDE.md` pour le point d'entrée.

## Direction générale

**Révision majeure (session du 2026-07-25, demande explicite utilisateur,
captures d'écran de l'ancienne version du projet avant la refonte
Material sobre)** : le projet est revenu au style visuel de l'ancienne
version — en-tête bleu marine fixe, accent or/gold, icônes SVG pour les
actions, sections repliables (chevron), cartes statistiques à bordure
colorée. Ceci **remplace** l'ancienne direction « sobre, sans icône,
boutons lettre unique » qui prévalait jusqu'à cette session (conservée
ci-dessous uniquement à titre d'historique, ne plus l'appliquer à du
code nouveau) :

> ~~Style inspiré de Material Design (Google), sobre, sans emoji ni icône
> vectorielle : les boutons d'action utilisent des libellés lettre
> unique (R actualiser, U menu utilisateur, A créer alerte, X
> supprimer/fermer, + ajouter) plutôt que des icônes SVG ou une police
> d'icônes.~~

Nouvelle convention, à appliquer à tout nouveau bouton d'action :
**icônes SVG inline** (pas de police d'icônes, pas de bibliothèque
externe, pas de CDN — cohérent avec la philosophie de vendorisation
locale du projet, voir `ARCHITECTURE.md`). Toutes les icônes sont
définies une seule fois comme `<symbol>` dans un sprite SVG caché en
tête de `public/index.html` (`<svg style="display:none">`), puis
référencées via `<svg class="icon"><use href="#icon-xxx"></use></svg>`.
Jeu d'icônes actuel (tenir cette liste à jour si une icône est
ajoutée/retirée) : `icon-refresh` (actualiser), `icon-user` (menu
utilisateur), `icon-moon`/`icon-sun` (bascule thème clair/sombre),
`icon-bell` (créer alerte), `icon-trash` (supprimer), `icon-pencil`
(renommer une section), `icon-share` (partager une section, voir
composant « Partage de section » ci-dessous), `icon-chevron-down`
(replier/déplier une section), `icon-x` (fermer une modale), `icon-plus`
(ajouter), `icon-check` (valider le seuil d'une alerte posée directement
sur le graphique, voir composant « Alerte depuis le graphique »
ci-dessous). Toutes
en `stroke="currentColor"` (la couleur suit `color` du bouton parent),
`stroke-width="2"`, viewBox `0 0 24 24`, style trait rond (`stroke-
linecap`/`stroke-linejoin: round`), taille `20x20` (`.icon`), `16x16`
(`.icon-sm`, utilisé dans les actions denses de ligne) ou `10x10`
(`.icon-xs`, utilisé uniquement dans le badge d'alerte `.badge-alerte`
de la liste des valeurs, voir composant « Liste des valeurs suivies »
ci-dessous). Exception :
`icon-grip` (poignée de glisser-déposer d'une valeur, voir composant
« Liste des valeurs suivies » ci-dessous) est en `fill="currentColor"`
(6 points pleins) plutôt qu'en trait, plus lisible à petite taille pour
ce usage précis.

Aucun émoji dans le code, les commentaires ou l'UI (règle inchangée,
voir `ARCHITECTURE.md` §4).

## Thème clair/sombre

Bascule fonctionnelle (icône lune/soleil dans le header), implémentée en
CSS variables + attribut `data-theme` sur `<html>` :
- `:root` définit le thème clair (par défaut).
- `[data-theme="dark"]` surcharge les variables pour le thème sombre.
- L'en-tête (`--header-bg`/`--header-text`/`--header-text-secondary`)
  reste **fixe en bleu marine dans les deux thèmes** — seul le contenu
  en dessous (fond de page, cartes, texte) change entre clair et sombre.
- Persistance : `localStorage.getItem('theme')` ; à défaut, suit
  `prefers-color-scheme`. Un script inline synchrone en tête de
  `public/index.html` (avant le CSS) applique l'attribut `data-theme`
  avant le premier rendu pour éviter un flash de mauvais thème (FOUC).
  Bascule et persistance gérées par `initTheme()` dans `public/app.js`.

## Palette (`:root` dans `public/styles.css`)

| Variable | Clair | Sombre | Usage |
|---|---|---|---|
| `--primary` | `#c9a227` | `#c9a227` | Accent or/gold — boutons primaires, FAB, boutons d'ajout, sélecteur de période actif, ligne du graphique |
| `--primary-dark` | `#a9861f` | `#a9861f` | État hover des éléments `--primary` |
| `--success` | `#34a853` | `#5fbb7a` | Variations positives, toast succès, bordure carte "Hausse" |
| `--danger` | `#ea4335` | `#f2685c` | Variations négatives, toast erreur, bordure carte "Baisse" |
| `--warning` | `#fbbc04` | `#ffcb42` | Toast avertissement (texte toujours `#202124`, pas `--text`, pour rester lisible sur fond jaune dans les deux thèmes) |
| `--text` | `#202124` | `#e8eaed` | Texte principal |
| `--text-secondary` | `#5f6368` | `#9aa0a6` | Texte secondaire, labels, aide |
| `--border` | `#dadce0` | `#3c4043` | Bordures inputs, séparateurs |
| `--bg` | `#ffffff` | `#242b3d` | Fond des cartes, modales |
| `--bg-secondary` | `#eef0f4` | `#171d2b` | Fond de page, hover boutons secondaires |
| `--bg-hover` | `#e8eaed` | `#2e3548` | Hover explicite (`.btn-secondary`) |
| `--toast-neutral` | `#202124` | `#0f1420` | Fond du toast neutre/info (jamais `--text`, qui s'inverse entre thèmes) |
| `--header-bg` | `#1b2438` | `#1b2438` | En-tête, fixe dans les deux thèmes |
| `--header-text` | `#ffffff` | `#ffffff` | Texte/titre de l'en-tête |
| `--header-text-secondary` | `#9aa4bb` | `#9aa4bb` | Icônes de l'en-tête au repos (blanc au hover) |
| `--shadow` / `--shadow-large` | ombres Material claires | ombres plus sombres/opaques | Cartes / éléments flottants (FAB, dropdown) |

Page de connexion (`public/login.html`) : **non concernée par cette
révision**, conserve son fond dégradé propre `linear-gradient(135deg,
#667eea 0%, #764ba2 100%)`, distinct de la palette applicative (choix
délibéré antérieur, non remis en cause).

## Typographie

- Police : `Roboto` puis fallback système (`-apple-system,
  BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`).
- Titres : `header h1` 20px/500 (`--header-text`), `section h2` 18px/500,
  `login-card h1` 28px. Numéro de version (`#appVersion`, à côté du titre
  `header h1`) : 11px, `--header-text-secondary`, poids normal.
- Valeurs chiffrées mises en avant : `stat-value` 28px/500, avec
  `stat-variation` (13px/500) empilé juste en dessous sur les tuiles
  d'indices de marché, même convention de coloration `--success`/
  `--danger` que `valeur-variation` ci-dessous. `valeur-cours`
  (ligne de la liste des valeurs suivies) : **13px/500** (réduit depuis
  15px, voir § Densité de la liste des valeurs suivies), aligné à droite
  avec `valeur-variation` (**10px/500**, réduit depuis 13px) empilé juste
  en dessous, coloré en `--success`/`--danger` selon le signe, sans fond
  de pastille (texte simple).
- Texte secondaire (labels, aide, footers de ligne) : 9-13px,
  `--text-secondary`.

## Composants

- **Header** : sticky en haut, fond `--header-bg` (bleu marine, fixe dans
  les deux thèmes), texte/icônes `--header-text`/`--header-text-
  secondary`, `--shadow`, logo + titre + numéro de version côte à côte
  (`.header-titre`). Le logo (`.header-logo`, session 2026-07-26, demande
  explicite utilisateur) est une image raster (`public/icons/icon-192.png`,
  pas une icône du sprite SVG — voir § PWA pour l'origine du fichier),
  28x28, coins arrondis 6px, tout à gauche du titre. Actions à droite
  (`.header-actions`, icônes SVG) : bascule thème (`icon-moon`/
  `icon-sun`), actualiser (`icon-refresh`), menu utilisateur (`icon-
  user`).
- **Cartes statistiques** (`.stats-container`/`.stat-card`, session
  2026-07-25 « suivi d'indices de marché ») : grille 3 colonnes égales,
  fond `--bg`, coins 6px, `--shadow`, **bordure supérieure colorée 2px**.
  Affichent 3 indices de marché suivis (`SBF 120`, `Nasdaq-100`,
  `S&P 500`, voir `BUSINESS_RULES.md`/`ARCHITECTURE.md` pour la source des
  cours). Rendu par un `<template x-for>` sur `$store.portfolio.indices`
  (état du store Alpine, peuplé par `GET /api/indices`, rafraîchi par le
  même polling que les valeurs/alertes). Chaque tuile : nom de l'indice
  (`.stat-label`, 9px), cours avec sa devise d'origine EUR/USD
  (`.stat-value`, 13px/500 sans retour à la ligne, ex. « 5 432.10 EUR »),
  variation du jour en dessous (`.stat-variation`, 9px/500, coloré
  `--success`/`--danger` selon le signe, même convention que
  `.valeur-variation` sur la liste des valeurs). La bordure supérieure
  suit également le signe de la variation de chaque indice
  (`--success`/`--danger`/`--header-bg` si nul). Chaque tuile est
  cliquable (`cursor: pointer`, survol `--bg-secondary` comme
  `.valeur-row`) et ouvre le graphique historique de l'indice via le même
  mécanisme que les valeurs suivies (`openGraphique(ticker, nom)`, titre
  de la modale affichant le nom lisible de l'indice plutôt que son ticker
  Yahoo Finance brut ; correctif v1.6.1, les tuiles ne réagissaient
  auparavant à aucune interaction). **Tailles réduites une seconde fois en
  v1.8.2** (retour utilisateur explicite : les tuiles restaient
  disproportionnées une fois la liste des valeurs suivies compactée en
  v1.8.1, voir § Densité de la liste des valeurs suivies) : padding
  `8px 6px` → `5px 4px`, `.stat-label` 10px → 9px, `.stat-value` 16px →
  13px, `.stat-variation` 11px → 9px, `line-height: 1.2` explicite sur les
  trois (au lieu de l'interligne global 1.5 du `body`). Plus aucune
  distinction de taille par largeur d'écran depuis v1.6.2 (application
  mobile-only, un seul jeu de valeurs, voir § Responsive) : ces valeurs
  compactes sont désormais les seules, sans variante plus grande à
  maintenir en parallèle.
- **Sections repliables** (`Valeurs suivies`, `Alertes actives`, et
  chaque sous-section de la liste des valeurs) : titre précédé d'une
  icône chevron (`icon-chevron-down`) qui pivote -90° quand la section
  est repliée (`x-data="{ ouvert: true }"` local à chaque section,
  `x-show`/`x-transition` sur le contenu — état en mémoire uniquement,
  non persisté côté serveur).
- **Liste des valeurs suivies** (`.valeurs-liste`) : décokée en sections
  (`.valeurs-section`, voir Session B de `BACKLOG.md` pour la
  fonctionnalité), chacune un conteneur séparé avec coins 8px/`--shadow`.
  En-tête de section (`.valeurs-section-header`, fond `--bg-secondary`) :
  titre repliable (chevron + nom, poignée de glisser-déposer pour
  réordonner les sections entre elles) et quatre boutons icône à droite,
  dans cet ordre : `icon-plus` (ajouter une valeur directement dans
  cette section, session 2026-07-26 — voir § Valeurs suivies dupliquées
  entre sections ci-dessous), `icon-share` (partager la section, voir
  composant « Partage de section » ci-dessous), `icon-pencil` (renommer)
  et `icon-trash` (supprimer, masqué s'il ne
  reste qu'une section — la dernière section d'un utilisateur ne peut pas
  être supprimée). Une section se crée via le bouton texte `+ Nouvelle
  section` en bas de liste. Renommer/créer une section et confirmer une
  suppression (section, valeur, alerte) passent par des **modales
  génériques réutilisables** (`#modalPrompt`/`#modalConfirm`,
  `showPrompt()`/`showConfirm()` dans `public/app.js`, résolues comme des
  `Promise`) plutôt que par `window.prompt()`/`window.confirm()` — les
  popups natives du navigateur ignorent entièrement le thème clair/sombre
  de l'application et détonnaient visuellement (retour utilisateur du
  2026-07-25). Le bouton de confirmation d'une action destructive utilise
  `.btn-danger` (fond `--danger`).
  À l'intérieur de chaque section, chaque valeur reste une ligne plate
  (`.valeur-row`) séparée par une bordure fine (`--border`), fond
  `--bg-secondary` au survol, toute la ligne cliquable pour ouvrir le
  graphique. Le glisser-déposer (SortableJS, `public/vendor/
  sortable.min.js`, vers une autre position dans la même section ou vers
  une autre section) ne se déclenche **que** depuis une poignée dédiée
  (`.valeur-drag-handle`, icône `icon-grip` à 6 points, tout à gauche de
  la ligne, avant l'avatar) — **pas** depuis n'importe quel point de la
  ligne : sur mobile, rendre toute la ligne glissable empêcherait de
  scroller la page en touchant une valeur (retour utilisateur du
  2026-07-25). La poignée porte `touch-action: none` (empêche le
  navigateur d'intercepter le geste tactile comme un scroll), le reste de
  la ligne n'a aucune restriction de `touch-action` et scrolle
  normalement. Contenu de la ligne :
  - poignée de glisser-déposer (icône `icon-grip`) ;
  - avatar rond à gauche (initiales + couleur générée depuis le ticker,
    28px de diamètre — voir § Densité de la liste des valeurs suivies) ;
  - au centre : nom de la valeur (`.valeur-nom`, 13px/500, réduit depuis
    15px ; ticker en repli si le nom est absent), puis ticker + **badge
    pilule** du type (`.badge-type`, ex. "ACTION"/"WARRANT", fond
    `--bg-secondary`, 9px/600, majuscules), suivi si la valeur a au moins
    une alerte de seuil active d'un second badge pilule (`.badge-alerte`,
    icône `icon-bell` en `.icon-xs`, fond `--primary` (or), icône blanche
    — même gabarit que `.badge-type` mais coloré pour signaler l'état
    actif plutôt que le type de valeur), sur la ligne suivante
    (`.valeur-sousligne`) ; `hasAlerte` (booléen calculé côté API par
    jointure sur les alertes actives de l'utilisateur, voir
    `BACKLOG.md` Session C) pilote son affichage (`x-show`), pas de
    nouvelle donnée cliente, puis le footer sur **deux lignes distinctes** — `MAJ: hh:mm` et
    `Vol: xxx` chacune sur sa propre ligne (`.valeur-footer` en
    `flex-direction: column`), pour que le volume ne soit jamais coupé/
    tronqué au milieu par un retour à la ligne intempestif (correction
    explicite demandée cette session, l'ancien format `MAJ: hh:mm · Vol:
    xxx` sur une seule ligne pouvait wrapper au milieu de la valeur) ;
  - cours et variation empilés à droite ;
  - actions `icon-bell` (créer alerte) / `icon-trash` (supprimer) tout à
    droite (avec `stopPropagation` pour ne pas déclencher l'ouverture du
    graphique).
  - **Densité de la liste des valeurs suivies** (session 2026-07-25,
    demande explicite utilisateur : voir au moins 8 valeurs sur un même
    écran sans avoir à scroller). Réduction ciblée de `.valeur-row` et de
    son contenu, sans toucher au reste de l'application (header, cartes
    stats, modales, carte alerte) : padding vertical de la ligne 12px ->
    3px, avatar 40px -> 28px (police 14px -> 10px), `.valeur-nom` 15px ->
    13px, `.valeur-sousligne`/`.badge-type`/`.badge-alerte` 12px/10px ->
    10px/9px, `.valeur-footer` 11px -> 9px, `.valeur-cours` 15px -> 13px,
    `.valeur-variation` 13px -> 10px, boutons d'action (`icon-bell`/
    `icon-trash`) padding 6px -> 4px. `line-height` explicite à 1.25 sur
    ces éléments (au lieu de l'interligne global 1.5 du `body`) pour
    empêcher l'interligne de regonfler l'économie de place gagnée par la
    réduction de police. Résultat vérifié : 8 lignes pleinement visibles
    sur un écran de 375x667 (le plus petit gabarit de smartphone
    couramment testé), 10+ sur un gabarit plus grand (390x844). Aucun
    changement de comportement (glisser-déposer, `stopPropagation` des
    actions, affichage conditionnel du volume) — uniquement une réduction
    de gabarit visuel.
  - **Valeurs suivies dupliquées entre sections** (session 2026-07-26,
    demande explicite utilisateur : pouvoir ajouter une valeur déjà
    suivie dans une section à une autre section, sans que ce soit
    considéré comme un doublon). Le bouton `icon-plus` de l'en-tête de
    chaque section possédée (voir ci-dessus) ouvre la modale d'ajout
    ciblée sur cette section précise (même modale que le FAB/bouton
    d'ajout global, `#modalAddValeur` — voir `BUSINESS_RULES.md` §
    Valeurs suivies pour la contrainte d'unicité par section). Chaque
    occurrence d'un même ticker est une ligne `.valeur-row` indépendante
    (même avatar/couleur générée depuis le ticker, donc visuellement
    identique dans les deux sections) : supprimer l'une n'affecte pas
    l'autre. Le badge d'alerte (`.badge-alerte`) s'affiche en revanche
    sur **toutes** les occurrences d'un ticker ayant une alerte active,
    une alerte étant liée au ticker et non à une occurrence précise.
- **Carte alerte** : coins/ombre façon carte classique (grille séparée de
  la liste des valeurs), action de suppression à droite (`icon-trash`).
  **Densité alignée sur la liste des valeurs suivies** (v1.8.4, retour
  utilisateur explicite : les cartes restaient nettement plus imposantes
  que les lignes `.valeur-row` une fois celles-ci compactées en v1.8.1) :
  padding `12px 16px` → `4px 10px`, espacement entre cartes
  (`.alertes-liste`) 8px → 4px, `.alerte-ticker` sans taille explicite
  (héritait des 15-16px du corps) → 13px/500 (aligné sur `.valeur-nom`),
  `.alerte-seuils` 13px → 10px (aligné sur `.valeur-sousligne`),
  `line-height: 1.25` explicite sur les deux (même convention que
  `.valeur-*`), bouton `icon-trash` padding 6px → 4px (`.alerte-card
  .btn-icon-small`, même réduction que `.valeur-actions .btn-icon-small`).
  Résultat vérifié : carte d'alerte 37.75px de haut contre 47.75px pour
  une ligne de valeur (mesure DOM réelle) — strictement plus compacte,
  pas seulement égale.
- **Partage de section** (Session D de `BACKLOG.md`, voir
  `BUSINESS_RULES.md` § Partage de section pour les règles d'accès) :
  - Bouton `icon-share` dans l'en-tête de chaque section possédée ouvre
    une modale générique `#modalPartage` (même gabarit que les autres
    modales) : liste des partages existants (`.partage-row`, un par
    utilisateur avec qui la section est partagée — email + libellé du
    rôle « Lecture seule »/« Lecture et écriture » + `icon-trash` pour
    révoquer), puis un formulaire (email avec autocomplétion via
    `<datalist>` alimentée par `GET /api/users`, sélecteur de rôle) et un
    bouton `Partager`. Aucune modale dédiée à la révocation : l'icône
    poubelle de chaque `.partage-row` déclenche directement
    `showConfirm()` puis la suppression.
  - Section « Partagé avec moi » : nouvelle section repliable (même
    gabarit que « Valeurs suivies »/« Alertes actives »), affichée
    uniquement si au moins une section a été partagée avec l'utilisateur
    courant (`x-show`). Chaque section partagée y est rendue avec le même
    gabarit `.valeurs-section`/`.valeur-row` que la liste des valeurs
    suivies, mais son en-tête n'a ni chevron de glisser-déposer, ni
    `icon-pencil`/`icon-trash`/`icon-share` (l'utilisateur invité ne peut
    pas renommer/supprimer/repartager une section qui ne lui appartient
    pas) : à la place, un sous-titre `.valeurs-section-partage-info`
    (12px, `--text-secondary`) indique « Partagé par
    &lt;email du propriétaire&gt; · Lecture seule » ou « · Lecture et
    écriture ». Si le rôle est « Lecture et écriture », un bouton
    `icon-plus` apparaît dans l'en-tête (ajouter une valeur dans cette
    section précise) et chaque ligne garde sa poignée de glisser-déposer
    (réordonnancement à l'intérieur de cette seule section, jamais vers
    une autre section) et son action `icon-trash` ; en lecture seule, ni
    poignée ni action de ligne, la valeur reste cliquable pour ouvrir son
    graphique. Aucune action de création d'alerte sur les valeurs de
    cette section (les alertes restent strictement privées, voir
    `BUSINESS_RULES.md`).
- **FAB** (bouton flottant) : 56px, cercle, `--primary` (or), icône
  `icon-plus` blanche, coin bas-droit, respecte les safe-area iOS (`env
  (safe-area-inset-*)`).
- **Bouton d'ajout proéminent** (`.btn-icon-gold`, ex. ajouter une
  valeur dans l'en-tête de section) : carré à coins arrondis (8px),
  fond `--primary`, icône blanche — distinct du bouton icône neutre
  circulaire (`.btn-icon`/`.btn-icon-small`) utilisé pour les actions
  secondaires (renommer, supprimer, alerte).
- **Recherche de valeur a l'ajout** (session 2026-07-26, demande
  explicite utilisateur : pouvoir saisir un nom approximatif, ex.
  "Schneider", plutot que de devoir connaitre le ticker exact,
  ex. `SU.PA`) : le champ Ticker de `#modalAddValeur` (`#inputTicker`)
  declenche desormais une recherche a la saisie (debounce 300ms, a partir
  de 2 caracteres) sur `GET /api/valeurs/recherche?q=...`
  (`server/valeurs.js` § `rechercherTickers`, meme endpoint non officiel
  Yahoo Finance que `fetchYahooFinance`, pas de deuxieme source de
  donnees). Les resultats (jusqu'a 8) s'affichent dans un menu deroulant
  ancre sous le champ (`#rechercheResultats`/`.recherche-resultats`,
  meme gabarit que `.dropdown-menu` du menu utilisateur : fond `--bg`,
  coins 8px, `--shadow-large`), chaque `.recherche-item` affichant le nom
  (`.recherche-item-nom`, 14px/500) puis ticker et bourse d'origine
  (`.recherche-item-detail`, 12px, `--text-secondary`, ex. « SU.PA ·
  Paris »). Cliquer/toucher un resultat remplit `#inputTicker` (ticker
  exact) et **redefinit toujours** `#inputNom` avec le nom complet de la
  valeur selectionnee (ecrase une eventuelle saisie manuelle prealable -
  correctif 2026-07-26, demande explicite utilisateur ; le premier
  comportement ne remplacait `#inputNom` que s'il etait vide) puis
  referme le menu ; la selection
  ecoute `pointerdown` plutot que `click` sur chaque item pour agir avant
  le `blur` du champ Ticker (qui referme sinon le menu avec un delai de
  150ms). Aucune correspondance ou saisie de moins de 2 caracteres masque
  le menu. Reste une aide a la saisie uniquement : le ticker choisi passe
  toujours par la meme validation Yahoo Finance qu'une saisie manuelle a
  la soumission du formulaire (voir `BUSINESS_RULES.md` § Valeurs
  suivies) ; les warrants identifies par ISIN (voir
  `SPECIFICATION_FONCTIONNELLE.md` § Source de donnees et limites
  connues) ne remonteront generalement aucun resultat, meme limite que
  la validation elle-meme.
- **Modales** : fond semi-transparent (`rgba(0,0,0,0.5)`), contenu centré,
  animation `slideUp` 0.2s, variante `.modal-large` (800px) pour le
  graphique, fermeture via icône `icon-x`. Deux modales génériques
  réutilisables complètent les modales de formulaire dédiées :
  `#modalPrompt` (titre + champ texte, boutons `Annuler`/`OK`, soumission
  au clavier avec `Entrée`) et `#modalConfirm` (titre + message, boutons
  `Annuler`/`Confirmer` — `Confirmer` en `.btn-danger` pour les actions
  destructives). Résolues comme des `Promise` (`showPrompt()`/
  `showConfirm()`), `Échap`/fond semi-transparent/icône `icon-x`
  résolvent en annulation.
- **Toasts** : centrés en bas, auto-masqués après 3s, 4 variantes
  (succès/danger-erreur/avertissement/info via `--success`/`--danger`/
  `--warning`/`--toast-neutral`).
- **Loaders** : loader plein écran (overlay translucide + spinner 40px,
  couleur d'overlay adaptée au thème actif) pour les actions bloquantes,
  `spinner-small` (24px) pour les chargements inline de section.
- **Menu utilisateur** : dropdown ancré sous le header, apparition en
  fondu + translation verticale.
- **Formulaires** : inputs pleine largeur, bordure `--border`, focus
  `--primary`, label 14px/500 au-dessus de chaque champ.
- **Sélecteur de période (graphique)** : boutons pilule (1J/1S/1M/1A/Max),
  état actif en `--primary` plein. Le graphique Chart.js lui-même
  (courbe, grille, ticks) adapte ses couleurs au thème actif (calculées
  dans `chargerGraphique()`, `public/app.js`, à partir de l'attribut
  `data-theme` courant).
- **Alerte depuis le graphique** (session 2026-07-25, demande explicite
  utilisateur, inspirée du geste de glisser-déposer de TradingView) :
  sur le graphique d'une valeur de ma propre liste "Valeurs suivies"
  (jamais un indice de marché ni une valeur d'une section partagée avec
  moi — même périmètre que le bouton cloche existant sur la ligne, voir
  `BUSINESS_RULES.md` § Alertes de seuil pour la raison technique), un
  bouton rond `icon-bell` (`.alerte-drag-trigger`, ancré en bas-gauche du
  graphique, `position: absolute` dans `#graphiqueWrapper`) ouvre un
  « mode placement » : une ligne pointillée or (`.alerte-drag-line`,
  même couleur `--primary` que la courbe du graphique) apparaît sur le
  cours actuel de la valeur, accompagnée d'une pastille sombre
  (`.alerte-drag-badge`, fond `--toast-neutral`, texte blanc) affichant
  le prix courant. Glisser n'importe où sur le graphique (souris ou
  tactile, `Pointer Events`, `touch-action: none` le temps du mode
  placement) déplace la ligne et met à jour la pastille en direct, en
  s'appuyant sur les API publiques de l'échelle Chart.js
  (`getValueForPixel`/`getPixelForValue`, pas de plugin d'annotation
  supplémentaire). Le bouton `icon-bell` est remplacé par un bouton
  `icon-x` (annuler, même emplacement bas-gauche) ; un bouton rond doré
  `icon-check` apparaît en bas-droite pour valider. Au tap sur la coche,
  l'alerte est créée immédiatement (`POST /api/alertes`, sans repasser
  par `#modalCreateAlerte`) avec `seuilHaut` si le seuil glissé est
  au-dessus du cours actuel de la valeur, `seuilBas` sinon — l'utilisateur
  reste sur le graphique (peut poser une seconde alerte dans la foulée).
  Annuler ferme le mode placement sans rien créer. Le formulaire complet
  (icône cloche sur la ligne de la valeur, `#modalCreateAlerte`) reste la
  voie à privilégier pour poser haut ET bas en une fois ; cette nouvelle
  voie ne le remplace pas, elle s'y ajoute pour le geste rapide "un seul
  seuil, directement sur le graphique".
- **Alertes existantes sur le graphique** (session 2026-07-25, demande
  explicite utilisateur) : à l'ouverture du graphique historique d'une
  valeur de ma propre liste "Valeurs suivies" (même restriction que le
  composant « Alerte depuis le graphique » ci-dessus — jamais sur un
  indice de marché ni sur une valeur d'une section partagée), chaque
  seuil actif (`seuilHaut`/`seuilBas`, toutes alertes actives confondues
  sur ce ticker) est matérialisé par une ligne pointillée fine
  (`.alerte-existante-ligne`, 1px, `--danger` — volontairement distincte
  du pointillé or `--primary` du mode placement d'une nouvelle alerte,
  pour ne pas confondre un seuil déjà posé avec celui en cours de
  glissement) et une pastille de prix (`.alerte-existante-badge`, fond
  `--bg`, bordure et texte `--danger`, ancrée à droite du graphique —
  côté opposé à la pastille dorée `.alerte-drag-badge` du mode placement,
  ancrée à gauche, pour qu'elles ne se chevauchent jamais si les deux
  sont visibles en même temps). Un seuil qui tombe hors de la plage
  `min`/`max` de l'échelle Y affichée pour la période courante (trop haut
  ou trop bas par rapport aux cours du graphique) n'est **pas** tracé en
  ligne : un simple repère compact (`.alerte-hors-limite`, même habillage
  visuel que la pastille) est affiché à la place, épinglé en haut
  (`▲ <prix>`) ou en bas (`▼ <prix>`) du graphique selon le sens du
  dépassement, plutôt que de fausser l'échelle du graphique pour faire
  entrer un seuil éloigné. Recalculé à chaque chargement du graphique
  (ouverture, changement de période) via `afficherAlertesGraphique()`
  (`public/app.js`), pas de plugin d'annotation Chart.js supplémentaire
  (mêmes API publiques d'échelle `getPixelForValue`/`min`/`max` que le
  composant « Alerte depuis le graphique »).

## Responsive

**Mobile-only, sans breakpoint (révision v1.6.1, 2026-07-25, demande
explicite utilisateur — voir `CLAUDE.md` § Présentation du projet).**
L'application n'étant destinée qu'à un usage smartphone, `public/
styles.css` ne comporte plus aucune règle `@media` de largeur : les
valeurs auparavant réservées à un correctif `max-width: 640px` (tuiles de
stats compactes, modales à 95% de largeur, hauteur du conteneur de
graphique à 300px, FAB rapproché des bords) sont désormais les valeurs
par défaut, sans variante « desktop » à maintenir en parallèle. Ceci
remplace l'ancien système à deux niveaux (style de base plus large,
surchargé par un point de rupture mobile) : ne pas réintroduire de
`@media` pour un affichage large écran sans nouvelle demande explicite de
l'utilisateur. Seul le `@supports (padding: max(0px))` des zones sûres
iOS (safe-area, voir § PWA) subsiste, car il ne dépend pas de la largeur
d'écran.

## PWA

- `manifest.json`/meta `theme-color` : `#1b2438` (bleu marine de l'en-
  tête, plus `#1a73e8`), mode `standalone`, orientation `portrait-
  primary`, icônes 192/512 `purpose: any maskable`.
- **Logo/icônes de l'application** (session 2026-07-26, remplace les
  icônes provisoires « PT » sur fond bleu générées automatiquement) :
  `public/icons/icon-192.png`/`icon-512.png` (icônes du manifeste,
  favicon des deux pages) et `public/icons/apple-touch-icon.png` (180x180,
  taille exacte recommandée par Apple pour éviter un redimensionnement
  flou — référencé par `<link rel="apple-touch-icon">` dans
  `public/index.html`/`public/login.html`, utilisé par iOS lors d'un
  « Ajouter à l'écran d'accueil » depuis Safari) dérivent tous du même
  logo fourni par l'utilisateur (fond bleu marine assorti à `--header-bg`,
  pictogramme or/blanc). Recadré sur le carré utile (l'export source avait
  une marge noire autour d'un rectangle à coins arrondis) puis les coins
  résiduels comblés avec la couleur de fond du logo, pour obtenir une
  image carrée pleine (sans transparence ni liseré noir) adaptée à un
  usage `purpose: any maskable`. Le même fichier `icon-192.png` est
  réutilisé comme logo d'en-tête (`.header-logo`, voir § Header
  ci-dessus) plutôt que de dupliquer un asset dédié.
- **Zoom désactivé** (v1.8.2, demande explicite utilisateur : la page se
  retrouvait parfois zoomée sans action volontaire de sa part, cachant
  une partie de l'écran). Deux causes distinctes corrigées ensemble :
  - Le meta viewport (`public/index.html`/`public/login.html`) n'avait ni
    `maximum-scale` ni `user-scalable`, laissant le pincement-zoom actif ;
    ajout de `maximum-scale=1.0, user-scalable=no`. `html { touch-action:
    manipulation }` (`public/styles.css`) complète en désactivant le
    double-tap-zoom au niveau moteur, indépendamment du meta viewport.
  - Cause la plus probable du zoom **intempestif** signalé (pas un geste
    volontaire) : `.input` (`public/styles.css`, tous les champs de
    formulaire de l'app — connexion, ajout de valeur, création d'alerte,
    modales prompt/partage) était en 14px. iOS Safari/WKWebView zoome
    automatiquement la page au focus de tout champ de formulaire dont la
    taille de police calculée est inférieure à 16px, indépendamment du
    meta viewport — comportement natif du moteur, pas un bug applicatif.
    `.input` passé à 16px (le minimum sous lequel ce zoom automatique se
    déclenche).

## Hors périmètre de cette révision

- **Badges de recommandation** (`ACHAT`/`ACHAT FORT`/`NEUTRE` visibles
  sur les captures de l'ancienne version) : non réintroduits, il n'existe
  aucune donnée de recommandation dans le modèle actuel (`valeurs` n'a
  pas de champ correspondant) et personne n'a demandé d'ajouter cette
  donnée. Ne pas fabriquer de valeur pour occuper ce badge visuellement.
- ~~**Portefeuilles partagés** (écran "Portefeuilles partagés" de
  l'ancienne version, gestion de membres par email avec rôle
  "Consulter") : correspond à la Session D déjà planifiée dans
  `BACKLOG.md` (partage RW d'une section entre utilisateurs), pas encore
  implémentée.~~ Implémenté en Session D (voir composant « Partage de
  section » ci-dessus) : la modale de partage n'est pas un écran dédié
  comme dans l'ancienne version, mais rattachée à chaque section
  (partage granulaire par section plutôt que par portefeuille entier),
  avec deux rôles (« Lecture seule »/« Lecture et écriture ») plutôt que
  le seul rôle "Consulter" de l'ancienne version.

## Langue

Interface exclusivement en français (labels, messages, placeholders).
