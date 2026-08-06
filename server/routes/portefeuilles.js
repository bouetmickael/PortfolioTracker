const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { normalizeTicker } = require('../ticker');
const { nextOrdre } = require('../ordre');
const { verifierTickerExiste } = require('../valeurs');
const { toPositionsArray, creerPosition } = require('../portefeuilles');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

router.use(requireAuth);

// Un portefeuille n'appartient qu'a un seul utilisateur, pas de partage
// (contrairement aux sections) : la reconstitution du portefeuille reel
// reste strictement privee. Meme pattern que sectionPossedee()
// (server/routes/sections.js).
function portefeuillePossede(userId, portefeuilleId) {
  return db.prepare('SELECT id FROM portefeuilles WHERE id = ? AND user_id = ?').get(portefeuilleId, userId);
}

router.get('/', (req, res) => {
  const portefeuilles = db
    .prepare('SELECT id, nom, ordre FROM portefeuilles WHERE user_id = ? ORDER BY ordre ASC')
    .all(req.session.userId);

  res.json(portefeuilles);
});

router.post('/', (req, res) => {
  const nom = (req.body.nom || '').trim();

  if (!nom) {
    return res.status(400).json({ error: 'Nom de portefeuille requis' });
  }

  const ordre = nextOrdre(db, 'portefeuilles', 'user_id = ?', [req.session.userId]);

  const info = db
    .prepare('INSERT INTO portefeuilles (user_id, nom, ordre, cree_le) VALUES (?, ?, ?, ?)')
    .run(req.session.userId, nom, ordre, Date.now());

  res.status(201).json({ id: info.lastInsertRowid, nom, ordre });
});

router.put('/:id', (req, res) => {
  const nom = (req.body.nom || '').trim();

  if (!nom) {
    return res.status(400).json({ error: 'Nom de portefeuille requis' });
  }

  const portefeuille = portefeuillePossede(req.session.userId, req.params.id);
  if (!portefeuille) {
    return res.status(404).json({ error: 'Portefeuille introuvable' });
  }

  db.prepare('UPDATE portefeuilles SET nom = ? WHERE id = ?').run(nom, portefeuille.id);

  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const portefeuille = portefeuillePossede(req.session.userId, req.params.id);
  if (!portefeuille) {
    return res.status(404).json({ error: 'Portefeuille introuvable' });
  }

  // ON DELETE CASCADE (portefeuille_lignes.portefeuille_id) supprime les
  // lignes qu'il contient, pas de transaction/suppression manuelle
  // necessaire contrairement a une section (qui reassigne ses valeurs
  // plutot que de les supprimer, voir server/routes/sections.js).
  db.prepare('DELETE FROM portefeuilles WHERE id = ?').run(portefeuille.id);

  res.json({ success: true });
});

router.get('/:id/positions', (req, res) => {
  const portefeuille = portefeuillePossede(req.session.userId, req.params.id);
  if (!portefeuille) {
    return res.status(404).json({ error: 'Portefeuille introuvable' });
  }

  const rows = db
    .prepare('SELECT * FROM portefeuille_lignes WHERE portefeuille_id = ? ORDER BY ordre ASC')
    .all(portefeuille.id);

  res.json(toPositionsArray(rows));
});

router.post(
  '/:id/positions',
  asyncHandler(async (req, res) => {
    const portefeuille = portefeuillePossede(req.session.userId, req.params.id);
    if (!portefeuille) {
      return res.status(404).json({ error: 'Portefeuille introuvable' });
    }

    const ticker = normalizeTicker(req.body.ticker);
    const type = req.body.type === 'Warrant' ? 'Warrant' : 'Action';
    const nom = (req.body.nom || '').trim();
    const quantite = Number(req.body.quantite);
    const prixRevient = Number(req.body.prixRevient);

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker requis' });
    }
    if (!Number.isFinite(quantite) || quantite <= 0) {
      return res.status(400).json({ error: 'Quantite invalide' });
    }
    if (!Number.isFinite(prixRevient) || prixRevient < 0) {
      return res.status(400).json({ error: 'Prix de revient invalide' });
    }

    const existing = db
      .prepare('SELECT id FROM portefeuille_lignes WHERE portefeuille_id = ? AND ticker = ?')
      .get(portefeuille.id, ticker);
    if (existing) {
      return res.status(409).json({ error: 'Cette valeur est deja dans ce portefeuille' });
    }

    const priceData = await verifierTickerExiste(ticker);
    if (!priceData) {
      return res.status(400).json({ error: 'Valeur introuvable sur Yahoo Finance' });
    }

    const id = creerPosition(db, { portefeuilleId: portefeuille.id, ticker, type, nom, quantite, prixRevient, priceData });

    res.status(201).json({ id });
  })
);

router.put('/:id/positions/:positionId', (req, res) => {
  const portefeuille = portefeuillePossede(req.session.userId, req.params.id);
  if (!portefeuille) {
    return res.status(404).json({ error: 'Portefeuille introuvable' });
  }

  const quantite = Number(req.body.quantite);
  const prixRevient = Number(req.body.prixRevient);

  if (!Number.isFinite(quantite) || quantite <= 0) {
    return res.status(400).json({ error: 'Quantite invalide' });
  }
  if (!Number.isFinite(prixRevient) || prixRevient < 0) {
    return res.status(400).json({ error: 'Prix de revient invalide' });
  }

  const info = db
    .prepare('UPDATE portefeuille_lignes SET quantite = ?, prix_revient = ? WHERE id = ? AND portefeuille_id = ?')
    .run(quantite, prixRevient, req.params.positionId, portefeuille.id);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Valeur introuvable dans ce portefeuille' });
  }

  res.json({ success: true });
});

router.delete('/:id/positions/:positionId', (req, res) => {
  const portefeuille = portefeuillePossede(req.session.userId, req.params.id);
  if (!portefeuille) {
    return res.status(404).json({ error: 'Portefeuille introuvable' });
  }

  db.prepare('DELETE FROM portefeuille_lignes WHERE id = ? AND portefeuille_id = ?').run(req.params.positionId, portefeuille.id);

  res.json({ success: true });
});

module.exports = router;
