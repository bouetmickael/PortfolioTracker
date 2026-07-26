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

// Recherche de tickers par nom/mot-cle (ex. "Schneider" -> SU.PA) pour aider
// a l'ajout d'une valeur sans connaitre son ticker exact, via le meme
// endpoint non officiel Yahoo Finance que fetchYahooFinance (pas de
// deuxieme source de donnees). Retourne [] en cas d'echec (recherche non
// bloquante, l'utilisateur peut toujours saisir un ticker directement).
async function rechercherTickers(query) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Yahoo Finance error: ${response.status}`);
    }

    const data = await response.json();
    const quotes = Array.isArray(data.quotes) ? data.quotes : [];

    return quotes
      .filter((quote) => quote.symbol)
      .map((quote) => ({
        ticker: quote.symbol,
        nom: quote.longname || quote.shortname || quote.symbol,
        bourse: quote.exchDisp || ''
      }));
  } catch (error) {
    return [];
  }
}

module.exports = { HAS_ALERTE_SUBQUERY, toValeurJson, toValeursMap, verifierTickerExiste, rechercherTickers };
