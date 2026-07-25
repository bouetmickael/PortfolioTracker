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
(renommer une section), `icon-chevron-down` (replier/déplier une
section), `icon-x` (fermer une modale), `icon-plus` (ajouter). Toutes
en `stroke="currentColor"` (la couleur suit `color` du bouton parent),
`stroke-width="2"`, viewBox `0 0 24 24`, style trait rond (`stroke-
linecap`/`stroke-linejoin: round`), taille `20x20` (`.icon`) ou `16x16`
(`.icon-sm`, utilisé dans les actions denses de ligne).

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
- Valeurs chiffrées mises en avant : `stat-value` 28px/500. `valeur-cours`
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
- **Cartes statistiques** : grille 3 colonnes égales, fond `--bg`, coins
  8px, `--shadow`, **bordure supérieure colorée 3px** : `--header-bg`
  (Total, neutre), `--success` (Hausse), `--danger` (Baisse).
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
  réordonner les sections entre elles) et deux boutons icône à droite :
  `icon-pencil` (renommer, invite `prompt()` navigateur) et `icon-trash`
  (supprimer, `confirm()` de confirmation, masqué s'il ne reste qu'une
  section — la dernière section d'un utilisateur ne peut pas être
  supprimée). Une section se crée via le bouton texte `+ Nouvelle
  section` en bas de liste (même `prompt()` navigateur que le
  renommage, pas de nouvelle modale).
  À l'intérieur de chaque section, chaque valeur reste une ligne plate
  (`.valeur-row`) séparée par une bordure fine (`--border`), fond
  `--bg-secondary` au survol, toute la ligne cliquable pour ouvrir le
  graphique et également glissable (SortableJS, `public/vendor/
  sortable.min.js`) vers une autre position dans la même section ou vers
  une autre section. Contenu de la ligne :
  - avatar rond à gauche (initiales + couleur générée depuis le ticker) ;
  - au centre : nom de la valeur (`.valeur-nom`, 15px/500 ; ticker en
    repli si le nom est absent), puis ticker + **badge pilule** du type
    (`.badge-type`, ex. "ACTION"/"WARRANT", fond `--bg-secondary`,
    10px/600, majuscules) sur la ligne suivante (`.valeur-sousligne`),
    puis le footer sur **deux lignes distinctes** — `MAJ: hh:mm` et
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
  graphique, fermeture via icône `icon-x`.
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
- **Portefeuilles partagés** (écran "Portefeuilles partagés" de l'ancienne
  version, gestion de membres par email avec rôle "Consulter") :
  correspond à la Session D déjà planifiée dans `BACKLOG.md` (partage RW
  d'une section entre utilisateurs), pas encore implémentée — l'ordre du
  backlog a été conservé (Session C avant Session D) à la demande de
  l'utilisateur (session du 2026-07-25).

## Langue

Interface exclusivement en français (labels, messages, placeholders).
