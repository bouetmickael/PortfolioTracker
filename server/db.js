const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// /data est le chemin de stockage persistant standard, aussi bien pour un
// Home Assistant Add-on (fourni par le Supervisor) que pour le volume
// docker-compose (voir docker-compose.yml). DB_PATH reste surchargeable
// pour lancer le serveur en local sans Docker.
const DB_PATH = process.env.DB_PATH || path.join('/data', 'portfolio.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    ordre INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS valeurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Action',
    nom TEXT NOT NULL DEFAULT '',
    cours REAL NOT NULL DEFAULT 0,
    variation REAL NOT NULL DEFAULT 0,
    volume INTEGER NOT NULL DEFAULT 0,
    derniere_maj INTEGER,
    ajoute_le INTEGER NOT NULL,
    UNIQUE(user_id, ticker)
  );

  CREATE TABLE IF NOT EXISTS alertes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    seuil_haut REAL,
    seuil_bas REAL,
    active INTEGER NOT NULL DEFAULT 1,
    dernier_cours_alerte REAL,
    derniere_alerte INTEGER,
    cree_le INTEGER NOT NULL
  );
`);

// Migration : ajout de sections + section_id/ordre sur valeurs (introduites
// apres la creation initiale de la table valeurs, ALTER TABLE necessaire
// pour les bases existantes ; CREATE TABLE IF NOT EXISTS ne suffit pas).
const colonnesValeurs = db.prepare('PRAGMA table_info(valeurs)').all().map((c) => c.name);

if (!colonnesValeurs.includes('section_id')) {
  db.exec('ALTER TABLE valeurs ADD COLUMN section_id INTEGER REFERENCES sections(id)');
}
if (!colonnesValeurs.includes('ordre')) {
  db.exec('ALTER TABLE valeurs ADD COLUMN ordre INTEGER NOT NULL DEFAULT 0');
}

const backfillSectionsParDefaut = db.transaction(() => {
  const NOM_SECTION_DEFAUT = 'General';

  const usersSansSection = db
    .prepare('SELECT id FROM users WHERE id NOT IN (SELECT DISTINCT user_id FROM sections)')
    .all();

  const creerSection = db.prepare('INSERT INTO sections (user_id, nom, ordre) VALUES (?, ?, 0)');
  for (const user of usersSansSection) {
    creerSection.run(user.id, NOM_SECTION_DEFAUT);
  }

  const valeursSansSection = db
    .prepare('SELECT id, user_id FROM valeurs WHERE section_id IS NULL ORDER BY ajoute_le ASC')
    .all();

  const sectionDefautParUser = new Map();
  const affecterValeur = db.prepare('UPDATE valeurs SET section_id = ?, ordre = ? WHERE id = ?');
  const compteurOrdreParSection = new Map();

  for (const valeur of valeursSansSection) {
    let sectionId = sectionDefautParUser.get(valeur.user_id);
    if (sectionId === undefined) {
      const section = db
        .prepare('SELECT id FROM sections WHERE user_id = ? ORDER BY ordre ASC LIMIT 1')
        .get(valeur.user_id);
      sectionId = section.id;
      sectionDefautParUser.set(valeur.user_id, sectionId);
    }

    const ordre = compteurOrdreParSection.get(sectionId) || 0;
    affecterValeur.run(sectionId, ordre, valeur.id);
    compteurOrdreParSection.set(sectionId, ordre + 1);
  }
});

backfillSectionsParDefaut();

module.exports = db;
