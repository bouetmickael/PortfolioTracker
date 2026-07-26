// Fragment SQL et mapping partages entre GET /api/valeurs (server/routes/
// valeurs.js) et GET /api/sections/:id/valeurs (server/routes/sections.js),
// qui exposent tous deux des lignes de la table valeurs enrichies du
// booleen hasAlerte.

const { fetchYahooFinance } = require('./jobs/prices');

const HAS_ALERTE_SUBQUERY = `EXISTS(
  SELECT 1 FROM alertes a
  WHERE a.valeur_id = v.id AND a.user_id = v.user_id AND a.active = 1
) AS has_alerte`;

function toValeurJson(row) {
  return {
    id: row.id,
    type: row.type,
    nom: row.nom,
    cours: row.cours,
    variation: row.variation,
    volume: row.volume,
    derniereMaj: row.derniere_maj,
    ajouteLe: row.ajoute_le,
    sectionId: row.section_id,
    ordre: row.ordre,
    hasAlerte: Boolean(row.has_alerte)
  };
}

function toValeursMap(rows) {
  const map = {};
  for (const row of rows) {
    map[row.ticker] = toValeurJson(row);
  }
  return map;
}

// Verifie qu'un ticker existe reellement sur Yahoo Finance avant de
// l'ajouter aux valeurs suivies (aucune valeur inventee, meme pattern que
// BUSINESS_RULES.md § Integrite des cours). Retourne le cours recupere
// (utilise pour peupler la valeur immediatement) ou null si le ticker est
// introuvable/invalide.
async function verifierTickerExiste(ticker) {
  try {
    const priceData = await fetchYahooFinance(ticker);
    return priceData.price > 0 ? priceData : null;
  } catch (error) {
    return null;
  }
}

module.exports = { HAS_ALERTE_SUBQUERY, toValeurJson, toValeursMap, verifierTickerExiste };
