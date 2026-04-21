const CACHE_VERSION = 'menuza-pwa-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const ALL_CACHES = [STATIC_CACHE, IMAGE_CACHE];

// Static assets to precache on install (Next.js shell)
const PRECACHE_URLS = ['/', '/offline'];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Offline — MENUZA AI</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #fcf9f8;
      color: #1a1a1b;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 32px;
    }
    .card {
      max-width: 400px;
      background: white;
      padding: 48px;
      border-radius: 40px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.05);
    }
    .icon {
      font-size: 80px;
      margin-bottom: 24px;
      display: block;
    }
    h1 {
      font-size: 28px;
      font-weight: 900;
      margin: 0 0 12px;
      letter-spacing: -0.02em;
    }
    p {
      color: #5f5e5e;
      margin: 0 0 32px;
      line-height: 1.6;
      font-size: 15px;
    }
    button {
      background: #FF6B00;
      color: #fff;
      border: none;
      padding: 18px 36px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 15px;
      cursor: pointer;
      transition: transform 0.2s;
      box-shadow: 0 10px 20px rgba(255,107,0,0.2);
    }
    button:active {
      transform: scale(0.95);
    }
    .logo {
      margin-top: 32px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #FF6B00;
      font-weight: 800;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="icon">📡</span>
    <h1>Resting our signal...</h1>
    <p>It looks like you're offline. Don't worry, once you've visited this menu once, our smart caching keeps it ready for you! Check your connection to place new orders.</p>
    <button onclick="window.location.reload()">Refresh Page</button>
    <div class="logo">Powered by MENUZA AI</div>
  </div>
</body>
</html>`;

// ── Install: precache shell ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: purge old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // Network-only: API routes, Supabase, OpenRouter, Resend, PawaPay
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('openrouter.ai') ||
    url.hostname.includes('pawapay.io') ||
    url.hostname.includes('resend.com')
  ) {
    return;
  }

  // Cache-first: images (Supabase Storage public URLs + Unsplash)
  if (
    request.destination === 'image' ||
    url.hostname.includes('unsplash.com') ||
    (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/'))
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // Stale-while-revalidate: JS/CSS/fonts (Next.js static chunks)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/media/') ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Network-first with offline fallback: HTML navigation
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(OFFLINE_HTML, {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      })
  );
});
