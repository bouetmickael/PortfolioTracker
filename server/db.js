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
    section_id INTEGER REFERENCES sections(id),
    ordre INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, ticker, section_id)
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

  CREATE TABLE IF NOT EXISTS section_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'lecture',
    cree_le INTEGER NOT NULL,
    UNIQUE(section_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS indices_marche (
    ticker TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    cours REAL NOT NULL DEFAULT 0,
    variation REAL NOT NULL DEFAULT 0,
    devise TEXT NOT NULL DEFAULT 'EUR',
    derniere_maj INTEGER
  );
`);

// Amorcage des indices de marche suivis (liste fixe, voir server/indices.js) :
// une ligne par indice, cours a 0 tant que le job de mise a jour des cours
// (server/jobs/prices.js) n'a pas encore tourne.
const { INDICES } = require('./indices');
const amorcerIndice = db.prepare('INSERT OR IGNORE INTO indices_marche (ticker, nom) VALUES (?, ?)');
for (const indice of INDICES) {
  amorcerIndice.run(indice.ticker, indice.nom);
}

// Migration : ajout de sections + section_id/ordre sur valeurs (introduites
// apres la creation initiale de la table valeurs, ALTER TABLE necessaire
// pour les bases existantes ; CREATE TABLE IF NOT EXISTS ne suffit pas).
function columnExists(table, column) {
  return db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .some((c) => c.name === column);
}

if (!columnExists('valeurs', 'section_id')) {
  db.exec('ALTER TABLE valeurs ADD COLUMN section_id INTEGER REFERENCES sections(id)');
}
if (!columnExists('valeurs', 'ordre')) {
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

// Migration : assouplissement de la contrainte UNIQUE sur valeurs, pour
// permettre a une meme valeur (ticker) d'etre suivie dans plusieurs sections
// du meme utilisateur (ex. "NVDA" dans "General" ET dans une autre section),
// tout en interdisant toujours un doublon dans une meme section. SQLite ne
// permet pas de modifier une contrainte UNIQUE existante via ALTER TABLE : la
// table est recreee avec la nouvelle contrainte si l'ancienne (sans
// section_id) est encore en place - idempotent, verifie via sqlite_master.sql
// et sans effet sur une base deja migree ou fraichement creee (le CREATE
// TABLE IF NOT EXISTS ci-dessus a deja la bonne contrainte). Execute apres
// backfillSectionsParDefaut() : toutes les valeurs ont deja un section_id.
const { sql: valeursSchemaSql } = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'valeurs'`).get();
if (valeursSchemaSql.includes('UNIQUE(user_id, ticker)')) {
  db.pragma('foreign_keys = OFF');
  db.transaction(() => {
    db.exec(`
      CREATE TABLE valeurs_new (
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
        section_id INTEGER REFERENCES sections(id),
        ordre INTEGER NOT NULL DEFAULT 0,
        UNIQUE(user_id, ticker, section_id)
      );
      INSERT INTO valeurs_new (id, user_id, ticker, type, nom, cours, variation, volume, derniere_maj, ajoute_le, section_id, ordre)
        SELECT id, user_id, ticker, type, nom, cours, variation, volume, derniere_maj, ajoute_le, section_id, ordre FROM valeurs;
      DROP TABLE valeurs;
      ALTER TABLE valeurs_new RENAME TO valeurs;
    `);
  })();
  db.pragma('foreign_keys = ON');
}

// Migration : suppression de alertes.valeur_id, colonne FK vestigiale
// (ajoutee en Session 11 pour savoir en une jointure/sous-requete si une
// valeur suivie a une alerte active, puis backfillee) - plus lue nulle
// part depuis que les alertes sont rejointes par (user_id, ticker) (voir
// HAS_ALERTE_SUBQUERY dans server/valeurs.js, checkAlerts() dans
// server/jobs/alerts.js) - voir CLAUDE.md Historique des revues, Revue
// n°6. SQLite ne permet pas de retirer une colonne portant une contrainte
// FK via ALTER TABLE : meme technique de recreation de table que la
// migration UNIQUE(user_id, ticker, section_id) de valeurs ci-dessus. Ne
// s'applique qu'aux bases ayant deja subi l'ancienne migration ADD COLUMN
// valeur_id - une base fraiche a deja la bonne definition via le CREATE
// TABLE IF NOT EXISTS en tete de ce fichier.
if (columnExists('alertes', 'valeur_id')) {
  db.pragma('foreign_keys = OFF');
  db.transaction(() => {
    db.exec(`
      CREATE TABLE alertes_new (
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
      INSERT INTO alertes_new (id, user_id, ticker, seuil_haut, seuil_bas, active, dernier_cours_alerte, derniere_alerte, cree_le)
        SELECT id, user_id, ticker, seuil_haut, seuil_bas, active, dernier_cours_alerte, derniere_alerte, cree_le FROM alertes;
      DROP TABLE alertes;
      ALTER TABLE alertes_new RENAME TO alertes;
    `);
  })();
  db.pragma('foreign_keys = ON');
}

module.exports = db;
