# DESIGN.md — Palette, typographie, composants

> Fichier propriétaire de toute question d'UI. En cas d'écart avec un autre
> document, ce fichier fait foi sur le visuel. Source unique du style :
> `public/styles.css`. Voir `CLAUDE.md` pour le point d'entrée.

## Direction générale

Style inspiré de Material Design (Google), sobre, sans emoji ni icône
vectorielle : les boutons d'action utilisent des libellés lettre unique
(`R` actualiser, `U` menu utilisateur, `A` créer alerte, `X`
supprimer/fermer, `+` ajouter) plutôt que des icônes SVG ou une police
d'icônes. Respecter cette convention pour tout nouveau bouton d'action
plutôt que d'introduire une police d'icônes ou des emojis.

Exception ciblée (session du 2026-07-24, demande explicite utilisateur,
inspiration TradingView) : la liste des valeurs suivies n'utilise plus de
bouton lettre dédié pour ouvrir le graphique (l'ancien `G`) — cliquer
n'importe où sur la ligne l'ouvre directement. `A` et `X` restent des
boutons lettre unique classiques. Chaque valeur affiche aussi un avatar
rond (initiales du ticker, couleur générée depuis le ticker) : ce n'est
pas une icône vectorielle/police d'icônes, juste du texte sur fond
coloré, donc cohérent avec la convention ci-dessus.

## Palette (`:root` dans `public/styles.css`)

| Variable | Valeur | Usage |
|---|---|---|
| `--primary` | `#1a73e8` | Couleur d'accent principale (boutons primaires, FAB, liens, thème PWA) |
| `--primary-dark` | `#1557b0` | État hover des éléments `--primary` |
| `--success` | `#34a853` | Variations positives, toast succès |
| `--danger` | `#ea4335` | Variations négatives, toast erreur |
| `--warning` | `#fbbc04` | Toast avertissement |
| `--text` | `#202124` | Texte principal |
| `--text-secondary` | `#5f6368` | Texte secondaire, labels, aide |
| `--border` | `#dadce0` | Bordures inputs, séparateurs |
| `--bg` | `#ffffff` | Fond des cartes, modales, header |
| `--bg-secondary` | `#f8f9fa` | Fond de page, hover boutons secondaires |
| `--shadow` / `--shadow-large` | ombres Material à deux couches | Cartes / éléments flottants (FAB, dropdown) |

Page de connexion : fond dégradé `linear-gradient(135deg, #667eea 0%,
#764ba2 100%)`, distinct de la palette applicative (à réserver à cet écran).

## Typographie

- Police : `Roboto` puis fallback système (`-apple-system,
  BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`).
- Titres : `header h1` 20px/500, `section h2` 18px/500, `login-card h1`
  28px. Numéro de version (`#appVersion`, à côté du titre `header h1`) :
  11px, `--text-secondary`, poids normal.
- Valeurs chiffrées mises en avant : `stat-value` 28px/500. `valeur-cours`
  (ligne de la liste des valeurs suivies) : 15px/500, aligné à droite avec
  `valeur-variation` (13px/500) empilé juste en dessous, coloré en
  `--success`/`--danger` selon le signe, sans fond de pastille (texte
  simple).
- Texte secondaire (labels, aide, footers de ligne) : 11-13px,
  `--text-secondary`.

## Composants

- **Header** : sticky en haut, fond `--bg`, `--shadow`, titre + numéro de
  version cote a cote (`.header-titre`).
- **Cartes statistiques** : grille 3 colonnes égales, fond `--bg`, coins
  8px, `--shadow`.
- **Liste des valeurs suivies** (`.valeurs-liste`) : depuis la session
  Session B (sections + glisser-deposer, usage personnel uniquement, pas
  de partage entre utilisateurs a ce stade), la liste est decoupee en
  sections (`.valeurs-section`), chacune un conteneur separe avec coins
  8px/`--shadow` (plus une carte unique globale). Chaque section a un
  en-tete (`.valeurs-section-header`, fond `--bg-secondary`) avec son nom
  (`.valeurs-section-nom`, 13px/500, majuscules, `--text-secondary` ;
  poignee de glisser-deposer pour reordonner les sections entre elles) et
  deux boutons lettre unique a droite : `M` (modifier/renommer, invite
  navigateur `prompt()`) et `X` (supprimer, `confirm()` de confirmation,
  masque si une seule section reste — la derniere section d'un
  utilisateur ne peut pas etre supprimee). Une section se cree via le
  bouton texte `+ Nouvelle section` en bas de liste (memes `prompt()`
  navigateur que le renommage, coherent avec `confirm()` deja utilise
  pour la suppression d'une valeur/alerte, pas une nouvelle modale).
  A l'interieur de chaque section, chaque valeur reste une ligne plate
  (`.valeur-row`) separee par une bordure fine (`--border`), fond
  `--bg-secondary` au survol, toute la ligne cliquable pour ouvrir le
  graphique et egalement glissable (SortableJS, `public/vendor/
  sortable.min.js`, vendorise localement comme Alpine) vers une autre
  position dans la meme section ou vers une autre section. Contenu de la
  ligne : avatar rond a gauche (initiales + couleur par ticker), puis au
  centre le nom de la valeur en premiere ligne (`.valeur-nom`, 15px/500 ;
  ticker en repli si le nom est absent) et `ticker · type` en seconde
  ligne (`.valeur-sousligne`, 12px/`--text-secondary`), cours et
  variation empiles a droite, actions `A`/`X` tout a droite (avec
  `stopPropagation` pour ne pas declencher l'ouverture du graphique).
- **Carte alerte** : coins/ombre façon carte classique (grille séparée de
  la liste des valeurs), actions alignées à droite (icônes lettre
  unique).
- **FAB** (bouton flottant) : 56px, cercle, `--primary`, coin bas-droit,
  respecte les safe-area iOS (`env(safe-area-inset-*)`).
- **Modales** : fond semi-transparent (`rgba(0,0,0,0.5)`), contenu centré,
  animation `slideUp` 0.2s, variante `.modal-large` (800px) pour le
  graphique.
- **Toasts** : centrés en bas, auto-masqués après 3s, 4 variantes
  (succès/danger-erreur/avertissement/info via `--success`/`--danger`/
  `--warning`/`--text`).
- **Loaders** : loader plein écran (overlay blanc translucide + spinner
  40px) pour les actions bloquantes, `spinner-small` (24px) pour les
  chargements inline de section.
- **Menu utilisateur** : dropdown ancré sous le header, apparition en
  fondu + translation verticale.
- **Formulaires** : inputs pleine largeur, bordure `--border`, focus
  `--primary`, label 14px/500 au-dessus de chaque champ.
- **Sélecteur de période (graphique)** : boutons pilule (1J/1S/1M/1A/Max),
  état actif en `--primary` plein.

## Responsive

- Breakpoint unique `max-width: 640px` : réduction de la taille de police
  des stats, largeur des modales à 95%, hauteur du conteneur de graphique
  réduite (300px au lieu de 400px), FAB rapproché des bords. La liste des
  valeurs suivies est déjà compacte par défaut, pas de règle mobile
  dédiée.

## PWA

- `manifest.json` : mode `standalone`, orientation `portrait-primary`,
  couleur de thème `#1a73e8` (identique à `--primary`), icônes 192/512
  `purpose: any maskable`.
- **Icônes actuelles provisoires** : `public/icons/icon-192.png` et
  `icon-512.png` sont générées automatiquement (fond bleu, texte « PT »),
  pas des icônes définitives. Sans impact fonctionnel, purement
  cosmétique — à remplacer un jour par un vrai jeu d'icônes si souhaité
  (pas un item de bug).

## Langue

Interface exclusivement en français (labels, messages, placeholders).
