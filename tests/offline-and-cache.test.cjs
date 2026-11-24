'use strict';
const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
function worker() {
  const events = {},
    c = {
      URL,
      Request,
      Response,
      setTimeout,
      clearTimeout,
      fetch() {
        throw Error('not configured');
      },
      self: {
        registration: { scope: 'https://rahyar.test/' },
        addEventListener: (n, f) => (events[n] = f),
        skipWaiting() {},
        clients: { claim() {} },
      },
    };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync('dist/sw.js', 'utf8'), c);
  return { c, events, strategy: (url, request = {}) => c.strategyFor(url, request) };
}
test('service worker strategy covers navigation, shell/data, CDN and bounded tile hosts only', () => {
  const { strategy: s } = worker();
  const cases = [
    ['https://rahyar.test/', { mode: 'navigate' }, 'navigate'],
    ['https://rahyar.test/index.html?v=3', {}, 'navigate'],
    ['https://rahyar.test/private-trip', { mode: 'navigate' }, 'network'],
    ['https://rahyar.test/app.js?v=4', {}, 'shell'],
    ['https://rahyar.test/data.json?v=3', {}, 'data'],
    ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', {}, 'cdn'],
    ['https://fonts.googleapis.com/css2', {}, 'cdn'],
    ['https://fonts.gstatic.com/a.woff2', {}, 'cdn'],
    ['https://a.tile.openstreetmap.org/1/1/1.png', {}, 'tiles'],
    ['https://services.arcgisonline.com/ArcGIS/rest/World/tile/2/3/4', {}, 'tiles'],
    ['https://tiles.openfreemap.org/planet/1/2/3.pbf', {}, 'tiles'],
    ['https://tiles.openfreemap.org/planet/1/2/3.webp', {}, 'tiles'],
    ['https://tiles.openfreemap.org/styles/liberty', {}, 'tiles-fresh'],
    ['https://rahyar.test/sw.js?v=4', {}, 'network'],
    ['data:text/plain,hi', {}, 'network'],
    ['https://rahyar.test/audio/fa/left.mp3', { headers: new Headers({ Range: 'bytes=0-100' }) }, 'network'],
    ['https://rahyar.test/api/shared-trip?id=1', {}, 'network'],
    ['https://rahyar.test/a.json', { method: 'POST' }, 'network'],
  ];
  for (const [u, r, want] of cases) assert.equal(s(u, r), want, u);
  for (const host of [
    'valhalla1.openstreetmap.de',
    'photon.komoot.io',
    'overpass-api.de',
    'geocode.arcgis.com',
    'api.tomtom.com',
    'api.open-meteo.com',
    'untrusted.test',
  ])
    assert.equal(s('https://' + host + '/a.json'), 'network');
});
test('all same-origin HTML assets and explicit service-worker assets exist; offline bootstrap precedes app', () => {
  const html = fs.readFileSync('dist/index.html', 'utf8');
  for (const m of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) {
    const u = new URL(m[1], 'https://rahyar.test/');
    if (u.origin === 'https://rahyar.test') {
      const path = u.pathname === '/' ? '/index.html' : decodeURIComponent(u.pathname);
      assert(fs.existsSync('dist' + path), path);
    }
  }
  const sw = fs.readFileSync('dist/sw.js', 'utf8');
  for (const m of sw.matchAll(
    /['"]((?:trailer-icons\/[^'"\s]+|app-icon-512\.png|truck-position\.svg|index\.html))['"]/g,
  ))
    assert(fs.existsSync('dist/' + m[1]), m[1]);
  assert(html.indexOf('offline.js?v=') < html.indexOf('src="app.js'));
});
function offline(protocol = 'https:', hostname = 'rahyar.test', online = true, leaflet = true) {
  const events = {},
    timers = [],
    nodes = [],
    registered = [];
  const c = {
    window: { addEventListener: (n, f) => (events[n] = f) },
    navigator: {
      onLine: online,
      serviceWorker: {
        register: (u) => {
          registered.push(u);
          return Promise.resolve();
        },
      },
    },
    location: { protocol, hostname },
    document: {
      createElement: () => ({ style: {}, setAttribute() {} }),
      body: { append: (n) => nodes.push(n) },
    },
    setTimeout: (f) => {
      timers.push(f);
      return timers.length;
    },
    clearTimeout() {},
  };
  if (leaflet) c.L = {};
  vm.createContext(c);
  vm.runInContext(fs.readFileSync('dist/offline.js', 'utf8'), c);
  events.load();
  return { events, nodes, registered, timers };
}
test('offline bootstrap registers only secure/loopback origins and reports actual connectivity', () => {
  for (const [p, h, want] of [
    ['https:', 'x.test', 1],
    ['http:', 'localhost', 1],
    ['http:', '127.0.0.1', 1],
    ['http:', 'x.test', 0],
    ['file:', '', 0],
  ])
    assert.equal(offline(p, h).registered.length, want);
  const f = offline('https:', 'x.test', false);
  assert.match(f.nodes[0].textContent, /No internet connection/);
  f.events.online();
  assert.equal(f.nodes[0].textContent, 'Back online.');
  f.timers.at(-1)();
  assert.equal(f.nodes[0].hidden, true);
  f.events.offline();
  assert.equal(f.nodes[0].hidden, false);
  assert.match(offline('https:', 'x.test', true, false).nodes[0].textContent, /map could not load/);
});
test('the nine whitespace-only cleanup files retain their original non-whitespace hashes', () => {
  const crypto = require('node:crypto'),
    proof = JSON.parse(fs.readFileSync('docs/stages/stage1-whitespace-proof.json'));
  for (const [p, record] of Object.entries(proof))
    assert.equal(
      crypto
        .createHash('sha256')
        .update(
          (record.verifiedAtCommit
            ? require('node:child_process').execFileSync('git', ['show', record.verifiedAtCommit + ':' + p], {
                encoding: 'utf8',
              })
            : fs.readFileSync(p, 'utf8')
          ).replace(/\s/g, ''),
        )
        .digest('hex'),
      record.nonWhitespaceSha256,
      p,
    );
});
function memoryCache() {
  const records = new Map(),
    key = (r) => r.url || String(r);
  return {
    records,
    async put(r, v) {
      records.set(key(r), v);
    },
    async match(r) {
      return records.get(key(r))?.clone();
    },
    async keys() {
      return [...records.keys()];
    },
    async delete(r) {
      return records.delete(key(r));
    },
  };
}
test('shell timeout keeps late network alive to update cache; cache never stores failed responses', async () => {
  const { c } = worker(),
    cache = memoryCache(),
    request = new Request('https://rahyar.test/app.js');
  await cache.put(request, new Response('saved'));
  let resolve;
  c.fetch = () => new Promise((r) => (resolve = r));
  c.setTimeout = (f) => {
    queueMicrotask(f);
    return 1;
  };
  c.clearTimeout = () => {};
  const tasks = [];
  const response = await c.networkFirst(request, cache, { waitUntil: (p) => tasks.push(p) });
  assert.equal(await response.text(), 'saved');
  resolve(new Response('fresh'));
  await Promise.all(tasks);
  assert.equal(await (await cache.match(request)).text(), 'fresh');
  await c.save(cache, new Request('https://rahyar.test/fail'), new Response('', { status: 401 }));
  assert.equal(cache.records.size, 1);
});
test('CORS failure returns ordinary uncached fetch and visited tile cache stays bounded', async () => {
  const { c } = worker(),
    cache = memoryCache();
  let calls = 0;
  c.fetch = async (_r, options) => {
    calls++;
    if (options?.mode === 'cors') throw Error('CORS');
    return new Response('normal');
  };
  assert.equal(
    await (await c.download(new Request('https://a.tile.openstreetmap.org/1.png'), cache, true)).text(),
    'normal',
  );
  assert.equal(calls, 2);
  assert.equal(cache.records.size, 0);
  for (let i = 0; i < 601; i++)
    await c.save(
      cache,
      new Request('https://a.tile.openstreetmap.org/' + i + '.png'),
      new Response('tile'),
      true,
    );
  assert.equal(cache.records.size, 600);
  assert.equal(await cache.match('https://a.tile.openstreetmap.org/0.png'), undefined);
});
