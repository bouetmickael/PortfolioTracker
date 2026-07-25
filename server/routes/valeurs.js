const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { normalizeTicker } = require('../ticker');
const { nextOrdre } = require('../ordre');
const { HAS_ALERTE_SUBQUERY, toValeursMap } = require('../valeurs');

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
  res.json(toValeursMap(rows));
});

router.post('/', (req, res) => {
  const ticker = normalizeTicker(req.body.ticker);
  const type = req.body.type === 'Warrant' ? 'Warrant' : 'Action';
  const nom = (req.body.nom || '').trim();

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker requis' });
  }

  const existing = db
    .prepare('SELECT id FROM valeurs WHERE user_id = ? AND ticker = ?')
    .get(req.session.userId, ticker);

  if (existing) {
    return res.status(409).json({ error: 'Cette valeur est deja suivie' });
  }

  const sectionId = sectionCible(req.session.userId, req.body.sectionId);
  const ordre = nextOrdre(db, 'valeurs', 'user_id = ? AND section_id = ?', [req.session.userId, sectionId]);

  db.prepare(
    `INSERT INTO valeurs (user_id, ticker, type, nom, cours, variation, volume, derniere_maj, ajoute_le, section_id, ordre)
     VALUES (?, ?, ?, ?, 0, 0, 0, NULL, ?, ?, ?)`
  ).run(req.session.userId, ticker, type, nom, Date.now(), sectionId, ordre);

  res.status(201).json({ success: true });
});

router.delete('/:ticker', (req, res) => {
  const ticker = normalizeTicker(req.params.ticker);

  db.prepare('DELETE FROM valeurs WHERE user_id = ? AND ticker = ?').run(req.session.userId, ticker);
  db.prepare('DELETE FROM alertes WHERE user_id = ? AND ticker = ?').run(req.session.userId, ticker);

  res.json({ success: true });
});

module.exports = router;
