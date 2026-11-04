// Fragments SQL de correlation alerte -> valeur, partages entre le job
// checkAlerts() (server/jobs/alerts.js) et GET /api/alertes (nom lisible
// affiche sur la carte d'alerte plutot que le ticker brut).

// Fragment de correlation (valeurs suivies) : un seul endroit a maintenir
// pour les usages de checkAlerts() (cours, nom, EXISTS) et du nom de l'API.
const VALEUR_CORRESPONDANTE = 'valeurs.user_id = alertes.user_id AND valeurs.ticker = alertes.ticker';

// Repli pour un ticker absent de "Valeurs suivies" mais detenu dans un
// portefeuille de l'utilisateur (alerte posee depuis le graphique d'une
// position, voir BUSINESS_RULES.md § Alertes de seuil). Jointure via
// portefeuilles.user_id : portefeuille_lignes n'a pas de user_id propre.
const LIGNE_CORRESPONDANTE =
  'portefeuille_lignes.portefeuille_id = portefeuilles.id AND portefeuilles.user_id = alertes.user_id AND portefeuille_lignes.ticker = alertes.ticker';
const LIGNE_PORTEFEUILLE = `FROM portefeuille_lignes JOIN portefeuilles ON ${LIGNE_CORRESPONDANTE}`;

// Nom de la valeur (valeurs suivies, sinon position de portefeuille) ;
// NULL/vide si aucun nom saisi : l'appelant se replie sur le ticker.
const NOM_VALEUR_SUBQUERY = `COALESCE(
           (SELECT valeurs.nom FROM valeurs WHERE ${VALEUR_CORRESPONDANTE} LIMIT 1),
           (SELECT portefeuille_lignes.nom ${LIGNE_PORTEFEUILLE} LIMIT 1)
         )`;

module.exports = { VALEUR_CORRESPONDANTE, LIGNE_PORTEFEUILLE, NOM_VALEUR_SUBQUERY };
