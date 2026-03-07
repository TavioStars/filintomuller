const CACHE_NAME = 'filinto-muller-v3';
const OFFLINE_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/notification-badge.png',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;
  if (event.request.url.includes('supabase.co')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        if (response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.match(event.request);
      })
  );
});

self.addEventListener('push', function (event) {
  console.log('[SW] Push received:', event);
  var data = {};
  if (event.data) {
    try { data = event.data.json(); }
    catch (e) {
      try { data = { title: event.data.text(), body: '' }; }
      catch (e2) { data = { title: 'Nova notificação', body: '' }; }
    }
  } else {
    data = { title: 'Nova notificação', body: '' };
  }

  var title = data.title || 'Nova notificação';
  var options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/notification-badge.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
    tag: 'filinto-notification-' + Date.now(),
    renotify: true,
  };

  if (data.data && data.data.banner_image) {
    options.image = data.data.banner_image;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var notificationData = event.notification.data;
  var url = '/notifications';
  if (notificationData && notificationData.notification_id) {
    url = '/notifications/' + notificationData.notification_id;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
