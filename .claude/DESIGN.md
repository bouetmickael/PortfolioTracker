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
`icon-grip` (poignée de glisser-déposer, réutilisée à l'identique pour une
valeur et pour une section — voir composant « Liste des valeurs suivies »
ci-dessous) est en `fill="currentColor"` (6 points pleins) plutôt qu'en
trait, plus lisible à petite taille pour ce usage précis.

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
  `.valeur-variation` sur la liste des valeurs), suivie le cas échéant
  d'une ligne `.stat-avant-bourse` (voir § Avant-bourse ci-dessous). La
  bordure supérieure
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
  poignée de glisser-déposer dédiée (`.valeurs-section-drag-handle`, icône
  `icon-grip`, `touch-action: none` — même composant que la poignée d'une
  valeur, ajoutée en session de dette technique pour ne plus faire porter
  le glisser-déposer par le titre cliquable lui-même, qui sert aussi à
  replier/déplier une section : même conflit avec le scroll tactile mobile
  que celui déjà corrigé pour les valeurs en v1.3.1, laissé ouvert pour les
  sections jusqu'ici), puis titre repliable (chevron + nom, cliquable pour
  replier/déplier uniquement) et quatre boutons icône à droite,
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
  - cours et variation empilés à droite, complétés d'une troisième ligne
    `.valeur-avant-bourse` (voir § Avant-bourse ci-dessous) lorsque le
    marché de la valeur est en pré-ouverture au moment de la dernière
    mise à jour des cours ;
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
  **Dernier déclenchement affiché** (session 2026-07-27, retour
  utilisateur explicite : deux seuils franchis un matin sans aucune
  notification visible, SMTP non configuré sur le déploiement — voir
  `BUSINESS_RULES.md` § Alertes de seuil, l'email est optionnel et non
  bloquant). Troisième ligne `.alerte-derniere` (même gabarit que
  `.alerte-seuils` : 10px, `--text-secondary`, `line-height: 1.25`)
  affichant « Déclenchée à hh:mm » (`derniereAlerte`, déjà renvoyée par
  `GET /api/alertes` mais jamais affichée jusqu'ici) ou « Jamais
  déclenchée » sinon (`texteDerniereAlerte()`, `public/app.js`) — seul
  moyen de vérifier dans l'app qu'un seuil a bien été franchi
  indépendamment de l'envoi d'email (`derniereAlerte` est écrite par
  `checkAlerts()` dès qu'un seuil est franchi, que l'email réussisse,
  échoue ou soit désactivé faute de SMTP configuré).
  **Pastilles de notification** (session 2026-07-27, demande explicite
  utilisateur : le texte seul « Déclenchée à hh:mm » restait trop
  discret pour remarquer un déclenchement sans lire chaque carte une par
  une). Trois emplacements partagent le même point rouge
  `.badge-notif-dot` (`--danger`, 7px, cercle plein) :
  - superposé en haut à droite du badge cloche `.badge-alerte` existant
    sur chaque ligne de la liste des valeurs suivies (variante
    `.badge-notif-dot-overlay`, `position: absolute`, bordure `--bg` pour
    le détacher visuellement du fond doré — même principe qu'un badge de
    notification sur une icône d'application), affiché si au moins une
    alerte active de ce ticker a `derniereAlerte` renseignée
    (`$store.portfolio.aUneAlerteDeclenchee(ticker)`) — le seul
    emplacement visible sans avoir à faire défiler jusqu'à la section
    « Alertes actives » ;
  - devant le ticker de chaque carte d'alerte déclenchée
    (`createAlerteCard()`, `public/app.js`), pour repérer en un coup
    d'œil les cartes concernées dans une liste de plusieurs alertes sans
    lire le texte de chacune ;
  - `.badge-notif-count` (variante avec un nombre : fond `--danger`,
    texte blanc 11px/600, pilule `border-radius: 9px`) sur l'en-tête de
    la section « Alertes actives » elle-même, comptant le nombre total
    d'alertes actives déclenchées (`$store.portfolio.alertesDeclenchees()`)
    — visible même section repliée, contrairement aux deux points
    précédents.
  Un déclenchement reste signalé tant que l'anti-répétition ne l'a pas
  effacé (`derniereAlerte` n'est jamais remis à `null`, voir
  `server/jobs/alerts.js`), donc jusqu'à suppression/ajustement de
  l'alerte par l'utilisateur — pas une notification « lue/non lue » avec
  un état séparé à maintenir, un signal « ce seuil a été franchi ».
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
  secondaires (renommer, supprimer, alerte). Variante compacte
  `.btn-icon-xs` (padding `4px`, à ne pas confondre avec `.icon-xs` — la
  taille 10x10 de l'icône SVG elle-même, voir § Direction générale)
  appliquée directement aux boutons `icon-bell`/`icon-trash` de
  `.valeur-actions` et au bouton `icon-trash` de `.alerte-card` : remplace
  deux overrides CSS contextuels identiques par une seule classe
  réutilisable, sans changement de gabarit visuel.
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
  referme le menu. La liste elle-meme reste scrollable au-dela de
  `max-height: 240px` (`overflow-y: auto`) lorsque les 8 resultats ne
  tiennent pas dans l'espace visible restant sous le clavier virtuel -
  **correctif v1.9.8** (retour utilisateur explicite : impossible de
  faire defiler la liste sur mobile pour atteindre un resultat plus bas,
  ex. « Renault SA · Paris » apres plusieurs doublons d'autres bourses).
  La selection ecoute desormais `click` (pas `pointerdown`) sur chaque
  item : un `click` natif ne se declenche pas apres un geste de glisser
  (l'ancien mecanisme appelait `preventDefault()` sur `pointerdown` pour
  agir avant le `blur` du champ Ticker, mais `preventDefault()` sur
  `pointerdown` supprime aussi le scroll tactile natif du conteneur -
  chaque item couvrant presque toute la hauteur de la liste, plus aucun
  scroll n'etait possible). La fermeture du menu ne repose plus sur
  `blur` + un delai de 150ms (course avec le `click` sur un resultat,
  potentiellement perdue) mais sur un clic/tap en dehors du champ et de
  la liste (`setupEventListeners()`, meme principe que le menu
  utilisateur). Aucune correspondance ou saisie de moins de 2 caracteres
  masque le menu. Reste une aide a la saisie uniquement : le ticker choisi passe
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
  `data-theme` courant). **Période par défaut à l'ouverture** (session
  2026-07-28, demande explicite utilisateur : le graphique s'ouvrait
  toujours sur 1 mois, quelle que soit la période choisie la fois
  précédente) : `openGraphique()` réutilise `dernierePeriodeGraphique`
  (`public/app.js`, variable module mise à jour à chaque clic sur un
  bouton de période, toutes valeurs et indices confondus) plutôt que la
  valeur fixe `'1M'`. **Persistée dans `localStorage`** (clé
  `graphique_periode`, correctif same-day, demande explicite
  utilisateur : la première version, en mémoire uniquement, ne
  survivait pas à un rafraîchissement de la page ni à une fermeture/
  réouverture de la PWA) — même mécanisme que la persistance du thème
  clair/sombre (voir § Thème clair/sombre), avec une whitelist des 5
  valeurs valides (`1D`/`1W`/`1M`/`1Y`/`MAX`) à la lecture pour ignorer
  sans erreur une valeur corrompue ou manuellement modifiée dans
  `localStorage`. Contrairement à l'état replié/déplié des sections
  (§ Sections repliables), qui reste volontairement en mémoire
  uniquement.
- **Alerte depuis le graphique** (session 2026-07-25, demande explicite
  utilisateur, inspirée du geste de glisser-déposer de TradingView) :
  sur le graphique d'une valeur de ma propre liste "Valeurs suivies"
  (jamais un indice de marché ni une valeur d'une section partagée avec
  moi — même périmètre que le bouton cloche existant sur la ligne, voir
  `BUSINESS_RULES.md` § Alertes de seuil pour la raison technique), un
  bouton rond `icon-bell` (`.alerte-drag-trigger`, ancré en bas-gauche du
  graphique, `position: absolute` dans `#graphiquePriceZone` — conteneur
  dédié au seul graphique de cours, distinct de `#graphiqueWrapper` qui
  englobe aussi le graphique de volume en dessous, voir § Volume échangé
  sur le graphique ci-dessous) ouvre un
  « mode placement » : une ligne pointillée or (`.alerte-drag-line`,
  même couleur `--primary` que la courbe du graphique) apparaît sur le
  cours actuel de la valeur, accompagnée d'une pastille sombre
  (`.alerte-drag-badge`, fond `--toast-neutral`, texte blanc) affichant
  le prix courant. Glisser n'importe où sur le graphique (souris ou
  tactile, `Pointer Events`) déplace la ligne et met à jour la pastille
  en direct, en
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
- **Avant-bourse** (session 2026-07-28, demande explicite utilisateur :
  pouvoir consulter le cours avant-bourse d'une valeur suivie ou d'un
  indice de marché). Concerne toute valeur suivie ("Valeurs suivies" et
  "Partagé avec moi") et les tuiles d'indices — pas de restriction de
  périmètre contrairement aux composants « Alerte depuis le graphique »/
  « Alertes existantes » (le cours avant-bourse n'a aucun lien avec les
  alertes). Une troisième ligne discrète apparaît sous le cours/la
  variation habituels (`.valeur-avant-bourse` dans `.valeur-chiffres`,
  `.stat-avant-bourse` dans `.stat-card`, respectivement 9px et 8px,
  `line-height: 1.2`/`1.25`, coloré `--success`/`--danger` selon le signe
  de la variation avant-bourse — même convention que
  `.valeur-variation`/`.stat-variation`), texte "Avant-bourse &lt;cours&gt;
  (&lt;variation&gt;)". N'apparaît (`x-show`) que lorsque le marché du
  ticker concerné est **effectivement** en pré-ouverture au moment de la
  dernière mise à jour des cours (`meta.marketState === 'PRE'` sur
  l'endpoint Yahoo Finance déjà utilisé par `fetchYahooFinance()`,
  `server/jobs/prices.js`) : Yahoo Finance peut laisser `preMarketPrice`
  renseigné dans sa réponse même une fois le marché ouvert (dernière
  valeur avant-bourse connue, désormais périmée) - s'y fier sans
  vérifier `marketState` afficherait une donnée obsolète comme si elle
  était actuelle (voir `BUSINESS_RULES.md` § Intégrité des cours). Ne
  s'affiche donc jamais pour un marché sans session avant-bourse au sens
  de Yahoo Finance (ex. Euronext Paris, la plupart des valeurs du
  portefeuille), ni en dehors des horaires de pré-ouverture des marchés
  qui en ont une (ex. Nasdaq-100/S&P 500, tuiles d'indices). Recalculé au
  même rythme que le cours normal (tâche planifiée toutes les 2 minutes,
  `server/index.js`), pas de mécanisme de rafraîchissement dédié.
- **Clôture de la veille sur le graphique** (session 2026-07-28, demande
  explicite utilisateur) : ligne pointillée fine grise (couleur des
  ticks/texte du graphique, `--text-secondary` selon le thème actif) sur
  le cours de clôture de la dernière séance précédente
  (`previousClose`, exposé par `GET /api/chart/:ticker` — même champ meta
  Yahoo Finance que `fetchYahooFinance()`, `server/jobs/prices.js`),
  quelle que soit la période sélectionnée — sans restriction contrairement
  aux composants « Alerte depuis le graphique »/« Alertes existantes »
  (le champ n'a pas de lien avec les alertes ni de restriction de
  propriété : présent pour une valeur suivie, une valeur d'une section
  partagée, ou un indice de marché). Contrairement aux composants
  « Alertes existantes »/« Alerte depuis le graphique » (overlay DOM
  positionné manuellement en pixels via `getPixelForValue`), implémentée
  comme un second **dataset Chart.js natif** (`chargerGraphique()`,
  `public/app.js`) — une valeur constante sur toute la période n'a besoin
  d'aucune logique de hors-limite : Chart.js élargit déjà lui-même
  l'échelle Y pour l'inclure, contrairement à un seuil d'alerte qui peut
  tomber loin de la plage affichée. Absente si Yahoo Finance ne fournit
  aucune clôture précédente (`previousClose` `null`, ex. valeur récemment
  cotée) — pas de valeur inventée, voir `BUSINESS_RULES.md` § Intégrité
  des cours. Identifiée dans l'infobulle au survol par le libellé
  « Cloture veille: X.XX EUR », pour la distinguer du prix courant.
- **Volume échangé sur le graphique** (session 2026-07-27, demande
  explicite utilisateur) : sous le graphique de cours (`#graphiqueContainer`,
  300px), un second graphique Chart.js compact en barres
  (`#graphiqueVolumeContainer`/`#volumeCanvas`, 70px, `margin-top: 4px`,
  même largeur que le graphique de cours) affiche le volume échangé de
  chaque point de la période courante — présent pour toute ouverture du
  graphique (valeur suivie, valeur d'une section partagée, indice de
  marché), sans restriction contrairement aux composants « Alerte depuis
  le graphique »/« Alertes existantes » ci-dessus (le volume n'a pas de
  lien avec les alertes). Barres colorées `--success`/`--danger` selon que
  le cours du point est en hausse ou en baisse par rapport au point
  précédent (même convention que `.valeur-variation`/`.stat-variation`),
  premier point sans référence en gris neutre ; axe Y à libellés compacts
  (`formatVolume()`, ex. « 4.0K »/« 1.2M », déjà utilisé par le footer de
  la liste des valeurs suivies). Recalculé à chaque chargement du
  graphique (ouverture, changement de période) via
  `chargerGraphiqueVolume()` (`public/app.js`), instance Chart.js séparée
  du graphique de cours (pas un axe secondaire du même graphique) pour
  rester indépendante de son échelle de prix ; les deux graphiques
  partagent la largeur de leur axe Y (`afterFit: alignerLargeurAxeY`,
  variable `largeurAxeYGraphique` réinitialisée à chaque chargement) pour
  que les barres de volume restent alignées sous la courbe de cours
  malgré des libellés d'axe de largeurs naturellement différentes (prix
  en EUR vs volumes compacts). **Largeur calculée dynamiquement, jamais
  figée en dur** (correctif v1.9.5, retour utilisateur explicite : une
  largeur fixe à 50px tronquait les premiers chiffres d'un cours à 3
  chiffres, hors du canvas) — chaque axe impose sa propre largeur
  naturelle (calculée par Chart.js à partir de ses propres libellés)
  comme largeur minimale commune, réconciliée par une deuxième passe de
  layout (`chartInstance.update('none')`/`volumeChartInstance.update('none')`)
  une fois les deux graphiques construits, le plus large des deux
  imposant sa largeur à l'autre.
- **Sélection de texte désactivée sur le graphique** (session 2026-07-28,
  retour utilisateur explicite : sur iPhone, un appui prolongé sur la
  courbe — pour lire l'infobulle à un point donné ou pour glisser la
  ligne du mode placement d'une alerte — déclenchait le mode sélection de
  texte natif de Safari, surlignant tout le graphique et proposant un
  menu Copier, rendant le geste de positionnement inutilisable).
  `#graphiqueContainer`/`#graphiqueVolumeContainer` (`public/styles.css`)
  portent désormais `touch-action: none` en permanence (pas seulement
  pendant le mode placement d'alerte comme auparavant, voir composant
  « Alerte depuis le graphique » ci-dessus) ainsi que
  `-webkit-touch-callout: none`/`-webkit-user-select: none`/
  `user-select: none` — `touch-action: none` seul empêche le scroll/zoom
  natif mais pas le menu de sélection, géré séparément par ces trois
  dernières propriétés. Sans effet sur les boutons du mode placement
  (`.alerte-drag-*`), qui restent des frères de `#graphiqueContainer`
  dans `#graphiquePriceZone`, pas des descendants.

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
