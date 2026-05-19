/**
 * Workbox runtimeCaching rules for vite-plugin-pwa (generateSW).
 *
 * Design goals (Milestone 17):
 * - Cache static assets aggressively (CacheFirst).
 * - Short-lived NetworkFirst cache for safe API GET reads only.
 * - Never cache JWT mutation endpoints — offline writes use IndexedDB + /pwa/sync.
 */

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;
const FIVE_MINUTES_SECONDS = 60 * 5;

/** API path segments that must never be served from runtime cache (even for GET). */
const API_EXCLUDED_PATH_SEGMENTS = [
  'pwa/sync',
  'patrol-routes',
  'auth/login',
  'auth/logout',
  'login'
];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build-time RegExp for safe API GET URLs (no closure — workbox inlines RegExp into sw.js).
 * @param {string} apiBaseUrl e.g. http://localhost:8000/api
 */
function buildApiGetUrlPattern(apiBaseUrl) {
  const apiUrl = new URL(apiBaseUrl);
  const originEsc = escapeRegExp(apiUrl.origin);
  const basePath = apiUrl.pathname.replace(/\/$/, '');
  const baseEsc = escapeRegExp(basePath);
  const excluded = API_EXCLUDED_PATH_SEGMENTS.map(escapeRegExp).join('|');
  return new RegExp(`^${originEsc}${baseEsc}/(?!(${excluded})(?:/|$))`, 'i');
}

/**
 * @param {string} apiBaseUrl e.g. http://localhost:8000/api
 */
export function buildRuntimeCaching(apiBaseUrl) {
  return [
    {
      // Hashed bundles + public icons/fonts/images (same origin as the SPA).
      urlPattern: /\.(?:js|css|woff2?|ttf|eot|png|gif|jpg|jpeg|svg|ico|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: THIRTY_DAYS_SECONDS
        }
      }
    },
    {
      /**
       * Safe API GET reads only (NetworkFirst, 5 min TTL, HTTP 200).
       * POST/PUT/PATCH/DELETE are not registered — mutations must hit the network
       * or the app's Dexie sync_queue; caching them would return stale JWT responses
       * and break patrol offline sync integrity.
       */
      urlPattern: buildApiGetUrlPattern(apiBaseUrl),
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'api-get-cache',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: FIVE_MINUTES_SECONDS
        },
        cacheableResponse: {
          statuses: [200]
        }
      }
    }
  ];
}

/**
 * Navigation requests that must not receive the SPA index.html fallback.
 * @param {string} apiBaseUrl
 */
export function buildNavigateFallbackDenylist(apiBaseUrl) {
  const denylist = [
    /\.[^/]+$/,
    /^\/api\//
  ];

  try {
    const apiUrl = new URL(apiBaseUrl);
    const apiBasePath = apiUrl.pathname.replace(/\/$/, '');
    if (apiBasePath && apiBasePath !== '/') {
      denylist.push(new RegExp(`^${escapeRegExp(apiBasePath)}(?:/|$)`));
    }
  } catch {
    /* invalid VITE_API_BASE_URL at build time — skip API denylist */
  }

  return denylist;
}

/**
 * Restrict navigateFallback to SPA routes when Vite `base` is not `/`.
 * @param {string} appBaseName VITE_APP_BASE_NAME
 */
export function buildNavigateFallbackAllowlist(appBaseName) {
  const base = (appBaseName || '/').replace(/\/$/, '') || '';
  if (!base) {
    return undefined;
  }
  const escaped = escapeRegExp(base);
  return [new RegExp(`^${escaped}/`), new RegExp(`^${escaped}$`)];
}
