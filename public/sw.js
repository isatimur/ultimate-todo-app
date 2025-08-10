importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

workbox.setConfig({ debug: false });

// Precache assets built by Next.js
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// Cache common assets and pages using a stale-while-revalidate strategy
workbox.routing.registerRoute(
  ({ request }) => ['style', 'script', 'worker', 'document', 'image', 'font'].includes(request.destination),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'asset-cache',
  })
);

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', {
      body: data.body || '',
      icon: '/logo.png',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
