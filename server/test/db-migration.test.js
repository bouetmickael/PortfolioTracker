const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const os = require('os');
const fs = require('fs');
const Database = require('better-sqlite3');

// Ce fichier teste directement la migration de server/db.js (pas via
// l'API) : on pre-remplit une base au format "avant migration" (table
// alertes avec la colonne valeur_id, comme une base ayant deja subi
// l'ancienne migration ADD COLUMN) puis on require('../db') pour
// declencher la migration de recreation de table, comme au demarrage reel
// du serveur sur une base existante. Voir CLAUDE.md Historique des revues,
// Revue n°6 (alertes.valeur_id, colonne FK vestigiale retiree).
const dbFile = path.join(os.tmpdir(), `portfolio-test-db-migration-${Date.now()}-${process.pid}.db`);
process.env.DB_PATH = dbFile;
process.env.SESSION_SECRET = 'test-secret';

const raw = new Database(dbFile);
raw.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    nom TEXT NOT NULL,
    ordre INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE valeurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ticker TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Action',
    nom TEXT NOT NULL DEFAULT '',
    cours REAL NOT NULL DEFAULT 0,
    variation REAL NOT NULL DEFAULT 0,
    volume INTEGER NOT NULL DEFAULT 0,
    derniere_maj INTEGER,
    ajoute_le INTEGER NOT NULL,
    section_id INTEGER,
    ordre INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, ticker, section_id)
  );
  CREATE TABLE alertes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ticker TEXT NOT NULL,
    valeur_id INTEGER REFERENCES valeurs(id),
    seuil_haut REAL,
    seuil_bas REAL,
    active INTEGER NOT NULL DEFAULT 1,
    dernier_cours_alerte REAL,
    derniere_alerte INTEGER,
    cree_le INTEGER NOT NULL
  );
`);

const userId = raw
  .prepare('INSERT INTO users (email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?)')
  .run('legacy-valeur-id@test.local', 'hash', 'Legacy', Date.now()).lastInsertRowid;

raw.prepare('INSERT INTO sections (user_id, nom, ordre) VALUES (?, ?, 0)').run(userId, 'General');

const valeurId = raw
  .prepare('INSERT INTO valeurs (user_id, ticker, ajoute_le) VALUES (?, ?, ?)')
  .run(userId, 'AAPL', Date.now()).lastInsertRowid;

const alerteId = raw
  .prepare(
    'INSERT INTO alertes (user_id, ticker, valeur_id, seuil_haut, seuil_bas, active, dernier_cours_alerte, derniere_alerte, cree_le) VALUES (?, ?, ?, ?, ?, 1, NULL, NULL, ?)'
  )
  .run(userId, 'AAPL', valeurId, 200, null, Date.now()).lastInsertRowid;

raw.close();

// eslint-disable-next-line global-require
const db = require('../db');

after(() => {
  for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(dbFile + suffix, { force: true });
  }
});

test('la migration retire la colonne alertes.valeur_id', () => {
  const colonnes = db.prepare('PRAGMA table_info(alertes)').all().map((c) => c.name);
  assert.ok(!colonnes.includes('valeur_id'));
});

test('la migration preserve les autres colonnes des alertes existantes', () => {
  const alerte = db.prepare('SELECT * FROM alertes WHERE id = ?').get(alerteId);
  assert.equal(alerte.user_id, userId);
  assert.equal(alerte.ticker, 'AAPL');
  assert.equal(alerte.seuil_haut, 200);
  assert.equal(alerte.seuil_bas, null);
  assert.equal(alerte.active, 1);
});
