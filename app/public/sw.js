const CACHE_NAME = 'menuza-pwa-v1';

// Very basic offline fallback strategy
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Ignore non-HTTP(S) schemes (e.g., chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  // For API calls or Supabase, always go to network
  if (
    event.request.url.includes('/api/') || 
    event.request.url.includes('supabase.co')
  ) {
    return;
  }

  // Network-first approach with cache fallback for HTML pages and static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response and cache it
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If neither network nor cache has it, return a generic offline error
          return new Response("You are offline and this page isn't cached.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
