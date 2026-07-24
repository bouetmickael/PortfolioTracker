/**
 * Quand l'application tourne comme Home Assistant Add-on, le Supervisor
 * fournit la configuration saisie dans l'interface (onglet Configuration)
 * sous forme de fichier JSON dans /data/options.json, pas de variables
 * d'environnement. Ce module traduit ce fichier vers les memes variables
 * d'environnement que le mode Docker Compose classique (.env), pour que le
 * reste du code (server/app.js, server/index.js) n'ait pas a distinguer les
 * deux modes de deploiement.
 *
 * Une variable d'environnement deja definie (mode Docker Compose) est
 * toujours prioritaire sur options.json.
 */

const fs = require('fs');

const OPTIONS_PATH = process.env.ADDON_OPTIONS_PATH || '/data/options.json';

const OPTION_TO_ENV = {
  session_secret: 'SESSION_SECRET',
  smtp_host: 'SMTP_HOST',
  smtp_port: 'SMTP_PORT',
  smtp_secure: 'SMTP_SECURE',
  smtp_user: 'SMTP_USER',
  smtp_pass: 'SMTP_PASS',
  mail_from: 'MAIL_FROM'
};

function loadAddonOptions() {
  if (!fs.existsSync(OPTIONS_PATH)) return;

  let options;
  try {
    options = JSON.parse(fs.readFileSync(OPTIONS_PATH, 'utf8'));
  } catch (error) {
    console.error('Erreur lecture options.json:', error.message);
    return;
  }

  for (const [optionKey, envKey] of Object.entries(OPTION_TO_ENV)) {
    const value = options[optionKey];
    if (value === undefined || value === null || value === '') continue;
    if (process.env[envKey]) continue;
    process.env[envKey] = String(value);
  }
}

module.exports = { loadAddonOptions };
