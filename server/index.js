require('dotenv').config();
require('./load-addon-options').loadAddonOptions();

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const cron = require('node-cron');
const app = require('./app');
const { updatePrices, updateIndices } = require('./jobs/prices');
const { checkAlerts } = require('./jobs/alerts');

const PORT = process.env.PORT || 3000;
const SSL_DIR = process.env.SSL_DIR || '/ssl';

if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET non defini, une valeur par defaut non securisee est utilisee');
}

http.createServer(app).listen(PORT, () => {
  console.log(`Portfolio Tracker (HTTP) demarre sur le port ${PORT}`);
});

if (process.env.HTTPS_ENABLED === 'true') {
  const certPath = path.join(SSL_DIR, process.env.SSL_CERTFILE || 'fullchain.pem');
  const keyPath = path.join(SSL_DIR, process.env.SSL_KEYFILE || 'privkey.pem');

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsPort = process.env.HTTPS_PORT || 8443;

    https
      .createServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
      .listen(httpsPort, () => {
        console.log(`Portfolio Tracker (HTTPS) demarre sur le port ${httpsPort}`);
      });
  } else {
    console.error(`HTTPS active mais certificat introuvable (${certPath} / ${keyPath})`);
  }
}

cron.schedule('*/2 * * * *', () => {
  updatePrices().catch((error) => console.error('Erreur globale updatePrices:', error));
}, { timezone: 'Europe/Paris' });

cron.schedule('*/2 * * * *', () => {
  updateIndices().catch((error) => console.error('Erreur globale updateIndices:', error));
}, { timezone: 'Europe/Paris' });

cron.schedule('*/2 * * * *', () => {
  checkAlerts().catch((error) => console.error('Erreur globale checkAlerts:', error));
}, { timezone: 'Europe/Paris' });
