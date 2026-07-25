const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const os = require('os');
const fs = require('fs');
const Database = require('better-sqlite3');

// Ce fichier teste directement la migration/backfill de server/db.js (pas
// via l'API) : on pre-remplit une base au format "avant migration" (table
// alertes sans la colonne valeur_id) puis on require('../db') pour
// declencher la migration, comme au demarrage reel du serveur sur une base
// existante.
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
    UNIQUE(user_id, ticker)
  );
  CREATE TABLE alertes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ticker TEXT NOT NULL,
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
  .run('backfill-legacy@test.local', 'hash', 'Legacy', Date.now()).lastInsertRowid;

raw.prepare('INSERT INTO sections (user_id, nom, ordre) VALUES (?, ?, 0)').run(userId, 'General');

const valeurId = raw
  .prepare('INSERT INTO valeurs (user_id, ticker, ajoute_le) VALUES (?, ?, ?)')
  .run(userId, 'AAPL', Date.now()).lastInsertRowid;

raw
  .prepare('INSERT INTO alertes (user_id, ticker, seuil_haut, seuil_bas, active, cree_le) VALUES (?, ?, ?, ?, 1, ?)')
  .run(userId, 'AAPL', 200, null, Date.now());

// Alerte dont le ticker ne correspond plus a aucune valeur suivie de
// l'utilisateur : valeur_id doit rester NULL apres le backfill.
raw
  .prepare('INSERT INTO alertes (user_id, ticker, seuil_haut, seuil_bas, active, cree_le) VALUES (?, ?, ?, ?, 1, ?)')
  .run(userId, 'ORPHAN', 50, null, Date.now());

raw.close();

// eslint-disable-next-line global-require
const db = require('../db');

after(() => {
  for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(dbFile + suffix, { force: true });
  }
});

test('le backfill resout alertes.valeur_id en matchant ticker + user_id sur une valeur existante', () => {
  const alerte = db.prepare('SELECT valeur_id FROM alertes WHERE ticker = ?').get('AAPL');
  assert.equal(alerte.valeur_id, valeurId);
});

test('le backfill laisse valeur_id a NULL quand aucune valeur ne correspond au ticker', () => {
  const alerte = db.prepare('SELECT valeur_id FROM alertes WHERE ticker = ?').get('ORPHAN');
  assert.equal(alerte.valeur_id, null);
});
