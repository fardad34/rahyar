'use strict';
const ROOT = new URL(self.registration.scope),
  ORIGIN = ROOT.origin;
const PREFIX = 'rahyar-sw-v1-',
  REV = '20261124-map-recovery';
const CACHES = {
  shell: PREFIX + 'shell-' + REV,
  data: PREFIX + 'data-' + REV,
  cdn: PREFIX + 'cdn-' + REV,
  tiles: PREFIX + 'tiles-' + REV,
};
const OPTIONAL = [
  'app-icon-512.png',
  'truck-position.svg',
  'trailer-icons/a-train.svg',
  'trailer-icons/c-train.svg',
  'trailer-icons/car-carrier.svg',
  'trailer-icons/chassis.svg',
  'trailer-icons/conestoga.svg',
  'trailer-icons/dry-van.svg',
  'trailer-icons/dump.svg',
  'trailer-icons/flatbed.svg',
  'trailer-icons/heated.svg',
  'trailer-icons/livestock.svg',
  'trailer-icons/log.svg',
  'trailer-icons/lowboy.svg',
  'trailer-icons/reefer.svg',
  'trailer-icons/step-deck.svg',
  'trailer-icons/super-b.svg',
  'trailer-icons/tanker.svg',
  'trailer-icons/walking-floor.svg',
  'vendor/fonts/font-6.ttf',
  'vendor/fonts/font-8.ttf',
  'vendor/fonts/font-7.ttf',
  'vendor/fonts/font-0.ttf',
  'vendor/fonts/font-5.ttf',
  'vendor/fonts/font-9.ttf',
  'vendor/fonts/font-4.ttf',
  'vendor/fonts/font-2.ttf',
  'vendor/fonts/font-1.ttf',
  'vendor/fonts/font-3.ttf',
  'audio/fa/arrive.mp3',
  'audio/fa/right.mp3',
  'audio/fa/reached.mp3',
  'audio/fa/enabled.mp3',
  'audio/fa/continue.mp3',
  'audio/fa/left.mp3',
  'audio/fa/exit.mp3',
  'audio/fa/speed.mp3',
  'audio/fa/roundabout.mp3',
];
function strategyFor(value, request = {}) {
  const url = new URL(value, ROOT);
  if (
    !/^https?:$/.test(url.protocol) ||
    (request.method && request.method !== 'GET') ||
    request.headers?.has('range')
  )
    return 'network';
  if (url.origin === ORIGIN) {
    if (
      url.pathname.endsWith('/sw.js') ||
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/.netlify/functions/') ||
      url.pathname.startsWith('/auth/')
    )
      return 'network';
    const home = url.pathname === ROOT.pathname || url.pathname === new URL('index.html', ROOT).pathname;
    if (request.mode === 'navigate') return home ? 'navigate' : 'network';
    if (home) return 'navigate';
    return url.pathname.endsWith('.json') ? 'data' : 'shell';
  }
  if (['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return 'cdn';
  if (
    /(^|\.)tile\.openstreetmap\.org$/.test(url.hostname) ||
    (url.hostname === 'services.arcgisonline.com' && url.pathname.includes('/tile/'))
  )
    return 'tiles';
  if (url.hostname === 'tiles.openfreemap.org')
    return /\.(pbf|mvt|png|jpe?g|webp)$/i.test(url.pathname) ? 'tiles' : 'tiles-fresh';
  return 'network';
}
async function save(cache, request, response, tiles = false) {
  if (response?.ok && response.type !== 'opaque' && (!request.method || request.method === 'GET')) {
    try {
      await cache.put(request, response.clone());
      if (tiles) {
        const keys = await cache.keys();
        for (const key of keys.slice(0, Math.max(0, keys.length - 600))) await cache.delete(key);
      }
    } catch { /* Storage/quota failure must not discard a usable network response. */ }
  }
  return response;
}
async function savedCopy(cache,request){try{return await cache.match(request,{ignoreVary:true});}catch{return undefined;}}

async function download(request, cache, tiles = false) {
  const url = new URL(request.url || request, ROOT);
  let response;
  if (url.origin !== ORIGIN) {
    try {
      response = await fetch(url.href, { mode: 'cors', credentials: 'omit' });
    } catch {
      return fetch(request);
    }
  } else response = await fetch(request);
  return save(cache, request, response, tiles);
}
async function networkFirst(request, cache, event, navigation = false, tiles = false) {
  let saved = await savedCopy(cache, request);
  if (!saved && navigation) saved = await savedCopy(cache, new URL('index.html', ROOT).href);
  const network = download(request, cache, tiles);
  event?.waitUntil(
    network.then(
      () => {},
      () => {},
    ),
  );
  if (!saved) return network;
  let timer;
  try {
    return await Promise.race([
      network.then((r) => (r.ok ? r : saved)).catch(() => saved),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(saved), 4000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function handle(request, event) {
  const strategy = strategyFor(request.url, request);
  const name = strategy === 'navigate' ? 'shell' : strategy.startsWith('tiles') ? 'tiles' : strategy;
  let cache;try{cache=await caches.open(CACHES[name]);}catch{return fetch(request);}
  if (strategy === 'navigate' || strategy === 'shell' || strategy === 'tiles-fresh')
    return networkFirst(request, cache, event, strategy === 'navigate', name === 'tiles');
  const saved = await savedCopy(cache, request);
  if (strategy === 'tiles') return saved || download(request, cache, true);
  const fresh = download(request, cache);
  event?.waitUntil(
    fresh.then(
      () => {},
      () => {},
    ),
  );
  return saved || fresh;
}
async function precache() {
  const cache = await caches.open(CACHES.shell),
    url = new URL('index.html', ROOT);
  const page = await fetch(url.href, { cache: 'reload' });
  if (!page.ok) throw Error('App precache failed');
  const html = await page.clone().text();
  if (!html.includes('app.js') || !/<html\b/i.test(html))
    throw Error('Hosting login or invalid application entry');
  const urls = new Set();
  for (const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    const u = new URL(match[1], url);
    u.hash = '';
    if (u.origin === ORIGIN && /^https?:$/.test(u.protocol) && strategyFor(u.href) !== 'network')
      urls.add(u.href);
  }
  // Required files are atomic for this install: any failure rejects install; old worker remains usable.
  await Promise.all(
    [...urls].map(async (u) => {
      const target = await caches.open(CACHES[strategyFor(u) === 'data' ? 'data' : 'shell']);
      await target.add(new Request(u, { cache: 'reload' }));
    }),
  );
  await cache.put(url.href, page.clone());
  await cache.put(ROOT.href, page.clone());
  await Promise.allSettled(
    OPTIONAL.map((u) => cache.add(new Request(new URL(u, ROOT), { cache: 'reload' }))),
  );
  await self.skipWaiting();
}
self.addEventListener('install', (event) => event.waitUntil(precache()));
self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith('rahyar-sw-') && !Object.values(CACHES).includes(name)) await caches.delete(name);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener('fetch', (event) => {
  if (strategyFor(event.request.url, event.request) !== 'network')
    event.respondWith(handle(event.request, event));
});
// Preserve the existing explicit, consent-based full app download workflow.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'PREPARE') return;
  event.waitUntil(
    (async () => {
      try {
        const response = await fetch(new URL('offline-manifest.json', ROOT), { cache: 'no-store' });
        if (!response.ok) throw Error('Manifest unavailable');
        const manifest = await response.json();
        for (const file of manifest.files) {
          const request = new Request(new URL(file, ROOT), { cache: 'reload' });
          const type = strategyFor(request.url, request);
          if (type === 'network') continue;
          const cache = await caches.open(CACHES[type === 'data' ? 'data' : 'shell']);
          await cache.add(request);
        }
        event.ports[0]?.postMessage({ ok: true });
      } catch {
        event.ports[0]?.postMessage({ ok: false });
      }
    })(),
  );
});
