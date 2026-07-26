// Squelette reseau bas niveau partage par tous les appels a l'API non
// officielle Yahoo Finance (cours, historique, recherche par nom) : fetch,
// verification de response.ok, parsing JSON. La validation metier (forme du
// JSON attendue, extraction des champs, gestion du cas "aucun resultat")
// reste propre a chaque appelant. Voir CLAUDE.md § Historique des revues,
// Revue n°6 (correctif "duplication de la logique Yahoo Finance").
async function fetchYahooFinanceJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Yahoo Finance error: ${response.status}`);
  }

  return response.json();
}

module.exports = { fetchYahooFinanceJson };
