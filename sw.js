/* TwoPockets service worker v2 — pass-through, purges ALL legacy caches on activate. */
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
// Network pass-through fetch handler (required for installability; no caching so deploys stay fresh)
self.addEventListener('fetch', function(event){});
