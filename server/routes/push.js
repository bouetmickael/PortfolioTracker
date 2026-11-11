const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const push = require('../push');

const router = express.Router();

router.use(requireAuth);

// Cle publique VAPID : necessaire au navigateur pour creer l'abonnement.
router.get('/cle', (req, res) => {
  res.json({ publicKey: push.getCles().publicKey });
});

router.post(
  '/abonnement',
  asyncHandler(async (req, res) => {
    const { endpoint, keys } = req.body || {};
    if (typeof endpoint !== 'string' || !endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Abonnement invalide' });
    }

    // Upsert sur l'endpoint : un meme appareil reconnecte sous un autre
    // compte change simplement de proprietaire.
    db.prepare(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, cree_le)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`
    ).run(req.session.userId, endpoint, keys.p256dh, keys.auth, Date.now());

    // Notification de confirmation : verifie toute la chaine de bout en bout.
    await push.envoyerPushUtilisateur(req.session.userId, {
      title: 'Notifications activees',
      body: 'Vous recevrez ici vos alertes de seuil.',
      tag: 'confirmation'
    });

    res.status(201).json({ success: true });
  })
);

router.delete('/abonnement', (req, res) => {
  const { endpoint } = req.body || {};
  if (typeof endpoint !== 'string' || !endpoint) {
    return res.status(400).json({ error: 'Endpoint requis' });
  }
  db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').run(req.session.userId, endpoint);
  res.json({ success: true });
});

module.exports = router;
