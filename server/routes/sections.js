const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { normalizeTicker } = require('../ticker');

const router = express.Router();

router.use(requireAuth);

function toSectionsArray(rows) {
  return rows.map((row) => ({ id: row.id, nom: row.nom, ordre: row.ordre }));
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM sections WHERE user_id = ? ORDER BY ordre ASC').all(req.session.userId);
  res.json(toSectionsArray(rows));
});

router.post('/', (req, res) => {
  const nom = (req.body.nom || '').trim();

  if (!nom) {
    return res.status(400).json({ error: 'Nom de section requis' });
  }

  const { maxOrdre } = db
    .prepare('SELECT MAX(ordre) as maxOrdre FROM sections WHERE user_id = ?')
    .get(req.session.userId);
  const ordre = (maxOrdre === null ? -1 : maxOrdre) + 1;

  const info = db
    .prepare('INSERT INTO sections (user_id, nom, ordre) VALUES (?, ?, ?)')
    .run(req.session.userId, nom, ordre);

  res.status(201).json({ id: info.lastInsertRowid, nom, ordre });
});

// Doit etre declare avant /:id pour ne pas etre intercepte par la route
// parametree (Express matche les routes dans l'ordre de declaration).
router.put('/reorder', (req, res) => {
  const sections = Array.isArray(req.body.sections) ? req.body.sections : [];

  const sectionsUser = db.prepare('SELECT id FROM sections WHERE user_id = ?').all(req.session.userId);
  const idsSectionsUser = new Set(sectionsUser.map((s) => s.id));

  for (const section of sections) {
    if (!idsSectionsUser.has(section.id)) {
      return res.status(403).json({ error: 'Section invalide' });
    }
  }

  const updateOrdreSection = db.prepare('UPDATE sections SET ordre = ? WHERE id = ? AND user_id = ?');
  const updateValeur = db.prepare(
    'UPDATE valeurs SET section_id = ?, ordre = ? WHERE user_id = ? AND ticker = ?'
  );

  const appliquerReorder = db.transaction(() => {
    sections.forEach((section, indexSection) => {
      const ordreSection = Number.isInteger(section.ordre) ? section.ordre : indexSection;
      updateOrdreSection.run(ordreSection, section.id, req.session.userId);

      const valeurIds = Array.isArray(section.valeurIds) ? section.valeurIds : [];
      valeurIds.forEach((ticker, indexValeur) => {
        updateValeur.run(section.id, indexValeur, req.session.userId, normalizeTicker(ticker));
      });
    });
  });
  appliquerReorder();

  res.json({ success: true });
});

router.put('/:id', (req, res) => {
  const nom = (req.body.nom || '').trim();

  if (!nom) {
    return res.status(400).json({ error: 'Nom de section requis' });
  }

  const info = db
    .prepare('UPDATE sections SET nom = ? WHERE id = ? AND user_id = ?')
    .run(nom, req.params.id, req.session.userId);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Section introuvable' });
  }

  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const sectionId = Number(req.params.id);

  const section = db.prepare('SELECT id FROM sections WHERE id = ? AND user_id = ?').get(sectionId, req.session.userId);
  if (!section) {
    return res.status(404).json({ error: 'Section introuvable' });
  }

  const { total } = db.prepare('SELECT COUNT(*) as total FROM sections WHERE user_id = ?').get(req.session.userId);
  if (total <= 1) {
    return res.status(400).json({ error: 'Impossible de supprimer la derniere section' });
  }

  const fallback = db
    .prepare('SELECT id FROM sections WHERE user_id = ? AND id != ? ORDER BY ordre ASC LIMIT 1')
    .get(req.session.userId, sectionId);

  const supprimerSection = db.transaction(() => {
    const { maxOrdre } = db
      .prepare('SELECT MAX(ordre) as maxOrdre FROM valeurs WHERE user_id = ? AND section_id = ?')
      .get(req.session.userId, fallback.id);
    let ordreSuivant = (maxOrdre === null ? -1 : maxOrdre) + 1;

    const valeursADeplacer = db
      .prepare('SELECT id FROM valeurs WHERE user_id = ? AND section_id = ? ORDER BY ordre ASC')
      .all(req.session.userId, sectionId);

    const deplacerValeur = db.prepare('UPDATE valeurs SET section_id = ?, ordre = ? WHERE id = ?');
    for (const valeur of valeursADeplacer) {
      deplacerValeur.run(fallback.id, ordreSuivant, valeur.id);
      ordreSuivant++;
    }

    db.prepare('DELETE FROM sections WHERE id = ? AND user_id = ?').run(sectionId, req.session.userId);
  });
  supprimerSection();

  res.json({ success: true, fallbackSectionId: fallback.id });
});

module.exports = router;
