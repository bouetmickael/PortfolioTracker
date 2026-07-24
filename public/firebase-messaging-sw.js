/**
 * FIREBASE MESSAGING SERVICE WORKER
 */

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBsmMfrHy7GtWht5PRweOsFNJqmFhQ3mdw",
  authDomain: "portefolio-c442d.firebaseapp.com",
  projectId: "portefolio-c442d",
  storageBucket: "portefolio-c442d.firebasestorage.app",
  messagingSenderId: "372369689496",
  appId: "1:372369689496:web:5e2bfa6a7e71e1d5d439ed"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Message recu en arriere-plan:', payload);

  const { title, body } = payload.notification;

  self.registration.showNotification(title, {
    body: body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png'
  });
});
