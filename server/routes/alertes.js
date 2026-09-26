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
    note: row.note,
    active: Boolean(row.active),
    dernierCoursAlerte: row.dernier_cours_alerte,
    derniereAlerte: row.derniere_alerte,
    creeLe: row.cree_le
  }));
}

function normalizeNote(note) {
  if (typeof note !== 'string') return null;
  const trimmed = note.trim();
  return trimmed || null;
}

// Partage entre POST / et PUT /:id (creation et edition d'une alerte) :
// meme forme de seuils/note a lire depuis le corps de la requete.
function parseSeuilsEtNote(body) {
  return {
    seuilHaut: body.seuilHaut ? Number(body.seuilHaut) : null,
    seuilBas: body.seuilBas ? Number(body.seuilBas) : null,
    note: normalizeNote(body.note)
  };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM alertes WHERE user_id = ?').all(req.session.userId);
  res.json(toAlertesArray(rows));
});

router.post('/', (req, res) => {
  const ticker = normalizeTicker(req.body.ticker);
  const { seuilHaut, seuilBas, note } = parseSeuilsEtNote(req.body);

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker requis' });
  }
  if (!seuilHaut && !seuilBas) {
    return res.status(400).json({ error: 'Au moins un seuil requis' });
  }

  db.prepare(
    `INSERT INTO alertes (user_id, ticker, seuil_haut, seuil_bas, note, active, dernier_cours_alerte, derniere_alerte, cree_le)
     VALUES (?, ?, ?, ?, ?, 1, NULL, NULL, ?)`
  ).run(req.session.userId, ticker, seuilHaut, seuilBas, note, Date.now());

  res.status(201).json({ success: true });
});

router.put('/:id', (req, res) => {
  const { seuilHaut, seuilBas, note } = parseSeuilsEtNote(req.body);

  if (!seuilHaut && !seuilBas) {
    return res.status(400).json({ error: 'Au moins un seuil requis' });
  }

  const info = db
    .prepare('UPDATE alertes SET seuil_haut = ?, seuil_bas = ?, note = ? WHERE user_id = ? AND id = ?')
    .run(seuilHaut, seuilBas, note, req.session.userId, req.params.id);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Alerte introuvable' });
  }

  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM alertes WHERE user_id = ? AND id = ?').run(req.session.userId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
