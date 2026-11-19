'use strict';

const truckProfileKey = 'rahyar-truck-profile-v1';
const truckFields = ['height', 'width', 'length', 'weight', 'axle_load', 'axle_count'];
let activeTruckProfile = null;
let activeRouteVehicle = 'truck';

function vehicleLabel(vehicle) {
  return vehicle === 'auto' ? 'car' : 'truck';
}
let truckProfileStartDestination = null;
const truckProfileReviewMessage = 'Check the loaded truck dimensions and weights, then select Save & start trip.';

function clearTruckProfileStart() {
  truckProfileStartDestination = null;
  $('truck-save').textContent = 'Save truck profile';
  if ($('message').textContent === truckProfileReviewMessage) message('');
}

function reviewTruckProfileBeforeStart(focusSave = true) {
  truckProfileStartDestination = dest;
  openTruckSettings();
  const save = $('truck-save');
  save.textContent = 'Save & start trip';
  if (focusSave) $('truck-profile').querySelector('summary').focus();
  message(truckProfileReviewMessage, true);
}

function restoreTruckProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(truckProfileKey));
    if (!saved || !truckFields.every(key => Number.isFinite(saved[key]) && saved[key] > 0)) return false;
    for (const key of truckFields) $('truck-' + key).value = saved[key] ?? '';
    $('truck-hazmat').checked = saved.hazmat === true;
    showTrailerPreset(saved.trailer);
    return true;
  } catch { return false; }
}

function readTruckProfile(onError = text => message(text, true)) {
  const inputs = truckFields.map(key => $('truck-' + key));
  const axleLoad = $('truck-axle_load');
  const grossWeight = $('truck-weight').valueAsNumber;
  axleLoad.setCustomValidity(axleLoad.valueAsNumber > grossWeight ? 'Axle load cannot exceed gross weight.' : '');
  const invalid = inputs.find(input => !input.validity.valid);
  if (invalid) {
    if (document.body.classList.contains('driving')) exitDriving();
    openTruckSettings();
    invalid.reportValidity();
    const label = invalid.labels[0].textContent.trim();
    onError(label + ': ' + invalid.validationMessage);
    return null;
  }
  const profile = Object.fromEntries(truckFields.map((key, i) => [key, inputs[i].valueAsNumber]));
  profile.hazmat = $('truck-hazmat').checked;
  return profile;
}

function persistTruckProfile(profile) {
  try {
    localStorage.setItem(truckProfileKey, JSON.stringify({...profile, trailer:trailerPreset}));
    return true;
  } catch {
    return false;
  }
}

function initTruckProfileControls() {
  $('truck-save').onclick = () => {
    const status = $('truck-save-status');
    const profile = readTruckProfile(text => { status.textContent = text; });
    if (!profile) return;
    const startAfterSave = truckProfileStartDestination === dest && dest !== null;
    truckProfileNeedsReview = false;
    clearTruckProfileStart();
    status.textContent = persistTruckProfile(profile)
      ? 'Truck profile saved on this device.'
      : 'Profile confirmed for this session. Browser storage is unavailable.';
    if (startAfterSave) {
      $('truck-profile').open = false;
      closeAppDialog($('app-settings'));
      start();
    }
  };
  $('truck-profile').addEventListener('input', () => { $('truck-save-status').textContent = ''; });
}

// Points on the Trans-Canada through Swift Current, the Regina bypass and Brandon.
const prairieHighwayPoints = [
  [-107.700408, 50.331141],
  [-104.34837, 50.447497],
  [-99.75, 49.889073],
];

function prairieHighwayThroughPoints([start, end]) {
  const inPrairies = ([lon, lat]) => lon >= -115.5 && lon <= -96 && lat >= 49.2 && lat <= 54;
  if (!inPrairies(start) || !inPrairies(end)) return [];
  const eastbound = start[0] < end[0];
  const [west, east] = eastbound ? [start, end] : [end, start];
  const between = prairieHighwayPoints.filter(point =>
    point[0] > west[0] && point[0] < east[0] &&
    hav(point, start) > 12000 && hav(point, end) > 12000
  );
  return eastbound ? between : between.reverse();
}

function routeEntersUnitedStates(route) {
  const points = route.geometry.coordinates;
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (regionAt(point)?.country === 'US') return true;
    if (i === 0) continue;
    const prev = points[i - 1];
    // Sample long geometry segments too, including when the endpoints are in Canada.
    const samples = Math.ceil(hav(prev, point) / 200);
    for (let j = 1; j < samples; j++) {
      const fraction = j / samples;
      if (regionAt([
        prev[0] + (point[0] - prev[0]) * fraction,
        prev[1] + (point[1] - prev[1]) * fraction,
      ])?.country === 'US') return true;
    }
  }
  return false;
}

async function requestRoadRoutes(points, alternatives = 2, timeout, heading, canadaOnly = false) {
  if (!canadaOnly) return fetchVehicleRoutes(points, alternatives, timeout, heading);
  if (points.some(point => regionAt(point)?.country === 'US')) {
    throw Object.assign(new Error('A location is in the United States'), {code: 'CanadaOnlyWaypoint'});
  }
  const routes = await fetchVehicleRoutes(points, alternatives, timeout, heading, {canadaOnly});
  const domestic = routes.filter(route => !routeEntersUnitedStates(route));
  if (domestic.length) return domestic;
  if (points.length === 2) {
    const through = prairieHighwayThroughPoints(points);
    if (through.length) {
      const viaHighway = await fetchVehicleRoutes([points[0], ...through, points[1]], 0, timeout, heading, {canadaOnly, through: true});
      const domesticHighway = viaHighway.filter(route => !routeEntersUnitedStates(route));
      if (domesticHighway.length) return domesticHighway;
    }
  }
  throw Object.assign(new Error('No Canada-only route found'), {code: 'CanadaOnlyRouteUnavailable'});
}

async function fetchVehicleRoutes(points, alternatives, timeout, heading, {canadaOnly = false, through = false, segmenting = false} = {}) {
  const vehicle = activeRouteVehicle;
  if (vehicle === 'truck' && !activeTruckProfile) throw new Error('Truck profile is required');
  const costingOptions = vehicle === 'truck' ? {
    ...activeTruckProfile,
    use_truck_route: 0.7,
    hgv_no_access_penalty: 43200,
  } : {};
  if (canadaOnly) costingOptions.country_crossing_penalty = 43200;
  const request = {
    locations: points.map(([lon, lat]) => ({lon, lat})),
    costing: vehicle,
    costing_options: {[vehicle]: costingOptions},
    format: 'osrm',
    shape_format: 'geojson',
    alternates: points.length === 2 ? alternatives : 0,
  };
  if (through) {
    for (const waypoint of request.locations.slice(1, -1)) waypoint.type = 'through';
  }
  if (Number.isFinite(heading) && heading >= 0 && heading < 360) {
    request.locations[0].heading = Math.round(heading) % 360;
    request.locations[0].heading_tolerance = 45;
  }
  const url = 'https://valhalla1.openstreetmap.de/route?json=' + encodeURIComponent(JSON.stringify(request));
  let result;
  try { result = await getJSON(url, {headers: {'X-Client-Id': location.hostname}}, timeout); }
  catch(error) {
    if(!segmenting && (error.code==='DistanceExceeded'||error.errorCode===154) && typeof requestSegmentedVehicleRoute==='function'){
      const capturedSession=typeof session==='number'?session:null;
      const route=await requestSegmentedVehicleRoute(points,async pair=>{
        if(capturedSession!==null&&capturedSession!==session)throw Object.assign(new Error('Trip changed'),{name:'AbortError'});
        const routes=await fetchVehicleRoutes(pair,0,timeout,hav(pair[0],points[0])<10?heading:null,{canadaOnly,segmenting:true});
        return canadaOnly?routes.filter(r=>!routeEntersUnitedStates(r)):routes;
      },{canadaOnly,onProgress:count=>{if(typeof message==='function')message('Checking '+vehicleLabel(vehicle)+' route section '+count+'… Previous route stays visible.');}});
      return [route];
    }
    throw error;
  }
  if (result.code !== 'Ok') return [];
  return (result.routes || []).filter(route =>
    Number.isFinite(route.distance) && Number.isFinite(route.duration) &&
    route.geometry?.coordinates?.length >= 2 && route.legs?.some(leg => leg.steps?.length)
  ).slice(0, 4);
}


function truckRouteErrorMessage(error) {
  if (error.code === 'RouteRegionMismatch') return 'Choose a destination in your routing region: Canada and U.S., or UK and Europe.';
  if (error.code === 'RouteCountryUnavailable') return 'Could not verify the country of the start or destination. Check your location and retry.';
  if (error.code === 'CanadaOnlyWaypoint') return 'This trip must stay in Canada. Choose a stop in Canada, or retry once your GPS location is in Canada.';
  if (error.code === 'CanadaOnlyRouteUnavailable') return 'No ' + vehicleLabel(activeRouteVehicle) + ' route was found that stays in Canada. Try a Canadian waypoint.';
  if (error.code === 'SegmentBudgetExceeded') return 'Long-route calculation reached its request budget. Your previous route is preserved. Retry or select a waypoint.';
  if (['SegmentNoRoute','DisconnectedSegments'].includes(error.code)) return 'Could not connect all sections with your vehicle restrictions. Your previous route is preserved. Try another corridor or waypoint.';
  if (error.code === 'DistanceExceeded' || error.errorCode === 154) {
    return 'This trip exceeds the routing service distance limit. Choose an intermediate destination for the first leg.';
  }
  if (error.status === 429) return 'The routing service is busy. Wait briefly and retry.';
  if (error.name === 'TimeoutError') return 'The routing service timed out. Retry the route.';
  if (error.status >= 500 || error.name === 'TypeError') return 'The routing service could not be reached. Check your connection and retry.';
  return 'No ' + vehicleLabel(activeRouteVehicle) + ' route was returned. Try another destination or waypoint.';
}
