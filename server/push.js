// Notifications push (Web Push / VAPID) : le serveur signe lui-meme ses
// messages, aucun service tiers. Voir DESIGN.md § Notifications push et
// BUSINESS_RULES.md § Alertes de seuil.
const webpush = require('web-push');
const db = require('./db');

// Point d'envoi isole dans un objet : les tests le remplacent pour ne faire
// aucun appel reseau reel vers Apple/Google.
const sender = {
  envoyer(subscription, payload, options) {
    return webpush.sendNotification(subscription, payload, options);
  }
};

let cles = null;

// Cles VAPID generees une seule fois puis conservees en base : regenerer
// invaliderait tous les abonnements existants.
function getCles() {
  if (cles) return cles;
  let row = db.prepare('SELECT public_key, private_key FROM push_config WHERE id = 1').get();
  if (!row) {
    const generees = webpush.generateVAPIDKeys();
    db.prepare('INSERT OR IGNORE INTO push_config (id, public_key, private_key) VALUES (1, ?, ?)').run(
      generees.publicKey,
      generees.privateKey
    );
    row = db.prepare('SELECT public_key, private_key FROM push_config WHERE id = 1').get();
  }
  cles = { publicKey: row.public_key, privateKey: row.private_key };
  return cles;
}

// Apple exige un contact valide (mailto: ou https:) dans le jeton VAPID.
function sujetVapid() {
  if (process.env.VAPID_SUBJECT) return process.env.VAPID_SUBJECT;
  const email = process.env.MAIL_FROM || process.env.SMTP_USER;
  return `mailto:${email && email.includes('@') ? email : 'admin@example.com'}`;
}

async function envoyerPushUtilisateur(userId, notification) {
  const abonnements = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId);
  if (abonnements.length === 0) return 0;

  const { publicKey, privateKey } = getCles();
  const payload = JSON.stringify({ url: '/', ...notification });
  const options = { vapidDetails: { subject: sujetVapid(), publicKey, privateKey }, TTL: 3600 };
  let envoyes = 0;

  for (const abo of abonnements) {
    try {
      await sender.envoyer({ endpoint: abo.endpoint, keys: { p256dh: abo.p256dh, auth: abo.auth } }, payload, options);
      envoyes++;
    } catch (error) {
      // 404/410 : abonnement revoque ou expire (app desinstallee, autorisation
      // retiree) - on le purge pour ne plus retenter indefiniment.
      if (error.statusCode === 404 || error.statusCode === 410) {
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(abo.id);
      } else {
        console.error(`Erreur push (abonnement ${abo.id}):`, error.message);
      }
    }
  }
  return envoyes;
}

module.exports = { getCles, envoyerPushUtilisateur, sender };
