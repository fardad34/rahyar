'use strict';
const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
function context() {
  const storage = new Map(),
    c = {
      URL,
      window: {},
      document: { readyState: 'loading', addEventListener() {} },
      localStorage: { getItem: (k) => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) },
    };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync('dist/routing-settings.js', 'utf8'), c);
  return c;
}
test('routing endpoint requires explicit HTTPS/local selection and never accepts embedded credentials', () => {
  const c = context();
  assert.equal(c.validateRoutingEndpoint('https://router.example/'), 'https://router.example/route');
  for (const u of [
    'http://example.com/route',
    'https://u:p@example.com/route',
    'https://example.com/?key=secret',
    'javascript:alert(1)',
    'https://example.com/#key',
  ])
    assert.throws(() => c.validateRoutingEndpoint(u));
  assert.equal(c.window.RahyarRoutingSettings.getEndpoint(), 'https://valhalla1.openstreetmap.de/route');
});
test('custom routing sends actual profile directly and never silently retries the public gateway', async () => {
  const c = context(),
    calls = [];
  c.localStorage.setItem('rahyar.routingEndpoint', 'https://router.example/route');
  c.getJSON = async (url, options) => {
    calls.push({ url, options });
    throw Object.assign(Error('custom unavailable'), { status: 503 });
  };
  vm.runInContext(fs.readFileSync('dist/truck-routing.js', 'utf8'), c);
  const body = { costing: 'truck', costing_options: { truck: { height: 4.15, weight: 39.5 } } };
  await assert.rejects(c.vehicleRoutingRequest(body, 100), /custom unavailable/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://router.example/route');
  assert.equal(JSON.parse(calls[0].options.body).costing_options.truck.height, 4.15);
});
test('facility payload loads once on demand and retries after failure', async () => {
  let calls = 0;
  const data = JSON.parse(fs.readFileSync('dist/facility-catalog.json'));
  const c = {
    window: {},
    fetch: async () => {
      calls++;
      return { ok: true, json: async () => data };
    },
  };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync('dist/facility-catalog.js', 'utf8'), c);
  assert.equal(calls, 0);
  const [a, b] = await Promise.all([c.window.loadFacilityCatalog(), c.window.loadFacilityCatalog()]);
  assert.equal(calls, 1);
  assert.equal(a, b);
  assert.equal(a.facilities.length, data.facilities.length);
});
test('regional loading is deferred without coordinates and selects Europe without downloading North America', async () => {
  const urls = [],
    c = {
      window: {},
      lastPos: null,
      getJSON: async (u) => {
        urls.push(u);
        return JSON.parse(fs.readFileSync('dist/' + u.split('?')[0]));
      },
    };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync('dist/road-context.js', 'utf8'), c);
  await c.loadRegions();
  assert.equal(urls.length, 0);
  await c.loadRegions([2.35, 48.85]);
  assert.equal(urls.length, 1);
  assert.match(urls[0], /regions-eu/);
  assert.equal(c.regionAt([2.35, 48.85]).country, 'FR');
  await c.loadRegions([-79.38, 43.65]);
  assert.equal(urls.length, 2);
  assert.equal(c.regionAt([-79.38, 43.65]).country, 'CA');
});

test('city catalogs are cached per region while global destination search retains both catalogs',async()=>{const urls=[],c={getJSON:async name=>{urls.push(name);const na=name.includes('-na.');return {cities:[[na?1:2,na?'Toronto':'Paris',na?-79:2,na?43:48,na?'CA':'FR','',[],null]]};}};vm.createContext(c);const source=fs.readFileSync('dist/app.js','utf8');vm.runInContext(source.slice(source.indexOf('function loadCatalog(){'),source.indexOf('let lastMainFitRevision')),c);await c.loadCatalog([-79,43]);assert.equal(urls.length,1);assert.match(urls[0],/cities-na/);const all=await c.loadCatalog();assert.equal(urls.length,2);assert.equal(all.length,2);await c.loadCatalog([2,48]);assert.equal(urls.length,2);});
