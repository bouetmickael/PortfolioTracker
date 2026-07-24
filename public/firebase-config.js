/**
 * CONFIGURATION FIREBASE - PORTFOLIO TRACKER
 *
 * La cle apiKey n'est pas un secret au sens strict (elle identifie le
 * projet, pas un utilisateur), mais il est recommande de la restreindre
 * dans Google Cloud Console (APIs & Services > Identifiants) aux domaines
 * autorises (portefolio-c442d.web.app, portefolio-c442d.firebaseapp.com).
 */

const firebaseConfig = {
  apiKey: "AIzaSyBsmMfrHy7GtWht5PRweOsFNJqmFhQ3mdw",
  authDomain: "portefolio-c442d.firebaseapp.com",
  databaseURL: "https://portefolio-c442d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "portefolio-c442d",
  storageBucket: "portefolio-c442d.firebasestorage.app",
  messagingSenderId: "372369689496",
  appId: "1:372369689496:web:5e2bfa6a7e71e1d5d439ed"
};

// Cle VAPID publique pour les notifications push (Cloud Messaging)
// A renseigner depuis : Console Firebase > Parametres du projet > Cloud Messaging > Web Push certificates
const vapidKey = "REMPLACER_PAR_VOTRE_CLE_VAPID";

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();
const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;

if (messaging) {
  messaging.usePublicVapidKey(vapidKey);
}
