require('dotenv').config();
require('./load-addon-options').loadAddonOptions();

const cron = require('node-cron');
const app = require('./app');
const { updatePrices } = require('./jobs/prices');
const { checkAlerts } = require('./jobs/alerts');

const PORT = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET non defini dans .env, une valeur par defaut non securisee est utilisee');
}

app.listen(PORT, () => {
  console.log(`Portfolio Tracker demarre sur le port ${PORT}`);
});

cron.schedule('*/2 * * * *', () => {
  updatePrices().catch((error) => console.error('Erreur globale updatePrices:', error));
}, { timezone: 'Europe/Paris' });

cron.schedule('*/2 * * * *', () => {
  checkAlerts().catch((error) => console.error('Erreur globale checkAlerts:', error));
}, { timezone: 'Europe/Paris' });
