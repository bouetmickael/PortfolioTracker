# DESIGN.md — Palette, typographie, composants

> Fichier propriétaire de toute question d'UI. En cas d'écart avec un autre
> document, ce fichier fait foi sur le visuel. Source unique du style :
> `public/styles.css`. Voir `CLAUDE.md` pour le point d'entrée.

## Direction générale

Style inspiré de Material Design (Google), sobre, sans emoji ni icône
vectorielle : les boutons d'action utilisent des libellés lettre unique
(`R` actualiser, `U` menu utilisateur, `G` graphique, `A` créer alerte, `X`
supprimer/fermer, `+` ajouter) plutôt que des icônes SVG ou une police
d'icônes. Respecter cette convention pour tout nouveau bouton d'action
plutôt que d'introduire une police d'icônes ou des emojis.

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
  28px.
- Valeurs chiffrées mises en avant : `stat-value` 28px/500, `valeur-cours`
  24px/500.
- Texte secondaire (labels, aide, footers de carte) : 12-13px,
  `--text-secondary`.

## Composants

- **Header** : sticky en haut, fond `--bg`, `--shadow`.
- **Cartes statistiques** : grille 3 colonnes égales, fond `--bg`, coins
  8px, `--shadow`.
- **Carte valeur / carte alerte** : mêmes coins/ombre que les stats,
  actions alignées à droite (icônes lettre unique).
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

- Breakpoint unique `max-width: 640px` : réduction des tailles de police
  (stats, cours), largeur des modales à 95%, hauteur du conteneur de
  graphique réduite (300px au lieu de 400px), FAB rapproché des bords.

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
