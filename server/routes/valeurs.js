const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { normalizeTicker } = require('../ticker');
const {
  HAS_ALERTE_SUBQUERY,
  toValeursArray,
  verifierTickerExiste,
  rechercherTickers,
  supprimerValeurEtDetacherAlertes,
  supprimerAlertesOrphelines,
  creerValeur
} = require('../valeurs');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

router.use(requireAuth);

function sectionCible(userId, sectionId) {
  if (sectionId) {
    const section = db.prepare('SELECT id FROM sections WHERE id = ? AND user_id = ?').get(sectionId, userId);
    if (section) return section.id;
  }

  const defaut = db.prepare('SELECT id FROM sections WHERE user_id = ? ORDER BY ordre ASC LIMIT 1').get(userId);
  return defaut ? defaut.id : null;
}

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT v.*, ${HAS_ALERTE_SUBQUERY}
       FROM valeurs v
       WHERE v.user_id = ?`
    )
    .all(req.session.userId);
  res.json(toValeursArray(rows));
});

router.get(
  '/recherche',
  asyncHandler(async (req, res) => {
    const query = (req.query.q || '').trim();

    if (query.length < 2) {
      return res.json([]);
    }

    const resultats = await rechercherTickers(query);
    res.json(resultats);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const ticker = normalizeTicker(req.body.ticker);
    const type = req.body.type === 'Warrant' ? 'Warrant' : 'Action';
    const nom = (req.body.nom || '').trim();

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker requis' });
    }

    const sectionId = sectionCible(req.session.userId, req.body.sectionId);

    // Une meme valeur peut desormais etre suivie dans plusieurs sections : le
    // doublon n'est interdit qu'a l'interieur d'une meme section (voir
    // BUSINESS_RULES.md § Valeurs suivies).
    const existing = db
      .prepare('SELECT id FROM valeurs WHERE user_id = ? AND ticker = ? AND section_id = ?')
      .get(req.session.userId, ticker, sectionId);

    if (existing) {
      return res.status(409).json({ error: 'Cette valeur est deja suivie dans cette section' });
    }

    const priceData = await verifierTickerExiste(ticker);
    if (!priceData) {
      return res.status(400).json({ error: 'Valeur introuvable sur Yahoo Finance' });
    }

    creerValeur(db, { proprietaireId: req.session.userId, sectionId, ticker, type, nom, priceData });

    res.status(201).json({ success: true });
  })
);

// Suppression par id de ligne (pas par ticker) : un ticker peut desormais
// correspondre a plusieurs lignes (une par section), supprimer par ticker
// seul supprimerait a tort toutes les occurrences d'un coup. Voir
// BUSINESS_RULES.md § Valeurs suivies.
router.delete('/:id', (req, res) => {
  const valeur = db
    .prepare('SELECT ticker FROM valeurs WHERE user_id = ? AND id = ?')
    .get(req.session.userId, req.params.id);

  if (!valeur) {
    return res.json({ success: true });
  }

  const supprimerValeur = db.transaction(() => {
    supprimerValeurEtDetacherAlertes(db, req.params.id);
    supprimerAlertesOrphelines(db, req.session.userId, valeur.ticker);
  });
  supprimerValeur();

  res.json({ success: true });
});

module.exports = router;
