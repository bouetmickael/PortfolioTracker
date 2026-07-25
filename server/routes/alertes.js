const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { normalizeTicker } = require('../ticker');

const router = express.Router();

router.use(requireAuth);

function toAlertesMap(rows) {
  const map = {};
  for (const row of rows) {
    map[String(row.id)] = {
      ticker: row.ticker,
      seuilHaut: row.seuil_haut,
      seuilBas: row.seuil_bas,
      active: Boolean(row.active),
      dernierCoursAlerte: row.dernier_cours_alerte,
      derniereAlerte: row.derniere_alerte,
      creeLe: row.cree_le
    };
  }
  return map;
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM alertes WHERE user_id = ?').all(req.session.userId);
  res.json(toAlertesMap(rows));
});

router.post('/', (req, res) => {
  const ticker = normalizeTicker(req.body.ticker);
  const seuilHaut = req.body.seuilHaut ? Number(req.body.seuilHaut) : null;
  const seuilBas = req.body.seuilBas ? Number(req.body.seuilBas) : null;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker requis' });
  }
  if (!seuilHaut && !seuilBas) {
    return res.status(400).json({ error: 'Au moins un seuil requis' });
  }

  const valeur = db.prepare('SELECT id FROM valeurs WHERE user_id = ? AND ticker = ?').get(req.session.userId, ticker);
  const valeurId = valeur ? valeur.id : null;

  db.prepare(
    `INSERT INTO alertes (user_id, ticker, valeur_id, seuil_haut, seuil_bas, active, dernier_cours_alerte, derniere_alerte, cree_le)
     VALUES (?, ?, ?, ?, ?, 1, NULL, NULL, ?)`
  ).run(req.session.userId, ticker, valeurId, seuilHaut, seuilBas, Date.now());

  res.status(201).json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM alertes WHERE user_id = ? AND id = ?').run(req.session.userId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
