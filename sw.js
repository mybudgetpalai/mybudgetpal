self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
// Network pass-through fetch handler (required for installability; no caching so deploys stay fresh)
self.addEventListener('fetch', function(event){});
