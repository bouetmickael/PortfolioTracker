const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { normalizeTicker } = require('../ticker');
const { nextOrdre } = require('../ordre');
const { ROLES_VALIDES, rolesSection, roleSection, peutEcrire } = require('../partage');
const { HAS_ALERTE_SUBQUERY, toValeursArray, supprimerValeur, supprimerAlertesOrphelines } = require('../valeurs');

const router = express.Router();

router.use(requireAuth);

function toSectionsArray(rows, acces, emailParUserId) {
  return rows.map((row) => {
    const info = acces.get(row.id);
    const section = { id: row.id, nom: row.nom, ordre: row.ordre, role: info.role };
    if (info.role !== 'proprietaire') {
      section.proprietaireEmail = emailParUserId.get(info.proprietaireId) || null;
    } else {
      section.partagee = !!row.partagee;
    }
    return section;
  });
}

// Verifie que la section appartient bien a l'utilisateur courant (seul le
// proprietaire peut la renommer/supprimer/partager, voir BUSINESS_RULES.md).
function sectionPossedee(userId, sectionId) {
  return db.prepare('SELECT id FROM sections WHERE id = ? AND user_id = ?').get(sectionId, userId);
}

router.get('/', (req, res) => {
  const acces = rolesSection(db, req.session.userId);
  const ids = [...acces.keys()];

  if (ids.length === 0) {
    return res.json([]);
  }

  const placeholders = ids.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT *, EXISTS(SELECT 1 FROM section_shares WHERE section_id = sections.id) AS partagee
       FROM sections WHERE id IN (${placeholders})`
    )
    .all(...ids);

  const idsProprietairesPartages = [...new Set(rows.filter((r) => acces.get(r.id).role !== 'proprietaire').map((r) => r.user_id))];
  const emailParUserId = new Map();
  if (idsProprietairesPartages.length > 0) {
    const placeholdersUsers = idsProprietairesPartages.map(() => '?').join(',');
    const users = db.prepare(`SELECT id, email FROM users WHERE id IN (${placeholdersUsers})`).all(...idsProprietairesPartages);
    for (const user of users) emailParUserId.set(user.id, user.email);
  }

  const sections = toSectionsArray(rows, acces, emailParUserId);
  sections.sort((a, b) => {
    if (a.role === 'proprietaire' && b.role !== 'proprietaire') return -1;
    if (a.role !== 'proprietaire' && b.role === 'proprietaire') return 1;
    if (a.role === 'proprietaire') return a.ordre - b.ordre;
    return a.nom.localeCompare(b.nom);
  });

  res.json(sections);
});

router.post('/', (req, res) => {
  const nom = (req.body.nom || '').trim();

  if (!nom) {
    return res.status(400).json({ error: 'Nom de section requis' });
  }

  const ordre = nextOrdre(db, 'sections', 'user_id = ?', [req.session.userId]);

  const info = db
    .prepare('INSERT INTO sections (user_id, nom, ordre) VALUES (?, ?, ?)')
    .run(req.session.userId, nom, ordre);

  res.status(201).json({ id: info.lastInsertRowid, nom, ordre });
});

// Doit etre declare avant /:id pour ne pas etre intercepte par la route
// parametree (Express matche les routes dans l'ordre de declaration).
router.put('/reorder', (req, res) => {
  const sections = Array.isArray(req.body.sections) ? req.body.sections : [];
  const acces = rolesSection(db, req.session.userId);

  for (const section of sections) {
    const info = acces.get(section.id);
    if (!peutEcrire(info)) {
      return res.status(403).json({ error: 'Section invalide' });
    }
  }

  const updateOrdreSection = db.prepare('UPDATE sections SET ordre = ? WHERE id = ? AND user_id = ?');
  const updateValeur = db.prepare('UPDATE valeurs SET section_id = ?, ordre = ? WHERE id = ? AND user_id = ?');

  const appliquerReorder = db.transaction(() => {
    sections.forEach((section, indexSection) => {
      const info = acces.get(section.id);

      if (info.role === 'proprietaire') {
        const ordreSection = Number.isInteger(section.ordre) ? section.ordre : indexSection;
        updateOrdreSection.run(ordreSection, section.id, req.session.userId);
      }

      const valeurIds = Array.isArray(section.valeurIds) ? section.valeurIds : [];
      valeurIds.forEach((valeurId, indexValeur) => {
        updateValeur.run(section.id, indexValeur, valeurId, info.proprietaireId);
      });
    });
  });
  appliquerReorder();

  res.json({ success: true });
});

// Partage d'une section (lecture/ecriture) : reserve au proprietaire, voir
// BUSINESS_RULES.md § Partage de section.

router.get('/:id/partages', (req, res) => {
  const section = sectionPossedee(req.session.userId, req.params.id);
  if (!section) {
    return res.status(404).json({ error: 'Section introuvable' });
  }

  const rows = db
    .prepare(
      `SELECT ss.user_id as userId, ss.role as role, u.email as email, u.display_name as displayName
       FROM section_shares ss
       JOIN users u ON u.id = ss.user_id
       WHERE ss.section_id = ?
       ORDER BY u.email ASC`
    )
    .all(section.id);

  res.json(rows);
});

router.post('/:id/partages', (req, res) => {
  const section = sectionPossedee(req.session.userId, req.params.id);
  if (!section) {
    return res.status(404).json({ error: 'Section introuvable' });
  }

  const email = (req.body.email || '').trim().toLowerCase();
  const role = req.body.role;

  if (!ROLES_VALIDES.includes(role)) {
    return res.status(400).json({ error: 'Role invalide' });
  }

  const cible = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!cible) {
    return res.status(404).json({ error: 'Aucun utilisateur avec cet email' });
  }
  if (cible.id === req.session.userId) {
    return res.status(400).json({ error: 'Impossible de partager une section avec vous-meme' });
  }

  const existant = db
    .prepare('SELECT id FROM section_shares WHERE section_id = ? AND user_id = ?')
    .get(section.id, cible.id);

  if (existant) {
    db.prepare('UPDATE section_shares SET role = ? WHERE id = ?').run(role, existant.id);
  } else {
    db.prepare('INSERT INTO section_shares (section_id, user_id, role, cree_le) VALUES (?, ?, ?, ?)').run(
      section.id,
      cible.id,
      role,
      Date.now()
    );
  }

  res.status(201).json({ success: true });
});

router.delete('/:id/partages/:userId', (req, res) => {
  const section = sectionPossedee(req.session.userId, req.params.id);
  if (!section) {
    return res.status(404).json({ error: 'Section introuvable' });
  }

  db.prepare('DELETE FROM section_shares WHERE section_id = ? AND user_id = ?').run(section.id, req.params.userId);

  res.json({ success: true });
});

// Valeurs d'une section partagee (lecture/ecriture). GET /api/valeurs reste
// strictement limite aux valeurs propres de l'utilisateur (voir
// server/routes/valeurs.js) ; cette route expose uniquement les valeurs
// d'UNE section a la fois, ce qui reste sans ambiguite de ticker puisqu'une
// section n'appartient qu'a un seul proprietaire (voir BUSINESS_RULES.md).
// L'ajout d'une valeur dans une section (possedee ou partagee en ecriture)
// passe desormais par POST /api/valeurs (voir server/routes/valeurs.js
// § sectionCibleEcriture, CLAUDE.md Historique des revues, Revue n°6).

router.get('/:id/valeurs', (req, res) => {
  const info = roleSection(db, req.session.userId, Number(req.params.id));
  if (!info) {
    return res.status(404).json({ error: 'Section introuvable' });
  }

  const rows = db
    .prepare(
      `SELECT v.*, ${HAS_ALERTE_SUBQUERY}
       FROM valeurs v
       WHERE v.section_id = ?`
    )
    .all(Number(req.params.id));

  res.json(toValeursArray(rows));
});

router.delete('/:id/valeurs/:ticker', (req, res) => {
  const info = roleSection(db, req.session.userId, Number(req.params.id));
  if (!peutEcrire(info)) {
    return res.status(403).json({ error: 'Section invalide' });
  }

  const ticker = normalizeTicker(req.params.ticker);
  const valeur = db
    .prepare('SELECT id FROM valeurs WHERE user_id = ? AND ticker = ? AND section_id = ?')
    .get(info.proprietaireId, ticker, Number(req.params.id));

  if (valeur) {
    const executerSuppression = db.transaction(() => {
      supprimerValeur(db, valeur.id);
      supprimerAlertesOrphelines(db, info.proprietaireId, ticker);
    });
    executerSuppression();
  }

  res.json({ success: true });
});

router.put('/:id', (req, res) => {
  const nom = (req.body.nom || '').trim();

  if (!nom) {
    return res.status(400).json({ error: 'Nom de section requis' });
  }

  // sectionPossedee() puis mutation separee plutot que le WHERE id = ? AND
  // user_id = ? historique de l'UPDATE : sans risque de TOCTOU (better-
  // sqlite3 est synchrone, aucune requete concurrente ne peut s'intercaler
  // entre les deux appels dans un meme process Node), voir CLAUDE.md
  // Historique des revues, Revue n°3.
  const section = sectionPossedee(req.session.userId, req.params.id);
  if (!section) {
    return res.status(404).json({ error: 'Section introuvable' });
  }

  db.prepare('UPDATE sections SET nom = ? WHERE id = ?').run(nom, section.id);

  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const sectionId = Number(req.params.id);

  const section = sectionPossedee(req.session.userId, sectionId);
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
    let ordreSuivant = nextOrdre(db, 'valeurs', 'user_id = ? AND section_id = ?', [req.session.userId, fallback.id]);

    const valeursADeplacer = db
      .prepare('SELECT id, ticker FROM valeurs WHERE user_id = ? AND section_id = ? ORDER BY ordre ASC')
      .all(req.session.userId, sectionId);

    // Tickers deja suivis dans la section de repli, recuperes une seule fois
    // (une section ne peut pas contenir deux fois le meme ticker - contrainte
    // UNIQUE(user_id, ticker, section_id) -, donc valeursADeplacer ne peut pas
    // en ajouter un second au fil de la boucle).
    const tickersFallback = new Set(
      db
        .prepare('SELECT ticker FROM valeurs WHERE user_id = ? AND section_id = ?')
        .all(req.session.userId, fallback.id)
        .map((row) => row.ticker)
    );
    const deplacerValeur = db.prepare('UPDATE valeurs SET section_id = ?, ordre = ? WHERE id = ?');
    // Une valeur deja presente dans la section de repli (meme ticker suivi
    // dans les deux sections, voir BUSINESS_RULES.md § Valeurs suivies) ne
    // peut pas y etre deplacee (contrainte UNIQUE(user_id, ticker,
    // section_id)) : elle devient redondante et est supprimee plutot que
    // deplacee, la section de repli suivant deja ce ticker. L'alerte
    // elle-meme (liee au ticker) n'est pas supprimee : la section de repli
    // suit deja ce ticker.
    for (const valeur of valeursADeplacer) {
      if (tickersFallback.has(valeur.ticker)) {
        supprimerValeur(db, valeur.id);
        continue;
      }
      deplacerValeur.run(fallback.id, ordreSuivant, valeur.id);
      ordreSuivant++;
    }

    db.prepare('DELETE FROM sections WHERE id = ? AND user_id = ?').run(sectionId, req.session.userId);
  });
  supprimerSection();

  res.json({ success: true, fallbackSectionId: fallback.id });
});

module.exports = router;
