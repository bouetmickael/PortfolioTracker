const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Liste restreinte (id, email, displayName) des autres utilisateurs connus,
// utilisee par la modale de partage d'une section pour choisir un
// destinataire. Aucune autre donnee (mot de passe, valeurs, sections) n'est
// exposee par cette route.
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT id, email, display_name FROM users WHERE id != ? ORDER BY email ASC')
    .all(req.session.userId);

  res.json(rows.map((row) => ({ id: row.id, email: row.email, displayName: row.display_name })));
});

module.exports = router;
