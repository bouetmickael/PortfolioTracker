const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { normalizeTicker } = require('../ticker');

const router = express.Router();

router.use(requireAuth);

function toValeursMap(rows) {
  const map = {};
  for (const row of rows) {
    map[row.ticker] = {
      type: row.type,
      nom: row.nom,
      cours: row.cours,
      variation: row.variation,
      volume: row.volume,
      derniereMaj: row.derniere_maj,
      ajouteLe: row.ajoute_le
    };
  }
  return map;
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM valeurs WHERE user_id = ?').all(req.session.userId);
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

  db.prepare(
    `INSERT INTO valeurs (user_id, ticker, type, nom, cours, variation, volume, derniere_maj, ajoute_le)
     VALUES (?, ?, ?, ?, 0, 0, 0, NULL, ?)`
  ).run(req.session.userId, ticker, type, nom, Date.now());

  res.status(201).json({ success: true });
});

router.delete('/:ticker', (req, res) => {
  const ticker = normalizeTicker(req.params.ticker);

  db.prepare('DELETE FROM valeurs WHERE user_id = ? AND ticker = ?').run(req.session.userId, ticker);
  db.prepare('DELETE FROM alertes WHERE user_id = ? AND ticker = ?').run(req.session.userId, ticker);

  res.json({ success: true });
});

module.exports = router;
