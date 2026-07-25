// Fragment SQL et mapping partages entre GET /api/valeurs (server/routes/
// valeurs.js) et GET /api/sections/:id/valeurs (server/routes/sections.js),
// qui exposent tous deux des lignes de la table valeurs enrichies du
// booleen hasAlerte.

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

module.exports = { HAS_ALERTE_SUBQUERY, toValeurJson, toValeursMap };
