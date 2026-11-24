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

async function requestRoadRoutes(points, alternatives = 2, timeout, heading, canadaOnly = false, {through=false}={}) {
  if(points.length>2&&alternatives>0&&typeof requestSegmentedVehicleRoute==='function'){
    if(canadaOnly&&points.some(point=>regionAt(point)?.country==='US'))throw Object.assign(new Error('A location is in the United States'),{code:'CanadaOnlyWaypoint'});
    return segmentedVehicleRoutes(points,timeout,heading,canadaOnly,alternatives);
  }
  if (!canadaOnly) return fetchVehicleRoutes(points, alternatives, timeout, heading,{through});
  if (points.some(point => regionAt(point)?.country === 'US')) {
    throw Object.assign(new Error('A location is in the United States'), {code: 'CanadaOnlyWaypoint'});
  }
  const routes = await fetchVehicleRoutes(points, alternatives, timeout, heading, {canadaOnly,through});
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
  if(typeof requestSegmentedVehicleRoute==='function')return segmentedVehicleRoutes(points,timeout,heading,true,alternatives);
  throw Object.assign(new Error('No Canada-only route found'), {code: 'CanadaOnlyRouteUnavailable'});
}

async function segmentedVehicleRoutes(points,timeout,heading,canadaOnly,alternatives=0){
  const capturedSession=typeof session==='number'?session:null;
  const route=await requestSegmentedVehicleRoute(points,async (pair,reserveExtra)=>{
    if(capturedSession!==null&&capturedSession!==session)throw Object.assign(new Error('Trip changed'),{name:'AbortError'});
    const routes=await fetchVehicleRoutes(pair,alternatives,timeout,hav(pair[0],points[0])<10?heading:null,{canadaOnly,segmenting:true,reserveExtra});
    return canadaOnly?routes.filter(r=>!routeEntersUnitedStates(r)):routes;
  },{canadaOnly,alternativeCount:alternatives,onProgress:count=>{if(typeof message==='function')message('Calculating '+vehicleLabel(activeRouteVehicle)+' route · section '+count+'…');}});
  const {alternativeRoutes=[],...primary}=route;return [primary,...alternativeRoutes].slice(0,3);
}
async function vehicleRoutingRequest(request,timeout,purpose=''){
  // Same-origin gateway avoids client CORS/preflight and URL-size dependencies.
  // Retain the direct provider for static legacy hosting without Functions.
  if(typeof window!=='undefined'&&typeof document!=='undefined'){
    try{return await getJSON('/api/route',{method:'POST',headers:{'Content-Type':'application/json',...(purpose==='local-corridor'?{'X-Rahyar-Request-Purpose':purpose}:{})},body:JSON.stringify(request)},timeout??32000);}
    catch(error){if(![404,405].includes(error.status))throw error;}
  }
  const url='https://valhalla1.openstreetmap.de/route?json='+encodeURIComponent(JSON.stringify(request));
  return getJSON(url,{headers:{'X-Client-Id':location.hostname}},timeout);
}

async function fetchVehicleRoutes(points, alternatives, timeout, heading, {canadaOnly = false, through = false, segmenting = false,reserveExtra=null,localWindow=false,corridorProbe=null,requestPurpose=''} = {}) {
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
  const avoids=typeof window!=='undefined'?window.RahyarMapPlaces?.avoids?.(vehicle):null;if(avoids?.length)request.exclude_locations=avoids.map(p=>({lon:p.coord[0],lat:p.coord[1]}));
  if (through) {
    for (const waypoint of request.locations.slice(1, -1)) waypoint.type = 'through';
  }
  if(corridorProbe){for(const location of request.locations.slice(1,-1)){location.radius=5000;location.search_cutoff=15000;location.search_filter={min_road_class:'trunk',max_road_class:'motorway',exclude_restricted:true,exclude_ramp:true};location.heading=corridorProbe.bearing;location.heading_tolerance=45;}}
  if (Number.isFinite(heading) && heading >= 0 && heading < 360) {
    request.locations[0].heading = Math.round(heading) % 360;
    request.locations[0].heading_tolerance = 45;
  }
  let result;
  try { result = await vehicleRoutingRequest(request,timeout,requestPurpose); }
  catch(error) {
    const canSplit=typeof requestSegmentedVehicleRoute==='function'&&typeof hav==='function';
    if(!segmenting&&canSplit&&(error.code==='DistanceExceeded'||error.errorCode===154||((error.name==='TimeoutError'||error.name==='TypeError'||error.status>=500)&&points.some((p,i)=>i>0&&hav(points[i-1],p)>150000))))return segmentedVehicleRoutes(points,timeout,heading,canadaOnly,alternatives);
    throw error;
  }
  if (result.code !== 'Ok') return [];
  const valid=(result.routes || []).filter(route =>
    Number.isFinite(route.distance) && Number.isFinite(route.duration) &&
    route.geometry?.coordinates?.length >= 2 && route.legs?.some(leg => leg.steps?.length)
  ).slice(0, 3);
  if(typeof window!=='undefined'&&points.length===2&&alternatives>0&&valid.length&&valid.length<3&&(!segmenting||valid.length===1||localWindow))return diversifyVehicleRoutes(request,valid,r=>vehicleRoutingRequest(r,Math.min(timeout??10000,10000),requestPurpose),reserveExtra,canadaOnly);
  return valid;
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

// Bounded generic edge diversification. Every option is returned by the same vehicle router;
// automatic exclusions are search constraints, never official road-closure reports.
async function diversifyVehicleRoutes(request,initial,requester,reserveExtra=null,canadaOnly=false){
 const routes=[...initial],exclusions=[...(request.exclude_locations||[])];let attempts=0;
 const signature=r=>JSON.stringify(r.geometry.coordinates),seen=new Set(routes.map(signature));
 const corridorPoints=route=>{const line=route.geometry.coordinates,lengths=[0];for(let i=1;i<line.length;i++)lengths.push(lengths.at(-1)+hav(line[i-1],line[i]));return [.35,.5,.65].map(f=>line[Math.max(1,lengths.findIndex(d=>d>=lengths.at(-1)*f))]);};
 while(routes.length<3&&attempts<2&&exclusions.length<12){
  const points=corridorPoints(routes[Math.min(attempts,routes.length-1)]).filter(point=>point&&!exclusions.some(p=>hav([p.lon,p.lat],point)<100));attempts++;
  if(!points.length||reserveExtra&&!reserveExtra())break;
  for(const point of points){if(exclusions.length===12)break;if(!exclusions.some(p=>hav([p.lon,p.lat],point)<100))exclusions.push({lon:point[0],lat:point[1]});}
  try{const result=await requester({...request,costing_options:{...request.costing_options,[request.costing]:{...request.costing_options[request.costing],use_highways:1}},exclude_locations:[...exclusions]});if(result.code!=='Ok')continue;
   for(const route of result.routes||[]){if(!Number.isFinite(route.distance)||!Number.isFinite(route.duration)||!route.geometry?.coordinates||route.geometry.coordinates.length<2||!route.legs?.some(l=>l.steps?.length)||canadaOnly&&routeEntersUnitedStates(route))continue;const id=signature(route);if(seen.has(id))continue;
    const memory=typeof window!=='undefined'?window.RahyarRouteMemory:null;if(memory&&!memory.different(route,routes[0])&&!memory.different(routes[0],route))continue;
    seen.add(id);routes.push(route);if(routes.length===3)break;
   }
  }catch(error){if(error.name==='AbortError')throw error;if(error.status===429)break;/* Preserve genuine existing routes on optional lookup failure. */}
 }
 return routes.slice(0,3);
}
