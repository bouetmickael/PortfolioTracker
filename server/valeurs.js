// Fragment SQL et mapping partages entre GET /api/valeurs (server/routes/
// valeurs.js) et GET /api/sections/:id/valeurs (server/routes/sections.js),
// qui exposent tous deux des lignes de la table valeurs enrichies du
// booleen hasAlerte.

const { fetchYahooFinance } = require('./jobs/prices');
const { fetchYahooFinanceJson } = require('./yahooFinance');
const { nextOrdre } = require('./ordre');

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
    const data = await fetchYahooFinanceJson(url);
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

// Supprime une ligne valeurs. Factorise les trois sites qui suppriment une
// ligne valeurs directement (server/routes/valeurs.js, server/routes/
// sections.js x2). alertes n'a plus de colonne valeur_id referencant
// valeurs.id (colonne FK vestigiale retiree par migration, voir
// server/db.js et CLAUDE.md Historique des revues, Revue n°6) : plus
// besoin de detacher quoi que ce soit avant la suppression.
function supprimerValeur(db, valeurId) {
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

// Insertion d'une ligne valeurs suivie de son cours initial : factorise
// l'INSERT a 11 colonnes et le calcul de l'ordre. Utilise par l'unique
// route d'ajout POST /api/valeurs (server/routes/valeurs.js), qui
// determine elle-meme la section/le proprietaire cible (possedee ou
// partagee en ecriture, voir § sectionCibleEcriture) avant d'appeler ce
// helper une fois son propre controle d'acces/deduplication passe (voir
// CLAUDE.md Historique des revues, Revue n°6).
function creerValeur(db, { proprietaireId, sectionId, ticker, type, nom, priceData }) {
  const ordre = nextOrdre(db, 'valeurs', 'user_id = ? AND section_id = ?', [proprietaireId, sectionId]);

  db.prepare(
    `INSERT INTO valeurs (user_id, ticker, type, nom, cours, variation, volume, derniere_maj, ajoute_le, section_id, ordre)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    proprietaireId,
    ticker,
    type,
    nom,
    priceData.price,
    priceData.changePct,
    priceData.volume,
    Date.now(),
    Date.now(),
    sectionId,
    ordre
  );
}

module.exports = {
  HAS_ALERTE_SUBQUERY,
  toValeurJson,
  toValeursArray,
  verifierTickerExiste,
  rechercherTickers,
  supprimerValeur,
  supprimerAlertesOrphelines,
  creerValeur
};
