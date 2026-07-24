/**
 * FIREBASE CLOUD FUNCTIONS - PORTFOLIO TRACKER
 *
 * Fonctions :
 * 1. Mise a jour automatique des cours (toutes les 2 minutes)
 * 2. Verification des alertes de seuil
 * 3. Envoi de notifications push (Firebase Cloud Messaging)
 * 4. Recuperation de donnees historiques pour les graphiques
 *
 * Source de donnees : Yahoo Finance (endpoint public non officiel).
 * Limite connue : pas de PER sectoriel, pas de Greeks/warrants, delai
 * d'environ 15 minutes sur les marches US.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

const USE_YAHOO_FINANCE = true;

// ========================================
// CONFIGURATION
// ========================================

function getConfig() {
  return functions.config();
}

// ========================================
// MISE A JOUR DES COURS (toutes les 2 minutes)
// ========================================

exports.updatePrices = functions.pubsub
  .schedule('every 2 minutes')
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    console.log('Demarrage mise a jour des cours');

    try {
      const db = admin.database();
      const usersRef = db.ref('users');
      const snapshot = await usersRef.once('value');
      const users = snapshot.val();

      if (!users) {
        console.log('Aucun utilisateur dans la base');
        return null;
      }

      const tickersSet = new Set();
      for (const userData of Object.values(users)) {
        if (userData.valeurs) {
          Object.keys(userData.valeurs).forEach((ticker) => tickersSet.add(ticker));
        }
      }

      const tickers = Array.from(tickersSet);
      console.log(`${tickers.length} tickers a mettre a jour`);

      const updates = [];
      for (const ticker of tickers) {
        try {
          const priceData = await fetchPrice(ticker);

          for (const [uid, userData] of Object.entries(users)) {
            if (userData.valeurs && userData.valeurs[ticker]) {
              const updatePath = `users/${uid}/valeurs/${ticker}`;
              updates.push(
                db.ref(updatePath).update({
                  cours: priceData.price,
                  variation: priceData.changePct,
                  volume: priceData.volume,
                  derniereMaj: admin.database.ServerValue.TIMESTAMP
                })
              );
            }
          }

          console.log(`${ticker}: ${priceData.price} (${priceData.changePct.toFixed(2)}%)`);
        } catch (error) {
          console.error(`Erreur ${ticker}:`, error.message);
        }
      }

      await Promise.all(updates);
      console.log(`Mise a jour terminee : ${updates.length} valeurs`);
    } catch (error) {
      console.error('Erreur globale updatePrices:', error);
    }

    return null;
  });

// ========================================
// VERIFICATION DES ALERTES (toutes les 2 minutes)
// ========================================

exports.checkAlerts = functions.pubsub
  .schedule('every 2 minutes')
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    console.log('Demarrage verification alertes');

    try {
      const db = admin.database();
      const usersRef = db.ref('users');
      const snapshot = await usersRef.once('value');
      const users = snapshot.val();

      if (!users) return null;

      let alertesEnvoyees = 0;

      for (const [uid, userData] of Object.entries(users)) {
        if (!userData.alertes || !userData.valeurs) continue;

        for (const [alerteId, alerte] of Object.entries(userData.alertes)) {
          if (!alerte.active) continue;

          const valeur = userData.valeurs[alerte.ticker];
          if (!valeur) continue;

          const cours = valeur.cours;
          let alerteDeclenchee = false;
          let typeAlerte = '';
          let seuil = 0;

          if (alerte.seuilHaut && cours >= alerte.seuilHaut) {
            if (!alerte.dernierCoursAlerte || alerte.dernierCoursAlerte < alerte.seuilHaut) {
              alerteDeclenchee = true;
              typeAlerte = 'HAUTE';
              seuil = alerte.seuilHaut;
            }
          }

          if (alerte.seuilBas && cours <= alerte.seuilBas) {
            if (!alerte.dernierCoursAlerte || alerte.dernierCoursAlerte > alerte.seuilBas) {
              alerteDeclenchee = true;
              typeAlerte = 'BASSE';
              seuil = alerte.seuilBas;
            }
          }

          if (alerteDeclenchee) {
            await sendNotification(uid, alerte.ticker, cours, seuil, typeAlerte);

            await db.ref(`users/${uid}/alertes/${alerteId}`).update({
              dernierCoursAlerte: cours,
              derniereAlerte: admin.database.ServerValue.TIMESTAMP
            });

            alertesEnvoyees++;
            console.log(`Alerte envoyee : ${alerte.ticker} ${typeAlerte} pour user ${uid}`);
          }
        }
      }

      console.log(`Verification terminee : ${alertesEnvoyees} alertes envoyees`);
    } catch (error) {
      console.error('Erreur checkAlerts:', error);
    }

    return null;
  });

// ========================================
// RECUPERATION DE COURS
// ========================================

async function fetchPrice(ticker) {
  /**
   * LIMITATION TECHNIQUE
   *
   * Google Finance n'a pas d'API publique officielle.
   * Source actuelle : Yahoo Finance (gratuit, endpoint non officiel).
   *
   * Alternatives possibles :
   * - Alpha Vantage (25 requetes/jour gratuit, puis payant)
   * - Financial Modeling Prep (250 requetes/jour gratuit, puis payant)
   * - IEX Cloud (50k requetes/mois gratuit)
   */
  if (USE_YAHOO_FINANCE) {
    return fetchYahooFinance(ticker);
  }

  throw new Error('Aucune source de donnees configuree');
}

async function fetchYahooFinance(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Yahoo Finance error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
    throw new Error('Donnees invalides Yahoo Finance');
  }

  const result = data.chart.result[0];
  const meta = result.meta;

  return {
    price: meta.regularMarketPrice || 0,
    changePct: meta.regularMarketChangePercent || 0,
    volume: meta.regularMarketVolume || 0,
    currency: meta.currency || 'USD'
  };
}

// Alternative : Alpha Vantage (necessite une cle API gratuite)
async function fetchAlphaVantage(ticker) {
  const apiKey = getConfig().alphavantage && getConfig().alphavantage.apikey
    ? getConfig().alphavantage.apikey
    : 'demo';
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data['Global Quote']) {
    const quote = data['Global Quote'];
    return {
      price: parseFloat(quote['05. price']),
      changePct: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume'], 10)
    };
  }

  throw new Error('Donnees invalides Alpha Vantage');
}

// ========================================
// NOTIFICATIONS PUSH
// ========================================

async function sendNotification(uid, ticker, cours, seuil, type) {
  try {
    const db = admin.database();
    const tokenSnapshot = await db.ref(`users/${uid}/fcmToken`).once('value');
    const token = tokenSnapshot.val();

    if (!token) {
      console.log(`Pas de token FCM pour user ${uid}`);
      return;
    }

    const message = {
      notification: {
        title: `Alerte ${type} : ${ticker}`,
        body: `Cours actuel : ${cours.toFixed(2)} EUR (seuil : ${seuil} EUR)`
      },
      data: {
        ticker: ticker,
        cours: cours.toString(),
        seuil: seuil.toString(),
        type: type,
        timestamp: Date.now().toString()
      },
      token: token
    };

    await admin.messaging().send(message);
    console.log(`Notification push envoyee a ${uid}`);
  } catch (error) {
    console.error(`Erreur sendNotification pour ${uid}:`, error.message);

    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      await admin.database().ref(`users/${uid}/fcmToken`).remove();
      console.log(`Token FCM invalide supprime pour ${uid}`);
    }
  }
}

// ========================================
// DONNEES HISTORIQUES POUR GRAPHIQUES
// ========================================

exports.getChartData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
  }

  const { ticker, period } = data;

  if (!ticker) {
    throw new functions.https.HttpsError('invalid-argument', 'Ticker requis');
  }

  try {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '1D':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '1Y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'MAX':
        startDate.setFullYear(startDate.getFullYear() - 10);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const start = Math.floor(startDate.getTime() / 1000);
    const end = Math.floor(endDate.getTime() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${start}&period2=${end}&interval=1d`;

    const response = await fetch(url);
    const json = await response.json();

    if (!json.chart || !json.chart.result) {
      throw new Error('Donnees historiques indisponibles');
    }

    const result = json.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    const chartData = timestamps.map((timestamp, i) => ({
      date: new Date(timestamp * 1000).toISOString(),
      close: quotes.close[i],
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      volume: quotes.volume[i]
    }));

    return {
      success: true,
      ticker: ticker,
      period: period,
      data: chartData
    };
  } catch (error) {
    console.error('Erreur getChartData:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ========================================
// RECHERCHE DE TICKERS (a completer avec une API externe)
// ========================================

exports.searchTickers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
  }

  // NOTE : necessite une API externe type Financial Modeling Prep ou IEX Cloud
  return {
    success: true,
    results: [],
    message: 'Recherche de tickers necessite configuration API externe'
  };
});

// ========================================
// INITIALISATION UTILISATEUR
// ========================================

exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  console.log(`Nouvel utilisateur : ${user.email}`);

  const db = admin.database();
  const uid = user.uid;

  await db.ref(`users/${uid}`).set({
    email: user.email,
    displayName: user.displayName || (user.email ? user.email.split('@')[0] : ''),
    createdAt: admin.database.ServerValue.TIMESTAMP,
    valeurs: {},
    alertes: {},
    config: {
      emailNotifications: true,
      pushNotifications: true
    }
  });

  console.log(`Structure creee pour ${user.email}`);
});
