const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM indices_marche ORDER BY rowid ASC').all();

  res.json(
    rows.map((row) => ({
      ticker: row.ticker,
      nom: row.nom,
      cours: row.cours,
      variation: row.variation,
      devise: row.devise,
      derniereMaj: row.derniere_maj
    }))
  );
});

module.exports = router;
