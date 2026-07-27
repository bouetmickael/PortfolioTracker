const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { normalizeTicker } = require('../ticker');

const router = express.Router();

router.use(requireAuth);

// Tableau plutot qu'une map indexee par id (heritage Firebase Realtime
// Database, voir CLAUDE.md Historique des revues) : meme convention que
// GET /api/valeurs (Session 27) - un consommateur n'a jamais besoin de
// l'id comme cle d'acces direct, seulement de le lire sur chaque element.
function toAlertesArray(rows) {
  return rows.map((row) => ({
    id: row.id,
    ticker: row.ticker,
    seuilHaut: row.seuil_haut,
    seuilBas: row.seuil_bas,
    active: Boolean(row.active),
    dernierCoursAlerte: row.dernier_cours_alerte,
    derniereAlerte: row.derniere_alerte,
    creeLe: row.cree_le
  }));
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM alertes WHERE user_id = ?').all(req.session.userId);
  res.json(toAlertesArray(rows));
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

  db.prepare(
    `INSERT INTO alertes (user_id, ticker, seuil_haut, seuil_bas, active, dernier_cours_alerte, derniere_alerte, cree_le)
     VALUES (?, ?, ?, ?, 1, NULL, NULL, ?)`
  ).run(req.session.userId, ticker, seuilHaut, seuilBas, Date.now());

  res.status(201).json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM alertes WHERE user_id = ? AND id = ?').run(req.session.userId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
