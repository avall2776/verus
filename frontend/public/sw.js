// Service Worker do Vallor Omnichannel (PWA)
const CACHE_NAME = 'vallor-pwa-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Manipulador de clique em notificações na tela de bloqueio e drawer do celular
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url || '/vallor/inbox';
  const targetUrl = rawUrl.startsWith('http')
    ? rawUrl
    : (rawUrl.startsWith('/vallor') ? rawUrl : `/vallor${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Se já existir uma aba do Vallor aberta, navega e foca nela
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // 2. Se não houver janela aberta, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Suporte a Web Push Remoto (quando disparado do servidor)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const origin = self.location.origin || '';
  const defaultIcon = origin ? `${origin}/vallor/icon-192x192.png` : '/vallor/icon-192x192.png';
  const icon = data.icon ? (data.icon.startsWith('http') ? data.icon : `${origin}${data.icon.startsWith('/') ? '' : '/'}${data.icon}`) : defaultIcon;
  const badge = data.badge ? (data.badge.startsWith('http') ? data.badge : `${origin}${data.badge.startsWith('/') ? '' : '/'}${data.badge}`) : defaultIcon;

  const title = data.title || 'Novo atendimento na fila · Atendimento';
  const options = {
    body: data.body || 'Você recebeu uma nova mensagem ou atendimento na fila.',
    icon,
    badge,
    tag: data.tag || `vallor_${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/vallor/inbox',
      dateOfArrival: Date.now()
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET ou de WebSockets / SSE / API backend
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) {
    return;
  }

  // Network-first com fallback seguro para Response
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'text/plain' })
      });
    })
  );
});
