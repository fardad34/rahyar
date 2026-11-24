'use strict';
let locatingPreview=false;
function previewCurrentLocation(){
  if(!navigator.geolocation){updateGpsStatus('Location unavailable in this browser. You can still search for a destination.',true);return}
  if(locatingPreview||watch!==null)return;locatingPreview=true;const token=session;
  $('current-location').textContent='Locating you…';
  if(!coords.length)$('map-status').textContent='Finding your location…';
  updateGpsStatus('Finding your current location. Allow Location when prompted.');
  navigator.geolocation.getCurrentPosition(async p=>{
    locatingPreview=false;if(token!==session||isDemo||watch!==null)return;
    lastPos=[p.coords.longitude,p.coords.latitude];gpsTime=Date.now();lastAccuracyMeters=p.coords.accuracy;lastSpeedMps=null;updateGpsStatus('Current location ready · Accuracy '+integer(p.coords.accuracy)+' m');$('status').textContent='Location ready · GPS not tracking';$('current-location').textContent='Current location ready';if(!coords.length)$('map-status').textContent='Your location';drawPosition(lastPos);if(map&&!mainMapBrowsing)map.setView([lastPos[1],lastPos[0]],14,{animate:false});
    try{await loadRegions();if(token!==session||isDemo)return;updateRegionPanel()}catch{}
    try{const catalog=await loadCatalog(lastPos);if(token!==session||isDemo)return;let nearest=null,distance=Infinity;for(const c of catalog){const d=hav(lastPos,c.coord);if(d<distance){distance=d;nearest=c}}if(nearest&&distance<30000)$('current-location').textContent='Near '+nearest.en+(nearest.country==='CA'&&provinceNames[nearest.region]?', '+provinceNames[nearest.region]:'')}catch{}
  },e=>{locatingPreview=false;if(token!==session||isDemo)return;$('current-location').textContent='Your location is not available';if(!coords.length)$('map-status').textContent=e.code===1?'Allow Location in site settings, then tap My location.':'Location unavailable. Tap My location to retry.';gpsError(e)},{enableHighAccuracy:true,maximumAge:15000,timeout:20000});
}
function initStartScreen(){
  isDemo=false;dest=null;coords=[];targets=[];cityTargets=[];roadFacilities=[];routeLength=0;progress=0;lastPos=null;travelDistances=[0];travelSeconds=[0];
  $('destination').value='';
  $('start').hidden=true;
  $('trip-actions').hidden=true;
  $('mode').textContent='Plan your trip';
  $('status').textContent='Waiting for your location';
  $('hero-state').textContent='Choose a destination';
  $('update').textContent='No live trip yet';
  $('route-label').textContent='Your location → Choose a destination';
  $('route-type').textContent='No route selected';
  $('map-status').textContent='Your current location will appear here';
  $('discovery-status').textContent='Select a destination to see cities along your route.';
  $('city-count').textContent='No route selected';
  $('total').textContent='—';
  $('retry-cities').hidden=true;
  $('retry-route').hidden=true;
  $('retry-weather').hidden=true;
  $('weather-status').textContent='Arrival forecasts load after you start a trip.';
  $('use-location').onclick=previewCurrentLocation;message('');updateRegionPanel();loadRegions().then(updateRegionPanel).catch(()=>{});restoreLastDestination();
  previewCurrentLocation();
}

function openAppDialog(dialog) {
  if (dialog.open) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function closeAppDialog(dialog) {
  if (!dialog.open) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

function openTruckSettings() {
  $('truck-profile').open = true;
  openAppDialog($('app-settings'));
}

const appThemeKey = 'rahyar.app-theme';

function applyAppTheme(theme) {
  const picker = $('app-theme');
  const valid = [...picker.options].some(option => option.value === theme);
  picker.value = valid ? theme : 'original';
  document.documentElement.dataset.theme = picker.value;
}

function initAppSettings() {
  let storedTheme;
  try { storedTheme = localStorage.getItem(appThemeKey); } catch {}
  applyAppTheme(storedTheme);
  $('app-theme').onchange = () => {
    applyAppTheme($('app-theme').value);
    try { localStorage.setItem(appThemeKey, $('app-theme').value); } catch {}
  };
  const settings = $('app-settings');
  const account = $('account-dialog');
  $('open-settings').onclick = () => openAppDialog(settings);
  $('close-settings').onclick = () => closeAppDialog(settings);
  $('open-account').onclick = () => openAppDialog(account);
  $('close-account').onclick = () => closeAppDialog(account);

  for (const button of settings.querySelectorAll('[data-map-control]')) {
    const control = $(button.dataset.mapControl);
    const sync = () => {
      button.textContent = button.dataset.mapControl === 'map-dimension' ? '3D map' : control.textContent;
      button.disabled = control.disabled;
      button.setAttribute('aria-pressed', control.getAttribute('aria-pressed') || 'false');
    };
    sync();
    button.onclick = () => { control.click(); sync(); };
    if (typeof MutationObserver === 'function') {
      new MutationObserver(sync).observe(control, {attributes:true, attributeFilter:['aria-pressed','disabled'], childList:true});
    }
  }
}


function initVehicleChoice() {
  const picker = $('route-vehicle');
  const key = 'rahyar.route-vehicle';
  try { picker.value = localStorage.getItem(key) === 'auto' ? 'auto' : 'truck'; } catch {}
  const update = () => {
    document.body.classList.toggle('car-route', picker.value === 'auto');
    updateRouteGuidance();
  };
  picker.onchange = () => {
    clearTruckProfileStart();
    update();
    try { localStorage.setItem(key, picker.value); } catch {}
  };
  update();
}
