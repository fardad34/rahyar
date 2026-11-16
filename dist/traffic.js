'use strict';

const trafficStorageKey = 'rahyar.tomtom-key';
let trafficKey = '';
let trafficEnabled = false;
let trafficLeafletLayer = null;
let trafficTimer;
let trafficRevision = 0;
let trafficTesting = false;
let trafficOpener = null;

const trafficUsageKey = 'rahyar.traffic-usage-v1';
const trafficLimitsKey = 'rahyar.traffic-limits-v1';
const trafficEmptyTile = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
let trafficLimits = {daily: 500, monthly: 10000};
let trafficUsage = {};
let trafficLastRefresh = 0;
let trafficStorageWarning = false;

let trafficMode = 'city';
let trafficSuspended = false;
let trafficCities = [];
let trafficCityLoading = false;
let trafficCityDetected = false;

function nearTrafficCity(coord, cities, boundaries, wasNear) {
  const radius = wasNear ? 12000 : 10000;
  for (const city of cities) {
    if (Math.abs(city.coord[1]-coord[1]) > .35 || Math.abs(city.coord[0]-coord[0]) > 1) continue;
    const distance = hav(city.coord,coord);
    if (distance > 35000) continue;
    const entries = boundaries.get(searchKey(city.en || city.name)) || [];
    for (const boundary of entries) {
      const [minX,minY,maxX,maxY] = boundary.bounds;
      if (coord[0] >= minX && coord[0] <= maxX && coord[1] >= minY && coord[1] <= maxY &&
          cityBoundaryContains(boundary.rings, coord) && cityBoundaryContains(boundary.rings, city.coord)) return true;
    }
    // Approximate the city and its entrances when detailed coverage is unavailable.
    if (distance <= radius) return true;
  }
  return false;
}

function setTrafficEnabled(enabled) {
  if (trafficEnabled === enabled) { renderTrafficControls(); return; }
  trafficEnabled = enabled;
  clearInterval(trafficTimer);
  if (enabled) {
    syncTrafficLayers();
    trafficTimer = setInterval(() => {
      if (!document.hidden && trafficEnabled) syncTrafficLayers(true);
    }, 300000);
  } else clearTrafficLayers();
  renderTrafficControls();
}
function applyTrafficMode() {
  if (trafficSuspended) return;
  let active = trafficMode === 'on';
  if (trafficMode === 'city') {
    const fresh = !isDemo && watch !== null && lastPos && Number.isFinite(lastAccuracyMeters) &&
      lastAccuracyMeters <= 100 && gpsTime && Date.now()-gpsTime < 25000;
    trafficCityDetected = !!fresh && nearTrafficCity(lastPos,trafficCities,activeCityBoundaries,trafficCityDetected);
    active = trafficCityDetected;
  }
  setTrafficEnabled(!!trafficKey && active);
  if (trafficKey) trafficStatus(trafficMode === 'city'
    ? trafficEnabled ? 'Auto traffic · In or near a city.' : 'Auto traffic paused · Outside cities or waiting for GPS.'
    : trafficEnabled ? 'Traffic manually on.' : 'Traffic manually off.');
}

function trafficUsageNow() {
  const month = new Date().toISOString().slice(0, 7);
  const day = new Date().toISOString().slice(0, 10);
  try {
    trafficUsage = JSON.parse(localStorage.getItem(trafficUsageKey)) || trafficUsage;
  } catch {}
  if (trafficUsage.month !== month) trafficUsage = {month, day, daily: 0, monthly: 0};
  if (trafficUsage.day !== day) { trafficUsage.day = day; trafficUsage.daily = 0; }
  if (!Number.isFinite(trafficUsage.daily) || !Number.isFinite(trafficUsage.monthly)) trafficUsage = {month,day,daily:0,monthly:0};
  return trafficUsage;
}
function renderTrafficUsage() {
  const usage = trafficUsageNow();
  $('traffic-usage').textContent = 'Request attempts · Today ' + usage.daily + ' / ' + trafficLimits.daily +
    ' · Month ' + usage.monthly + ' / ' + trafficLimits.monthly +
    (trafficStorageWarning ? ' · Counter resets when this page closes because storage is unavailable.' : '');
}
function allowTrafficRequest() {
  const usage = trafficUsageNow();
  if (usage.daily >= trafficLimits.daily || usage.monthly >= trafficLimits.monthly) {
    trafficEnabled = false;
    trafficSuspended = true;
    clearInterval(trafficTimer);
    setTimeout(() => { clearTrafficLayers(); renderTrafficControls(); }, 0);
    trafficStatus('Your traffic request limit has been reached in this browser. Traffic is paused.');
    renderTrafficUsage();
    return false;
  }
  usage.daily++;
  usage.monthly++;
  try { localStorage.setItem(trafficUsageKey, JSON.stringify(usage)); } catch { trafficStorageWarning = true; }
  renderTrafficUsage();
  return true;
}
function trafficTransformRequest(url) {
  if (url.startsWith('https://api.tomtom.com/maps/orbis/traffic/flow/raster/tile/')) {
    if (trafficMode === 'city') applyTrafficMode();
    return {url: trafficEnabled && !document.hidden && allowTrafficRequest() ? url : trafficEmptyTile};
  }
  return {url};
}

function trafficTileURL(key, night = false) {
  return 'https://api.tomtom.com/maps/orbis/traffic/flow/raster/tile/{z}/{x}/{y}?apiVersion=2&tileSize=256&style=' +
    (night ? 'dark' : 'light') + '&key=' + encodeURIComponent(key);
}

function trafficConnectionMessage(status) {
  if (status === 401 || status === 403) return 'TomTom refused this key. Check Traffic API access and the domain whitelist.';
  if (status === 429) return 'TomTom request limit reached. Try again later.';
  return 'Traffic could not load. Check your connection and try again.';
}

function trafficStatus(text) {
  $('traffic-settings-status').textContent = text;
  $('traffic-map-status').textContent = text;
}

function clearTrafficLayers() {
  if (navigationMap?.getLayer('traffic-flow')) navigationMap.removeLayer('traffic-flow');
  if (navigationMap?.getSource('traffic-flow')) navigationMap.removeSource('traffic-flow');
  if (trafficLeafletLayer && map) map.removeLayer(trafficLeafletLayer);
  trafficLeafletLayer = null;
}

function trafficFailed() {
  if (!trafficEnabled) return;
  trafficEnabled = false;
  trafficSuspended = true;
  clearInterval(trafficTimer);
  // Defer removal until the map has finished dispatching its tile event.
  setTimeout(() => {
    clearTrafficLayers();
    renderTrafficControls();
    trafficStatus('Traffic unavailable. Open TomTom setup to reconnect.');
  }, 0);
}

function renderTrafficControls() {
  $('map-traffic').setAttribute('aria-pressed', String(trafficEnabled));
  $('map-traffic').textContent = trafficMode === 'city' ? (trafficEnabled ? 'Traffic auto · On' : 'Traffic auto') : trafficEnabled ? 'Traffic on' : 'Traffic off';
  $('map-traffic').title = 'Tap to cycle Auto city, Always on, and Off';
  $('traffic-legend').hidden = !trafficEnabled;
}

function syncTrafficLayers(refresh = false) {
  if (!trafficEnabled || !trafficKey) return;
  if (refresh) clearTrafficLayers();
  trafficLastRefresh = Date.now();
  const tiles = trafficTileURL(trafficKey, navigationNight);
  if (navigationMap && navigationReady && !$('navigation-map').hidden) {
    if (trafficLeafletLayer && map) { map.removeLayer(trafficLeafletLayer); trafficLeafletLayer = null; }
    if (!navigationMap.getSource('traffic-flow')) {
      navigationMap.addSource('traffic-flow', {
        type: 'raster', tiles: [tiles], tileSize: 256, minzoom: 0, maxzoom: 22,
        attribution: 'Traffic © TomTom',
      });
      navigationMap.addLayer({
        id: 'traffic-flow', type: 'raster', source: 'traffic-flow',
        paint: {'raster-opacity': .85, 'raster-fade-duration': 0},
      }, navigationMap.getLayer('journey-outline') ? 'journey-outline' : undefined);
    }
  } else if (map && !trafficLeafletLayer && window.L) {
    if (!map.getPane('traffic')) {
      map.createPane('traffic');
      map.getPane('traffic').style.zIndex = '350';
      map.getPane('traffic').style.pointerEvents = 'none';
    }
    const TrafficTileLayer = L.TileLayer.extend({
      getTileUrl(coords) {
        if (!trafficEnabled || document.hidden || !allowTrafficRequest()) return trafficEmptyTile;
        return L.TileLayer.prototype.getTileUrl.call(this, coords);
      },
    });
    trafficLeafletLayer = new TrafficTileLayer(tiles, {
      pane: 'traffic', maxZoom: 22, maxNativeZoom: 22, opacity: .85,
      attribution: 'Traffic © TomTom',
    });
    trafficLeafletLayer.on('tileerror', trafficFailed);
    trafficLeafletLayer.addTo(map);
  }
}

function openTrafficSettings() {
  trafficOpener = document.activeElement;
  const dialog = $('traffic-settings');
  $('traffic-key').value = trafficKey;
  $('traffic-mode').value = trafficMode;
  $('traffic-daily-limit').value = trafficLimits.daily;
  $('traffic-monthly-limit').value = trafficLimits.monthly;
  renderTrafficUsage();
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}
function closeTrafficSettings() {
  const dialog = $('traffic-settings');
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
  $('traffic-key').value = '';
  trafficOpener?.focus({preventScroll:true});
}

function initTraffic() {
  try {
    const limits = JSON.parse(localStorage.getItem(trafficLimitsKey));
    if (Number.isInteger(limits?.daily) && limits.daily > 0 && limits.daily <= 200000 &&
        Number.isInteger(limits?.monthly) && limits.monthly > 0 && limits.monthly <= 1000000) trafficLimits = limits;
  } catch {}
  renderTrafficUsage();
  try {
    const mode = localStorage.getItem('rahyar.traffic-mode');
    if (['city','on','off'].includes(mode)) trafficMode=mode;
  } catch {}
  // Never automatically start manual traffic on a new page visit.
  if (trafficMode === 'on') trafficMode='city';
  loadCatalog().then(cities=>{trafficCities=cities;applyTrafficMode();}).catch(()=>{});
  setInterval(()=>{
    if (!document.hidden) applyTrafficMode();
    if (!trafficCities.length && !trafficCityLoading && !document.hidden) {
      trafficCityLoading=true;
      loadCatalog().then(cities=>{trafficCities=cities;applyTrafficMode();}).catch(()=>{}).finally(()=>{trafficCityLoading=false});
    }
  },10000);
  try {
    trafficKey = localStorage.getItem(trafficStorageKey) || sessionStorage.getItem(trafficStorageKey) || '';
    $('traffic-remember').checked = !!localStorage.getItem(trafficStorageKey);
  } catch {}
  for (const button of document.querySelectorAll('[data-traffic-settings]')) button.onclick = openTrafficSettings;
  $('traffic-close').onclick = closeTrafficSettings;
  $('traffic-settings').addEventListener('cancel', event => {
    event.preventDefault();
    closeTrafficSettings();
  });
  $('map-traffic').onclick = () => {
    if (!trafficKey) { openTrafficSettings(); return; }
    trafficMode = trafficMode === 'city' ? 'on' : trafficMode === 'on' ? 'off' : 'city';
    trafficSuspended = false;
    try { localStorage.setItem('rahyar.traffic-mode',trafficMode); } catch {}
    applyTrafficMode();
  };
  $('traffic-forget').onclick = () => {
    trafficRevision++;
    trafficEnabled = false;
    trafficKey = '';
    $('traffic-key').value = '';
    clearInterval(trafficTimer);
    clearTrafficLayers();
    try { localStorage.removeItem(trafficStorageKey); sessionStorage.removeItem(trafficStorageKey); } catch {}
    renderTrafficControls();
    trafficStatus('Key removed from this browser.');
  };
  $('traffic-form').onsubmit = async event => {
    event.preventDefault();
    if (trafficTesting || !$('traffic-form').reportValidity()) return;
    const daily = Number($('traffic-daily-limit').value);
    const monthly = Number($('traffic-monthly-limit').value);
    if (!Number.isInteger(daily) || !Number.isInteger(monthly) || daily < 1 || daily > 200000 || monthly < 1 || monthly > 1000000) {
      trafficStatus('Enter valid whole-number request limits.'); return;
    }
    trafficLimits = {daily, monthly};
    try { localStorage.setItem(trafficLimitsKey, JSON.stringify(trafficLimits)); } catch {}
    const key = $('traffic-key').value.trim();
    if (!allowTrafficRequest()) return;
    const revision = ++trafficRevision;
    trafficTesting = true;
    $('traffic-connect').disabled = true;
    trafficStatus('Checking TomTom connection…');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const center = lastPos || (navigationMap?.getCenter ? [navigationMap.getCenter().lng, navigationMap.getCenter().lat] : [-100, 50]);
      const zoom = 10;
      const latitude = Math.max(-85, Math.min(85, center[1])) * Math.PI / 180;
      const x = ((Math.floor((center[0] + 180) / 360 * 2 ** zoom) % 2 ** zoom) + 2 ** zoom) % 2 ** zoom;
      const y = Math.floor((1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2 * 2 ** zoom);
      const url = trafficTileURL(key).replace('{z}', zoom).replace('{x}', x).replace('{y}', y);
      const result = await fetch(url, {signal: controller.signal, cache: 'no-store', credentials: 'omit'});
      if (revision !== trafficRevision) return;
      if (!result.ok) throw new Error(trafficConnectionMessage(result.status));
      if (!result.headers.get('content-type')?.includes('image/')) throw new Error('TomTom did not return a traffic map tile.');
      await result.blob();
      if (revision !== trafficRevision) return;
      trafficKey = key;
      let stored = false;
      try {
        localStorage.removeItem(trafficStorageKey);
        sessionStorage.removeItem(trafficStorageKey);
        ($('traffic-remember').checked ? localStorage : sessionStorage).setItem(trafficStorageKey, key);
        stored = true;
      } catch {}
      trafficMode = $('traffic-mode').value;
      if (!['city','on','off'].includes(trafficMode)) trafficMode='city';
      try { localStorage.setItem('rahyar.traffic-mode',trafficMode); } catch {}
      trafficSuspended = false;
      $('traffic-key').value = '';
      applyTrafficMode();
      if (!stored) trafficStatus($('traffic-settings-status').textContent + ' Browser storage is unavailable; key is kept for this visit.');
    } catch (error) {
      if (revision === trafficRevision) trafficStatus(error.name === 'AbortError' ? 'Connection timed out. Try again.' :
        error.message.startsWith('TomTom') ? error.message : 'Could not connect to TomTom. Check your internet connection.');
    } finally {
      clearTimeout(timeout);
      trafficTesting = false;
      $('traffic-connect').disabled = false;
    }
  };
  if (navigationMap) {
    navigationMap.on('style.load', () => syncTrafficLayers(true));
    navigationMap.on('error', event => { if (event.sourceId === 'traffic-flow') trafficFailed(); });
    navigationMap.on('webglcontextlost', () => syncTrafficLayers(true));
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && trafficEnabled && Date.now() - trafficLastRefresh >= 300000) syncTrafficLayers(true);
  });
  renderTrafficControls();
}
