'use strict';
let regionFeatures=[],regionPromise=null,currentRegion=null,currentCountry='CA',borderCrossings=[],cityTargets=[],roadFacilities=[],facilityLoadRevision=0,facilityScanBusy=false,mapScaleControl=null,lastSpeedMps=null,lastAccuracyMeters=null,facilityScanFailed=0,facilityCatalogLoaded=false;
const facilityKinds={weigh:'Weigh station',inspection:'Fixed inspection station',scale:'Public truck scale',truck:'Truck stop',rest:'Rest area',service:'Service area',diesel:'Commercial diesel / Cardlock'};
function distanceUnit(){return usesMiles(currentCountry)?'mi':'km'}
function roadDistance(meters){return Math.max(0,meters)/(usesMiles(currentCountry)?1609.344:1000)}
function speedUnit(){return usesMiles(currentCountry)?'mph':'km/h'}
function temperatureUnit(){return currentCountry==='US'?'°F':'°C'}
function formatTemperature(celsius){return Math.round(currentCountry==='US'?celsius*9/5+32:celsius)+temperatureUnit()}
function isInBox(p,b){return p[0]>=b[0]&&p[0]<=b[2]&&p[1]>=b[1]&&p[1]<=b[3]}
function inRing(p,ring){let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}
function regionAt(p){
  if(!p)return null;
  for(const f of regionFeatures){if(!isInBox(p,f.bbox))continue;
    for(let i=0;i<f.polygons.length;i++){if(f.polygonBoxes?.[i]&&!isInBox(p,f.polygonBoxes[i]))continue;const rings=f.polygons[i];if(inRing(p,rings[0])&&!rings.slice(1).some(r=>inRing(p,r)))return f}
  }return null;
}
function loadRegions(){if(!regionPromise)regionPromise=Promise.all([
  getJSON('regions-na.json?v=6',{},30000),
  getJSON('regions-eu.json?v=1',{},15000),
]).then(data=>{regionFeatures=data.flatMap(j=>j.regions);return regionFeatures}).catch(e=>{regionPromise=null;throw e});return regionPromise}
function pointOnRoute(distance){
  if(!coords.length)return null;const d=Math.max(0,Math.min(distance,routeLength))/scale;let lo=0,hi=cumulative.length-1;
  while(lo+1<hi){const m=(lo+hi)>>1;if(cumulative[m]<=d)lo=m;else hi=m}
  const span=cumulative[hi]-cumulative[lo],t=span?(d-cumulative[lo])/span:0,a=coords[lo],b=coords[hi];return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
}
function calculateBorderCrossings(){
  borderCrossings=[];if(!coords.length||!regionFeatures.length)return;
  const step=2000;let previous=null,previousDistance=0;
  for(let d=0;d<=routeLength+step;d+=step){const at=Math.min(routeLength,d),region=regionAt(pointOnRoute(at));
    if(region){if(previous&&region.code!==previous.code){let lo=previousDistance,hi=at;
      for(let i=0;i<15&&hi-lo>10;i++){const mid=(lo+hi)/2,r=regionAt(pointOnRoute(mid));if(r?.code===previous.code)lo=mid;else hi=mid}
      borderCrossings.push({at:(lo+hi)/2,from:previous,to:region});
    }previous=region;previousDistance=at}
    if(at===routeLength)break;
  }
}
function updateUnits(){
  const unit=distanceUnit();
  $('route-tagline').textContent=usesMiles(currentCountry)?'Every city. Every mile. Weather when you get there.':'Every city. Every kilometre. Weather when you get there.';
  $('corridor-note').textContent=usesMiles(currentCountry)?'mapped city boundaries or nearby city centers, and a 1.6-mile facility corridor':'mapped city boundaries or nearby city centers, and a 2.5 km facility corridor';
  $('table-distance-unit').textContent=unit.toUpperCase();
  $('border-unit').textContent=unit;


  $('units-note').textContent=(countryName(currentCountry)||currentCountry)+' · '+distanceUnit()+' / '+speedUnit()+' / '+temperatureUnit();
  if(typeof map!=='undefined'&&map&&typeof L!=='undefined'){
    const key=currentCountry;
    if(mapScaleControl?.unitCountry!==key){if(mapScaleControl)map.removeControl(mapScaleControl);
      mapScaleControl=L.control.scale({position:'bottomright',metric:!usesMiles(key),imperial:usesMiles(key)}).addTo(map);
      mapScaleControl.unitCountry=key}
  }
}
function updateRegionPanel(){
  const found=regionAt(lastPos||pointOnRoute(progress));
  if(!found&&regionFeatures.length&&lastPos)currentRegion=null;
  if(found){currentRegion=found;
    const changed=currentCountry!==found.country;
    currentCountry=found.country;
    updateUnits();
    if(changed){updateDistanceCells();
      updateTripCells();
      if(routeChoices.length)displayRouteChoices(routeChoices,Number($('route-choice').value))}}
  $('trip-region').textContent=currentRegion?.name||'—';
  updateTripInspectionCount();
  $('current-region').textContent=currentRegion?.name||(!lastPos?'Waiting for your location':regionFeatures.length?'Location outside mapped regions':'Loading province / state…');
  $('region-country').textContent=currentRegion?(currentRegion.country==='CA'?'CANADA · PROVINCE / TERRITORY':currentRegion.country==='US'?'UNITED STATES · STATE':'CURRENT COUNTRY'):'GPS + ROUTE';
  const next=currentRegion?borderCrossings.find(c=>c.at>progress-50&&c.from.code===currentRegion.code):null;
  if(next){const stale=watch!==null&&(!gpsTime||Date.now()-gpsTime>25000);
    $('border-target').textContent='TO '+next.to.name.toUpperCase();
    $('border-distance').textContent=stale?'—':fa(roadDistance(next.at-progress));
    $('border-note').textContent=stale?'Waiting for fresh GPS; previous border distance is not a live measurement.':'Approx. road distance to the boundary on this route.'}
  else{$('border-target').textContent='NEXT PROVINCE / STATE / COUNTRY';
    $('border-distance').textContent='—';
    $('border-note').textContent=!coords.length?'Start a trip to calculate the next boundary.':currentRegion?'No mapped province/state crossing before your destination.':'Boundary data or current location unavailable.'}

}
function updateTripInspectionCount(){
  const count=roadFacilities.filter(isGovernmentFacility).length;
  const field=$('trip-inspection-count');
  field.textContent=count||isDemo||(!facilityScanBusy&&facilityCatalogLoaded)?integer(count):facilityScanBusy?'Loading…':'—';
  field.title=facilityScanFailed?'Some inventories could not be loaded.':'Mapped fixed government stations on the current route.';
}
function updateDistanceCells(){
  if(typeof targets==='undefined'||!coords.length)return;
  $('total').textContent=fa(roadDistance(routeLength-progress))+' '+distanceUnit();
  if(typeof weatherRows!=='undefined')for(const [row,ref]of weatherRows)if(row.children?.[1])row.children[1].textContent=fa(roadDistance(ref.city.at-progress));
}
function facilityVisible(item){if(!item.kind||item.kind==='city')return $('show-cities').checked;
  if(['weigh','inspection'].includes(item.kind))return $('show-inspections').checked;
  if(item.kind==='scale')return false;
  if(!fuelBrandVisible(item))return false;
  if(item.kind==='rest')return $('show-rest').checked;
  if(item.kind==='diesel')return $('show-diesel').checked;
  return $('show-truck').checked}
function rebuildRoadTargets(){targets=[...cityTargets,...roadFacilities].sort((a,b)=>a.at-b.at)}
function resetRoadContext(){
  resetSpeedContext();
  roadFacilities=[];
  cityTargets=[];
  borderCrossings=[];
  facilityScanBusy=false;
  facilityScanFailed=0;
  facilityCatalogLoaded=false;
  facilityLoadRevision++;
  currentRegion=null;
  lastSpeedMps=null;
  lastAccuracyMeters=null;
  $('facility-status').textContent='Start a live trip to load fixed roadside facilities.';$('retry-facilities').hidden=true;
}
async function refreshRoadContext(token,revision){
  const current=()=>token===session&&revision===routeRevision;
  try{await loadRegions();
    if(!current())return;
    calculateBorderCrossings();
    updateRegionPanel();
    render()}catch{if(current()){$('current-region').textContent='Region data unavailable';
      $('border-note').textContent='Could not load province/state boundaries. Check your connection.'}}
}
function isGovernmentFacility(f){return ['weigh','inspection'].includes(f.kind)&&(f.authority==='government'||(isDemo&&f.name.startsWith('Sample')))}
function classifyFacility(tags){
  if(['private','no'].includes(tags.access)||tags.disused==='yes'||tags.abandoned==='yes'||tags.railway)return null;
  const name=[tags.name,tags.operator,tags.brand].filter(Boolean).join(' '),government=/department of transportation|ministry of transportation|cvse|state police|highway patrol|motor carrier enforcement|transportation infrastructure/i.test(name)||tags.ownership==='government';
  if(/cat scale|petro.?pass|\bbvd\b|flying j|\bpilot\b|\besso\b/i.test(name)&&(['weighbridge','weigh_station','weight_station'].includes(tags.amenity)||tags.service==='weigh_station'))return 'scale';
  if(tags.highway==='weighstation'||['weigh_station','weight_station'].includes(tags.amenity)||tags.service==='weigh_station')return government?'weigh':'scale';
  if(tags.amenity==='weighbridge')return ['yes','designated'].includes(tags.hgv)||/truck|public|certified|cat scale/i.test(name)?'scale':null;
  if(tags.amenity==='vehicle_inspection'&&government)return 'inspection';
  if((tags.highway==='checkpoint'||tags.barrier==='checkpoint')&&['police','inspection','vehicle_inspection'].includes(tags.checkpoint))return government?'inspection':null;
  if(tags.highway==='rest_area')return 'rest';
  if(tags.amenity==='truck_stop'||tags.highway==='truck_stop'||tags.truck_stop==='yes')return 'truck';
  if(tags.amenity==='fuel'&&/petro[ -]?pass|cardlock/i.test(name))return 'diesel';
  if(tags.amenity==='fuel'&&(['yes','designated'].includes(tags.hgv)||/\b(love.s|pilot|flying j|travelcenters of america|ta travel|petro stopping)\b/i.test(name)))return 'truck';
  if(tags.highway==='services')return tags.hgv==='yes'||/truck|flying j|pilot|love.s|travelcenters|petro stopping/i.test(name)?'truck':'service';
  return null;
}
function parseFacilityElements(elements){
  const found=[];
  for(const n of elements){const tags=n.tags||{},kind=classifyFacility(tags);
    if(!kind||kind==='scale')continue;
    const coord=[n.lon??n.center?.lon,n.lat??n.center?.lat];
    if(!coord.every(Number.isFinite))continue;
    const region=regionAt(coord);if(regionFeatures.length&&!region)continue;
    const p=project(coord);if(p.off>2500||p.along<progress-150||p.along>routeLength+100)continue;
    const name=tags['name:en']||tags.name||tags.brand||facilityKinds[kind];
    const zone=null; // Open-Meteo supplies the facility's actual time zone when its forecast loads.
    found.push({name,en:name,coord,kind,commercialDiesel:kind==='diesel',authority:['weigh','inspection'].includes(kind)?'government':kind==='scale'?'commercial':null,at:p.along,off:p.off,country:region?.country,zone,osmType:n.type,osmId:n.id,accessNote:'Near-route facility; verify travel direction and access.'});
  }return found;
}
function mergeFacilities(items){
  for(const item of items){if(item.kind==='scale')continue;
    const duplicate=roadFacilities.some(f=>(f.osmType===item.osmType&&f.osmId===item.osmId)||(f.kind===item.kind&&hav(f.coord,item.coord)<200));
    if(!duplicate)roadFacilities.push(item)}
  roadFacilities.sort((a,b)=>a.at-b.at);rebuildRoadTargets();render();drawRoute();
}
function facilityQuery(chunk){
  const points=chunk.flatMap(c=>[c[1].toFixed(5),c[0].toFixed(5)]).join(','),around='(around:3500,'+points+')';
  const filters=['[highway~"^(rest_area|services|weighstation|truck_stop)$"]','[amenity~"^(weighbridge|weigh_station|weight_station|vehicle_inspection|truck_stop)$"]','[amenity=fuel][hgv~"^(yes|designated)$"]','[truck_stop=yes]','[highway=checkpoint][checkpoint~"^(police|inspection|vehicle_inspection)$"]','[barrier=checkpoint][checkpoint~"^(police|inspection|vehicle_inspection)$"]'];
  return '[out:json][timeout:20];('+filters.map(f=>'nwr'+f+around+';').join('')+');out center tags;';
}
async function fetchFacilityChunk(chunk){
  const signature=chunk.map(p=>p.map(v=>v.toFixed(5)).join(',')).join(';');
  let hash=2166136261;
  for(let i=0;i<signature.length;i++)hash=Math.imul(hash^signature.charCodeAt(i),16777619);
  const key='rahyar-facilities-v12:'+(hash>>>0);
  let cached;try{cached=JSON.parse(localStorage.getItem(key)||'null')}catch{}
  if(cached&&Date.now()-cached.time<86400000&&Array.isArray(cached.elements))return cached.elements;
  const xs=chunk.map(p=>p[0]),ys=chunk.map(p=>p[1]),box=[Math.min(...xs)-.04,Math.min(...ys)-.03,Math.max(...xs)+.04,Math.max(...ys)+.03];
  const params=new URLSearchParams({bbox:box.join(','),limit:'50',lang:'en',include:'osm.highway.services,osm.highway.rest_area,osm.highway.weighstation,osm.amenity.weigh_station,osm.amenity.weight_station,osm.amenity.truck_stop'});
  const petroParams=new URLSearchParams({bbox:box.join(','),limit:'50',lang:'en',q:'Petro-Pass'});
  if(chunk.some(point=>{const country=regionAt(point)?.country;return country&&country!=='CA'&&country!=='US'})){
    const result=await getJSON('https://overpass-api.de/api/interpreter',{method:'POST',body:new URLSearchParams({data:facilityQuery(chunk)})},22000);
    if(!Array.isArray(result.elements)||result.remark)throw Error('Incomplete facility search');
    try{localStorage.setItem(key,JSON.stringify({time:Date.now(),elements:result.elements}))}catch{}
    return result.elements;
  }
  const results=await Promise.allSettled([getJSON('https://photon.komoot.io/api/?'+params,{},12000),getJSON('https://photon.komoot.io/api/?'+petroParams,{},12000)]);
  const usable=results.filter(r=>r.status==='fulfilled'&&Array.isArray(r.value.features));
  if(!usable.length)throw Error('Facility search unavailable');
  const json={features:usable.flatMap(r=>r.value.features)};
  if(!Array.isArray(json.features))throw Error('Facility search unavailable');
  const elements=json.features.filter(f=>['CA','US'].includes(f.properties.countrycode?.toUpperCase())).map(f=>({type:f.properties.osm_type,id:f.properties.osm_id,lon:f.geometry.coordinates[0],lat:f.geometry.coordinates[1],tags:{name:f.properties.name,[f.properties.osm_key]:f.properties.osm_value}}));
  try{localStorage.setItem(key,JSON.stringify({time:Date.now(),elements}))}catch{}return elements;
}

async function scanFacilities(token,revision=routeRevision){
  const scan=++facilityLoadRevision,current=()=>token===session&&revision===routeRevision&&scan===facilityLoadRevision&&!isDemo;
  const chunks=discoveryChunks(coords);if(!chunks.length)return;facilityScanBusy=true;facilityScanFailed=0;updateTripInspectionCount();
  try{const catalog=window.RAHYAR_FACILITY_CATALOG||await getJSON('facility-catalog.json?v=15');if(!current())return;facilityCatalogLoaded=true;const entries=[];
    for(const f of catalog.facilities||[]){if(f.kind==='scale')continue;
      const p=project(f.coord);
      if(p.off<2500&&p.along>=progress-150&&p.along<=routeLength)entries.push({...f,en:f.name,at:p.along,off:p.off,osmType:f.sourceType||'bts',osmId:f.sourceId})}
    mergeFacilities(entries);
  }catch(error){facilityScanFailed++;console.warn('Facility inventory failed',error);}
$('retry-facilities').hidden=true;let complete=0,consecutiveFailures=0;
  for(const chunk of chunks){if(!current())return;
    $('facility-status').textContent='Loading fixed roadside facilities: section '+(complete+1)+' of '+chunks.length;
    try{const elements=await fetchFacilityChunk(chunk);
      if(!current())return;
      mergeFacilities(parseFacilityElements(elements));
      consecutiveFailures=0}catch{if(!current())return;
      facilityScanFailed++;
      consecutiveFailures++;
      if(consecutiveFailures>=2){facilityScanFailed+=chunks.length-complete-1;
        break}}
    complete++;
  }
  if(!current())return;facilityScanBusy=false;$('retry-facilities').hidden=!facilityScanFailed;updateTripInspectionCount();
  $('facility-status').textContent=facilityScanFailed?''+roadFacilities.length+' locations from loaded inventories. Additional online coverage incomplete; verify signs and access.':roadFacilities.length+' mapped roadside locations. Coverage is partial; operating status and access are not live.';
}
function kindLabel(t){return t.final?'FINAL DESTINATION':facilityKinds[t.kind]||'CITY'}
function initRoadControls(){
  initFuelFilters();
  for(const id of ['show-cities','show-inspections','show-truck','show-diesel','show-rest'])$(id).onchange=()=>{render();drawRoute()};
  $('retry-facilities').onclick=refreshFacilities;$('hud-retry-facilities').onclick=refreshFacilities;
  updateUnits();
}

function refreshFacilities(){if(!isDemo&&coords.length&&!facilityScanBusy)return scanFacilities(session)}
