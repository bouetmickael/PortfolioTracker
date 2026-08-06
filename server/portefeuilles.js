// Logique partagee des portefeuilles (reconstitution du portefeuille reel de
// l'utilisateur : quantite detenue + prix de revient par valeur, distinct de
// la liste "Valeurs suivies" qui ne suit qu'un cours sans quantite/cout).
// Meme decoupage que server/valeurs.js (mapping ligne SQL -> JSON, insertion
// factorisee, verification du ticker sur Yahoo Finance).

const { nextOrdre } = require('./ordre');

function toPositionJson(row) {
  return {
    id: row.id,
    portefeuilleId: row.portefeuille_id,
    ticker: row.ticker,
    type: row.type,
    nom: row.nom,
    quantite: row.quantite,
    prixRevient: row.prix_revient,
    cours: row.cours,
    variation: row.variation,
    derniereMaj: row.derniere_maj,
    ordre: row.ordre
  };
}

function toPositionsArray(rows) {
  return rows.map(toPositionJson);
}

// Insertion d'une ligne de portefeuille suivie de son cours initial, meme
// principe que creerValeur() (server/valeurs.js) : le cours est deja connu
// (verifierTickerExiste vient d'etre appele par l'appelant) plutot que
// laisse a 0 en attendant le prochain cycle du job de mise a jour des cours.
function creerPosition(db, { portefeuilleId, ticker, type, nom, quantite, prixRevient, priceData }) {
  const ordre = nextOrdre(db, 'portefeuille_lignes', 'portefeuille_id = ?', [portefeuilleId]);

  const info = db
    .prepare(
      `INSERT INTO portefeuille_lignes (portefeuille_id, ticker, type, nom, quantite, prix_revient, cours, variation, derniere_maj, ajoute_le, ordre)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      portefeuilleId,
      ticker,
      type,
      nom,
      quantite,
      prixRevient,
      priceData.price,
      priceData.changePct,
      Date.now(),
      Date.now(),
      ordre
    );

  return info.lastInsertRowid;
}

module.exports = {
  toPositionJson,
  toPositionsArray,
  creerPosition
};
