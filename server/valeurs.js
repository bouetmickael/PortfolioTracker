// Fragment SQL et mapping partages entre GET /api/valeurs (server/routes/
// valeurs.js) et GET /api/sections/:id/valeurs (server/routes/sections.js),
// qui exposent tous deux des lignes de la table valeurs enrichies du
// booleen hasAlerte.

const { fetchYahooFinance } = require('./jobs/prices');

// Jointure par ticker (pas valeur_id) : une alerte s'applique au ticker pour
// cet utilisateur, quelle que soit la section dans laquelle il est suivi
// (voir BUSINESS_RULES.md § Valeurs suivies - une meme valeur peut desormais
// etre suivie dans plusieurs sections). Si la valeur est dupliquee entre
// sections, le badge d'alerte est donc affiche sur toutes ses occurrences.
const HAS_ALERTE_SUBQUERY = `EXISTS(
  SELECT 1 FROM alertes a
  WHERE a.ticker = v.ticker AND a.user_id = v.user_id AND a.active = 1
) AS has_alerte`;

function toValeurJson(row) {
  return {
    id: row.id,
    ticker: row.ticker,
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

// Tableau plutot qu'une map indexee par ticker : le ticker n'identifie plus
// une valeur de facon unique pour un utilisateur (la meme valeur peut
// apparaitre dans plusieurs sections), seul l'id de la ligne l'est. Voir
// BUSINESS_RULES.md § Valeurs suivies.
function toValeursArray(rows) {
  return rows.map(toValeurJson);
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

// Detache une ligne valeurs de alertes.valeur_id (FK) puis la supprime.
// Necessaire avant tout DELETE FROM valeurs, sinon la suppression echoue
// (FOREIGN KEY constraint) - alertes.valeur_id n'est plus lu nulle part
// (les alertes sont rejointes par ticker, voir HAS_ALERTE_SUBQUERY), ce
// detachement ne change donc rien d'observable. Factorise les trois sites
// qui suppriment une ligne valeurs directement (server/routes/valeurs.js,
// server/routes/sections.js x2).
function supprimerValeurEtDetacherAlertes(db, valeurId) {
  db.prepare('UPDATE alertes SET valeur_id = NULL WHERE valeur_id = ?').run(valeurId);
  db.prepare('DELETE FROM valeurs WHERE id = ?').run(valeurId);
}

// Supprime les alertes actives d'un ticker si plus aucune section de
// l'utilisateur ne le suit (une alerte est liee au ticker, pas a une ligne
// valeurs precise - voir BUSINESS_RULES.md § Valeurs suivies).
function supprimerAlertesOrphelines(db, userId, ticker) {
  const autreOccurrence = db
    .prepare('SELECT id FROM valeurs WHERE user_id = ? AND ticker = ?')
    .get(userId, ticker);

  if (!autreOccurrence) {
    db.prepare('DELETE FROM alertes WHERE user_id = ? AND ticker = ?').run(userId, ticker);
  }
}

module.exports = {
  HAS_ALERTE_SUBQUERY,
  toValeurJson,
  toValeursArray,
  verifierTickerExiste,
  rechercherTickers,
  supprimerValeurEtDetacherAlertes,
  supprimerAlertesOrphelines
};
