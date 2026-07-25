// Calcul du prochain ordre disponible dans une table triee (sections,
// valeurs d'une section) : MAX(ordre) + 1, ou 0 si la table/le sous-
// ensemble est vide.
function nextOrdre(db, table, whereSql, params) {
  const { maxOrdre } = db.prepare(`SELECT MAX(ordre) as maxOrdre FROM ${table} WHERE ${whereSql}`).get(...params);
  return (maxOrdre === null ? -1 : maxOrdre) + 1;
}

module.exports = { nextOrdre };
