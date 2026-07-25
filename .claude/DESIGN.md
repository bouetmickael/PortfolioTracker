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
(ajouter). Toutes
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
  (ligne de la liste des valeurs suivies) : 15px/500, aligné à droite avec
  `valeur-variation` (13px/500) empilé juste en dessous, coloré en
  `--success`/`--danger` selon le signe, sans fond de pastille (texte
  simple).
- Texte secondaire (labels, aide, footers de ligne) : 11-13px,
  `--text-secondary`.

## Composants

- **Header** : sticky en haut, fond `--header-bg` (bleu marine, fixe dans
  les deux thèmes), texte/icônes `--header-text`/`--header-text-
  secondary`, `--shadow`, titre + numéro de version côte à côte
  (`.header-titre`). Actions à droite (`.header-actions`, icônes SVG) :
  bascule thème (`icon-moon`/`icon-sun`), actualiser (`icon-refresh`),
  menu utilisateur (`icon-user`).
- **Cartes statistiques** (`.stats-container`/`.stat-card`, session
  2026-07-25 « suivi d'indices de marché ») : grille 3 colonnes égales,
  fond `--bg`, coins 8px, `--shadow`, **bordure supérieure colorée 3px**.
  Affichent désormais 3 indices de marché suivis (`SBF 120`,
  `Nasdaq-100`, `S&P 500`, voir `BUSINESS_RULES.md`/`ARCHITECTURE.md`
  pour la source des cours) plutôt que le comptage Total/Hausse/Baisse
  des valeurs suivies (ancien contenu, retiré cette session). Rendu par
  un `<template x-for>` sur `$store.portfolio.indices` (nouvel état du
  store Alpine, peuplé par `GET /api/indices`, rafraîchi par le même
  polling que les valeurs/alertes). Chaque tuile : nom de l'indice
  (`.stat-label`), cours avec sa devise d'origine EUR/USD
  (`.stat-value`, ex. « 5 432.10 EUR », voir composant ci-dessous),
  variation du jour en dessous (`.stat-variation`, 13px/500, coloré
  `--success`/`--danger` selon le signe, même convention que
  `.valeur-variation` sur la liste des valeurs). La bordure supérieure
  suit également le signe de la variation de chaque indice
  (`--success`/`--danger`/`--header-bg` si nul), plutôt que d'être fixée
  par colonne comme l'ancien contenu Total/Hausse/Baisse.
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
  réordonner les sections entre elles) et trois boutons icône à droite,
  dans cet ordre : `icon-share` (partager la section, voir composant
  « Partage de section » ci-dessous), `icon-pencil` (renommer) et
  `icon-trash` (supprimer, masqué s'il ne
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
  - avatar rond à gauche (initiales + couleur générée depuis le ticker) ;
  - au centre : nom de la valeur (`.valeur-nom`, 15px/500 ; ticker en
    repli si le nom est absent), puis ticker + **badge pilule** du type
    (`.badge-type`, ex. "ACTION"/"WARRANT", fond `--bg-secondary`,
    10px/600, majuscules), suivi si la valeur a au moins une alerte de
    seuil active d'un second badge pilule (`.badge-alerte`, icône
    `icon-bell` en `.icon-xs`, fond `--primary` (or), icône blanche —
    même gabarit que `.badge-type` mais coloré pour signaler l'état actif
    plutôt que le type de valeur), sur la ligne suivante
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
- **Carte alerte** : coins/ombre façon carte classique (grille séparée de
  la liste des valeurs), action de suppression à droite (`icon-trash`).
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

## Responsive

- Breakpoint unique `max-width: 640px` : réduction de la taille de police
  des stats, largeur des modales à 95%, hauteur du conteneur de graphique
  réduite (300px au lieu de 400px), FAB rapproché des bords. La liste des
  valeurs suivies est déjà compacte par défaut, pas de règle mobile
  dédiée.

## PWA

- `manifest.json`/meta `theme-color` : `#1b2438` (bleu marine de l'en-
  tête, plus `#1a73e8`), mode `standalone`, orientation `portrait-
  primary`, icônes 192/512 `purpose: any maskable`.
- **Icônes actuelles provisoires** : `public/icons/icon-192.png` et
  `icon-512.png` sont générées automatiquement (fond bleu, texte « PT »),
  pas des icônes définitives. Sans impact fonctionnel, purement
  cosmétique — à remplacer un jour par un vrai jeu d'icônes si souhaité
  (pas un item de bug).

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
