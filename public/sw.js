/**
 * SERVICE WORKER - PORTFOLIO TRACKER
 */

const CACHE_NAME = 'portfolio-tracker-v7';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/styles.css',
  '/api.js',
  '/app.js',
  '/nouveautes.js',
  '/auth.js',
  '/manifest.json',
  '/vendor/alpine.min.js',
  '/vendor/sortable.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// NOTIFICATIONS PUSH (alertes de seuil, voir server/push.js). Le serveur
// envoie un JSON { title, body, tag, url } ; iOS exige qu'une notification
// soit affichee a chaque message push recu (sinon l'abonnement est revoque).
self.addEventListener('push', (event) => {
  let donnees = {};
  try {
    donnees = event.data ? event.data.json() : {};
  } catch (e) {
    donnees = { title: 'Portfolio', body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.registration.showNotification(donnees.title || 'Portfolio', {
      body: donnees.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: donnees.tag,
      data: { url: donnees.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((fenetres) => {
      for (const fenetre of fenetres) {
        if ('focus' in fenetre) return fenetre.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
