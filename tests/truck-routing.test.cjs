const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync('dist/truck-routing.js', 'utf8');

test('truck routes and waypoints always send the loaded profile; failures never request a car route', async () => {
  const calls = [];
  const ctx = vm.createContext({
    location: {hostname: 'rahyar.example'},
    getJSON: async (url, options) => {
      const request = new URL(url);
      calls.push({host: request.hostname, body: JSON.parse(request.searchParams.get('json')), options});
      return {code: 'NoRoute'};
    },
  });
  vm.runInContext(script, ctx);
  const points = [[-121, 49], [-123, 49]];
  await assert.rejects(ctx.requestRoadRoutes(points), /profile is required/);
  assert.equal(calls.length, 0);

  const profile = {height: 4.15, width: 2.6, length: 22, weight: 39, axle_load: 9, axle_count: 5, hazmat: true};
  vm.runInContext('activeTruckProfile = ' + JSON.stringify(profile), ctx);
  assert.equal((await ctx.requestRoadRoutes(points)).length, 0);
  assert.equal((await ctx.requestRoadRoutes([points[0], [-122, 49], points[1]])).length, 0);
  assert.equal(calls.length, 2);
  for (const {host, body, options} of calls) {
    assert.equal(host, 'valhalla1.openstreetmap.de');
    assert.equal(body.costing, 'truck');
    assert.equal(body.costing_options.truck.hgv_no_access_penalty, 43200);
    for (const [key, value] of Object.entries(profile)) assert.equal(body.costing_options.truck[key], value);
    assert.equal(options.headers['X-Client-Id'], 'rahyar.example');
  }
  assert.deepEqual(calls[0].body.locations, [{lon: -121, lat: 49}, {lon: -123, lat: 49}]);
  assert.equal(calls[0].body.alternates, 2);
  assert.equal(calls[1].body.alternates, 0);
});

test('a saved trailer preset clears the review gate and resumes the requested trip', () => {
  const values = {height: 4.15, width: 2.6, length: 23, weight: 39.5, axle_load: 9, axle_count: 5};
  const elements = Object.fromEntries(Object.entries(values).map(([field, value]) =>
    ['truck-' + field, {valueAsNumber: value, validity: {valid: true}}]
  ));
  elements['truck-axle_load'].setCustomValidity = () => {};
  elements['truck-hazmat'] = {checked: false};
  elements['truck-profile'] = {addEventListener() {},querySelector: () => ({focus() {}})};
  elements['truck-save'] = {focus() {}, scrollIntoView() {}};
  elements['truck-save-status'] = {};
  elements.message = {};
  const saved = new Map();
  let starts = 0;
  const ctx = vm.createContext({
    $: id => elements[id],
    dest: {name: 'Winnipeg'},
    openTruckSettings: () => { elements['truck-profile'].open = true; },
    closeAppDialog() {},
    message: text => { elements.message.textContent = text; },
    start: () => { starts++; },
    localStorage: {setItem: (key, value) => saved.set(key, JSON.parse(value))},
  });
  vm.runInContext('let truckProfileNeedsReview = true, trailerPreset = "reefer";', ctx);
  vm.runInContext(script, ctx);
  ctx.initTruckProfileControls();
  ctx.reviewTruckProfileBeforeStart();
  assert.equal(elements['truck-save'].textContent, 'Save & start trip');
  elements['truck-save'].onclick();
  assert.equal(starts, 1);
  assert.equal(vm.runInContext('truckProfileNeedsReview', ctx), false);
  assert.equal(elements.message.textContent, '');
  assert.equal(elements['truck-profile'].open, false);
  assert.deepEqual(saved.get('rahyar-truck-profile-v1'), {...values, hazmat: false, trailer: 'reefer'});
  elements['truck-save'].onclick();
  assert.equal(starts, 1);
});

test('Canadian trips reject US alternates and use truck through-points if all direct routes cross the border', async () => {
  const start = [-114.0719, 51.0447];
  const end = [-97.138, 49.895];
  const route = coordinates => ({
    distance: 1300000, duration: 50000, geometry: {coordinates}, legs: [{steps: [{}]}],
  });
  const acrossBorder = route([start, [-110, 48.5], end]);
  const domestic = route([start, [-104, 50.4], end]);
  const calls = [];
  let allowDomestic = true;
  const ctx = vm.createContext({
    location: {hostname: 'rahyar.example'},
    regionAt: ([,lat]) => ({country: lat >= 49 ? 'CA' : 'US'}),
    hav: (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1])*80000,
    getJSON: async url => {
      const body = JSON.parse(new URL(url).searchParams.get('json'));
      calls.push(body);
      return {code:'Ok', routes: body.locations.length > 2 && allowDomestic ? [acrossBorder, domestic] : [acrossBorder]};
    },
  });
  vm.runInContext(script, ctx);
  vm.runInContext('activeTruckProfile = {height:4.15, weight:39.5}', ctx);

  const routes = await ctx.requestRoadRoutes([start,end], 2, undefined, 85, true);
  assert.deepEqual(Array.from(routes), [domestic]);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].locations[0].heading, 85);
  assert.equal(calls[1].locations[2].type, 'through');
  assert.equal(calls[1].costing, 'truck');
  assert.equal(calls[1].costing_options.truck.country_crossing_penalty, 43200);
  assert.equal(calls[1].costing_options.truck.weight, 39.5);

  allowDomestic = false;
  await assert.rejects(ctx.requestRoadRoutes([start,end], 2, undefined, undefined, true), {code:'CanadaOnlyRouteUnavailable'});
  await assert.rejects(ctx.requestRoadRoutes([start,[-110,48.5],end], 0, undefined, undefined, true), {code:'CanadaOnlyWaypoint'});
  assert.deepEqual(Array.from(await ctx.requestRoadRoutes([start,[-110,48.5]])), [acrossBorder]);
  assert.equal(calls.at(-1).costing_options.truck.country_crossing_penalty, undefined);
});

test('passenger requests use automobile costing without truck restrictions or a truck profile', async () => {
  const calls = [];
  const ctx = vm.createContext({
    location: {hostname: 'rahyar.example'},
    getJSON: async url => {
      calls.push(JSON.parse(new URL(url).searchParams.get('json')));
      return {code:'NoRoute'};
    },
  });
  vm.runInContext(script, ctx);
  vm.runInContext("activeRouteVehicle = 'auto'; activeTruckProfile = null", ctx);
  await ctx.requestRoadRoutes([[-114,51],[-113,52]]);
  assert.equal(calls[0].costing, 'auto');
  assert.deepEqual(calls[0].costing_options, {auto:{}});
});
