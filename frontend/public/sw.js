const CACHE_PREFIX = 'laporan-teknisi-static-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const SCOPE_URL = new URL(self.registration.scope);
const SCOPE_PATH = SCOPE_URL.pathname.endsWith('/')
  ? SCOPE_URL.pathname
  : `${SCOPE_URL.pathname}/`;
const INDEX_URL = new URL('index.html', SCOPE_URL).href;
const APP_SHELL = [
  SCOPE_URL.href,
  INDEX_URL,
  new URL('manifest.webmanifest', SCOPE_URL).href,
  new URL('icons/icon.svg', SCOPE_URL).href,
  new URL('icons/icon-192.png', SCOPE_URL).href,
  new URL('icons/icon-512.png', SCOPE_URL).href,
];
const APP_SHELL_URLS = new Set(APP_SHELL);
const APP_NAVIGATION_PATHS = new Set([SCOPE_PATH, `${SCOPE_PATH}index.html`]);
const CACHEABLE_ASSET_DESTINATIONS = new Set(['font', 'image', 'script', 'style']);

function isCacheableAppAsset(request, requestUrl) {
  if (APP_SHELL_URLS.has(requestUrl.href)) {
    return true;
  }

  return (
    requestUrl.pathname.startsWith(`${SCOPE_PATH}assets/`) &&
    CACHEABLE_ASSET_DESTINATIONS.has(request.destination)
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // POST laporan dan request API lain selalu langsung ke jaringan, tanpa cache/replay.
  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    if (!APP_NAVIGATION_PATHS.has(requestUrl.pathname)) {
      return;
    }

    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            const cacheKey = requestUrl.pathname === SCOPE_PATH ? SCOPE_URL.href : INDEX_URL;
            const cache = await caches.open(CACHE_NAME);
            await cache.put(cacheKey, copy);
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request, { ignoreSearch: true })
            .then((cached) => cached || caches.match(INDEX_URL)),
        ),
    );
    return;
  }

  if (!isCacheableAppAsset(request, requestUrl)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then(async (response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, copy);
        }
        return response;
      });
    }),
  );
});
