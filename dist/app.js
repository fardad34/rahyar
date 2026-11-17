'use strict';
const $=id=>document.getElementById(id), fa=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1,minimumFractionDigits:1}).format(n), integer=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n);
const known=[["تورنتو", "Toronto", -79.3832, 43.6532], ["مونترال", "Montréal", -73.5673, 45.5017], ["اتاوا", "Ottawa", -75.6972, 45.4215], ["ونکوور", "Vancouver", -123.1207, 49.2827], ["وینیپگ", "Winnipeg", -97.138, 49.895], ["کلگری", "Calgary", -114.0719, 51.0447], ["اوشاوا", "Oshawa", -78.8658, 43.8971], ["کوبورگ", "Cobourg", -78.1677, 43.9598], ["بلویل", "Belleville", -77.3832, 44.1628], ["کینگستون", "Kingston", -76.486, 44.2312], ["بروکویل", "Brockville", -75.6843, 44.5895], ["کورنوال", "Cornwall", -74.7286, 45.0213], ["لندن", "London", -81.2453, 42.9849], ["بری", "Barrie", -79.6903, 44.3894], ["سودبری", "Sudbury", -80.993, 46.4917], ["نورث بی", "North Bay", -79.46, 46.31], ["سو سنت ماری", "Sault Ste. Marie", -84.3358, 46.5219], ["واوا", "Wawa", -84.773, 47.994], ["تاندر بی", "Thunder Bay", -89.2477, 48.3809], ["درایدن", "Dryden", -92.837, 49.783], ["کنورا", "Kenora", -94.489, 49.767], ["برندون", "Brandon", -99.9519, 49.8485], ["رجاینا", "Regina", -104.6189, 50.4452], ["سوئیفت کارنت", "Swift Current", -107.7972, 50.2881], ["مدیسن هت", "Medicine Hat", -110.677, 50.0405], ["بنْف", "Banff", -115.5708, 51.1784], ["گلدن", "Golden", -116.9629, 51.299], ["رولستوک", "Revelstoke", -118.1957, 50.9981], ["کملوپس", "Kamloops", -120.3273, 50.6745], ["هوپ", "Hope", -121.4419, 49.3793], ["ادمونتون", "Edmonton", -113.4938, 53.5461], ["ساسکاتون", "Saskatoon", -106.67, 52.1332], ["نیویورک", "New York", -74.006, 40.7128], ["شیکاگو", "Chicago", -87.6298, 41.8781], ["سیاتل", "Seattle", -122.3321, 47.6062], ["دیترویت", "Detroit", -83.0458, 42.3314], ["مینیاپولیس", "Minneapolis", -93.265, 44.9778], ["فارگو", "Fargo", -96.7898, 46.8772], ["بیزمارک", "Bismarck", -100.7837, 46.8083], ["بیلینگز", "Billings", -108.5007, 45.7833], ["اسپوکن", "Spokane", -117.426, 47.6588], ["لس‌آنجلس", "Los Angeles", -118.2437, 34.0522]].map(([name,en,x,y])=>({name:en.normalize('NFKD').replace(/\p{M}/gu,''),en:en.normalize('NFKD').replace(/\p{M}/gu,''),aliases:[name,en],coord:[x,y]}));
const knownZones=["America/Toronto", "America/Toronto", "America/Toronto", "America/Vancouver", "America/Winnipeg", "America/Edmonton", "America/Toronto", "America/Toronto", "America/Toronto", "America/Toronto", "America/Toronto", "America/Toronto", "America/Toronto", "America/Toronto", "America/Toronto", "America/Toronto", "America/Toronto", "America/Toronto", "America/Toronto", "America/Winnipeg", "America/Winnipeg", "America/Winnipeg", "America/Regina", "America/Swift_Current", "America/Edmonton", "America/Edmonton", "America/Edmonton", "America/Vancouver", "America/Vancouver", "America/Vancouver", "America/Edmonton", "America/Regina", "America/New_York", "America/Chicago", "America/Los_Angeles", "America/Detroit", "America/Chicago", "America/Chicago", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Los_Angeles"];known.forEach((c,i)=>c.zone=knownZones[i]);
const destinations={montreal:known[1],ottawa:known[2],toronto:known[0],vancouver:known[3],winnipeg:known[4],calgary:known[5],edmonton:known[30],newyork:known[32],chicago:known[33],seattle:known[34],losangeles:known[41]};
const quickStops=[
  ['Canada West',[
    'winnipeg','regina','edmonton','calgary','kelowna','vancouver',
  ]],
  ['Canada East',[
    'toronto','ottawa','cornwall','montreal','quebec','moncton','halifax','sydney',
  ]],
  ['Canada–U.S. crossings',[
    'windsor-crossing','sarnia-crossing','fort-erie-crossing','thousand-islands-crossing',
  ]],
  ['United States',[
    'detroit','buffalo','cleveland','chicago','indianapolis','minneapolis','kansas-city','st-louis',
    'newyork','boston','philadelphia','pittsburgh','atlanta','nashville','memphis','miami',
    'dallas','houston','denver','salt-lake-city','phoenix','las-vegas','seattle','portland','losangeles',
  ]],
];
destinations.regina=known[20];
for(const [key,name,x,y,zone] of [
  ["kelowna","Kelowna",-119.48568,49.88307,"America/Vancouver"],
  ["cornwall","Cornwall",-74.72815,45.01809,"America/Toronto"],
  ["quebec","Québec City",-71.21454,46.81228,"America/Toronto"],
  ["moncton","Moncton",-64.7965,46.09454,"America/Moncton"],
  ["halifax","Halifax",-63.57688,44.64269,"America/Halifax"],
  ["sydney","Sydney",-60.1831,46.1351,"America/Glace_Bay"],
  ["detroit","Detroit",-83.04575,42.33143,"America/Detroit"],
  ["buffalo","Buffalo",-78.87837,42.88645,"America/New_York"],
  ["cleveland","Cleveland",-81.69541,41.4995,"America/New_York"],
  ["indianapolis","Indianapolis",-86.15804,39.76838,"America/Indiana/Indianapolis"],
  ["minneapolis","Minneapolis",-93.26384,44.97997,"America/Chicago"],
  ["kansas-city","Kansas City",-94.57857,39.09973,"America/Chicago"],
  ["st-louis","St. Louis",-90.19789,38.62727,"America/Chicago"],
  ["boston","Boston",-71.05977,42.35843,"America/New_York"],
  ["philadelphia","Philadelphia",-75.16362,39.95238,"America/New_York"],
  ["pittsburgh","Pittsburgh",-79.99589,40.44062,"America/New_York"],
  ["atlanta","Atlanta",-84.38798,33.749,"America/New_York"],
  ["nashville","Nashville",-86.78444,36.16589,"America/Chicago"],
  ["memphis","Memphis",-90.04898,35.14953,"America/Chicago"],
  ["miami","Miami",-80.19366,25.77427,"America/New_York"],
  ["dallas","Dallas",-96.80667,32.78306,"America/Chicago"],
  ["houston","Houston",-95.36327,29.76328,"America/Chicago"],
  ["denver","Denver",-104.9847,39.73915,"America/Denver"],
  ["salt-lake-city","Salt Lake City",-111.89105,40.76078,"America/Denver"],
  ["phoenix","Phoenix",-112.07404,33.44838,"America/Phoenix"],
  ["las-vegas","Las Vegas",-115.13722,36.17497,"America/Los_Angeles"],
  ["portland","Portland",-122.67621,45.52345,"America/Los_Angeles"],
  ["windsor-crossing","Windsor · Ambassador Bridge",-83.071401,42.307856,"America/Toronto"],
  ["sarnia-crossing","Sarnia · Blue Water Bridge",-82.423569,42.998825,"America/Toronto"],
  ["fort-erie-crossing","Fort Erie · Peace Bridge",-78.905962,42.906964,"America/Toronto"],
  ["thousand-islands-crossing","Thousand Islands Bridge · Lansdowne",-75.983564,44.347244,"America/Toronto"],
])destinations[key]={name,en:name,coord:[x,y],zone};

let dest=null, coords=[],cumulative=[],routeLength=0,scale=1,targets=[],progress=0,watch=null,lastPos=null,lastRouteAt=0,routeBusy=false,session=0,isDemo=false,map,routeLayer,positionLayer,markers=[],gpsTime=0,requestId=0,routeRevision=0,discoveryBusy=false,routeGrid=new Map(),catalogPromise;
let pendingVia=null, viaRouteDistance=null, offRouteFixes=0;
let highwayWaypoints=[];
let routeViaPlace=null;
const CITY_CORRIDOR_METERS=16000;
const CITY_CENTER_FALLBACK_METERS=900;
let activeCityBoundaries=new Map(),activeCitySamples=[];
let customVia=null, routeChoices=[], selectedAlternative=false;

function routeOptionLabel(route,index) {
  const minutes=Math.round(route.duration/60);
  const hours=Math.floor(minutes/60);
  const time=(hours?hours+' h ':'')+(minutes%60)+' min';
  return (route.highwayName||'Route '+(index+1))+' · '+integer(roadDistance(route.distance))+' '+distanceUnit()+' · '+time;
}

function displayRouteChoices(routes,index=0) {
  routeChoices=routes;
  $('route-choices').hidden=!routes.length;
  $('focus-route-choice').hidden=routes.length<2;
  $('route-choice-status').textContent=routes[0]?.segmented?'Continuous '+vehicleLabel(activeRouteVehicle)+' route · '+routes[0].segmentCount+' provider-routed sections. Mapped restrictions may be incomplete; follow posted signs.':routes.length===1?'One route available. Choose a waypoint to request a different corridor.':'';
  for(const id of ['route-choice','focus-route-choice']){
    const select=$(id);
    select.replaceChildren(...routes.map((route,i)=>new Option(routeOptionLabel(route,i),String(i))));
    select.disabled=routes.length<2;
    if(routes.length)select.value=String(index);
  }
}

function routeContinuity(route) {
  const line=route.geometry.coordinates;
  let score=0;
  // Compare sample points to the remaining part of the driver's chosen route.
  for(let i=1;i<=24;i++){
    const point=project(line[Math.floor((line.length-1)*i/25)]);
    if(point.off<100&&point.along>=progress-1000)score++;
  }
  return score;
}

function chooseRoute(index) {
  const route=routeChoices[index];
  if(!route||routeBusy||watch===null||isDemo||!lastPos)return;
  selectedAlternative=true;
  displayRouteChoices(routeChoices,index);
  pendingVia=route.highwayVia||route.cityVia||null;
  activateRoute(route,pendingVia,lastPos,session);
}

function setCustomVia(place) {
  customVia=place;
  const select=$('route-via');
  let option=select.querySelector('[value="custom-via"]');
  if(!option){option=new Option('','custom-via');select.append(option)}
  option.textContent=place.addressLabel||place.name;
  select.value='custom-via';
  $('results').replaceChildren();
  $('query').value='';
  updateViaLabel();
  $('search-status').textContent='Stop added: '+option.textContent;
  if(watch!==null)start();
}

function updateViaLabel() {
  const picker = $('route-via');
  const label = $('route-via-selection');
  label.hidden = !picker.value;
  label.textContent = picker.value ? picker.selectedOptions[0]?.textContent || '' : '';
}

function selectedVia() {
  const key=$('route-via').value;
  if(ONTARIO_HIGHWAYS[key])return {ontarioHighway:key};
  const via=key==='custom-via'?customVia:destinations[key];
  return via && hav(via.coord,dest.coord)>1000 ? via : null;
}

function message(text,error=false){$('message').textContent=text;$('message').className=error?'error':''}
function hav(a,b){const r=Math.PI/180,dy=(b[1]-a[1])*r,dx=(b[0]-a[0])*r;return 6371000*2*Math.atan2(Math.sqrt(Math.sin(dy/2)**2+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dx/2)**2),Math.sqrt(1-(Math.sin(dy/2)**2+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dx/2)**2)))}
function prepare(line,length){coords=line;cumulative=[0];for(let i=1;i<line.length;i++)cumulative.push(cumulative[i-1]+hav(line[i-1],line[i]));scale=length/cumulative.at(-1);routeLength=length;routeGrid=new Map();
  for(let i=1;i<coords.length;i++){
    const a=coords[i-1],b=coords[i];
    for(let x=Math.floor(Math.min(a[0],b[0])*4);x<=Math.floor(Math.max(a[0],b[0])*4);x++)
      for(let y=Math.floor(Math.min(a[1],b[1])*4);y<=Math.floor(Math.max(a[1],b[1])*4);y++){
        const key=x+','+y;if(!routeGrid.has(key))routeGrid.set(key,[]);routeGrid.get(key).push(i);
      }
  }
}
function project(p){
  let best={off:Infinity,along:0};const k=Math.cos(p[1]*Math.PI/180),indices=new Set(),dx=.15/Math.max(.1,k);
  for(let x=Math.floor((p[0]-dx)*4);x<=Math.floor((p[0]+dx)*4);x++)
    for(let y=Math.floor((p[1]-.15)*4);y<=Math.floor((p[1]+.15)*4);y++)
      for(const i of routeGrid.get(x+','+y)||[])indices.add(i);
  for(const i of indices){const a=coords[i-1],b=coords[i],x=(b[0]-a[0])*k,y=b[1]-a[1],px=(p[0]-a[0])*k,py=p[1]-a[1];
    const t=Math.max(0,Math.min(1,(px*x+py*y)/(x*x+y*y||1))),q=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],off=hav(p,q);
    if(off<best.off)best={off,along:(cumulative[i-1]+(cumulative[i]-cumulative[i-1])*t)*scale};
  }return best;
}
function loadCatalog(){
  if(!catalogPromise)catalogPromise=Promise.all([
    getJSON('cities-na.json?v=5'),
    getJSON('cities-eu.json?v=1'),
  ]).then(data=>data.flatMap(j=>j.cities).map(r=>({id:r[0],name:r[6]?.[0]||r[1],en:r[6]?.[0]||r[1],coord:[r[2],r[3]],country:r[4],region:r[5]||'',aliases:[r[1],...(r[6]||[])],zone:r[7]||null}))).catch(e=>{catalogPromise=null;throw e});
  return catalogPromise;
}
let lastMainFitRevision=-1;
function initMap(){if(!window.L){$('map').textContent="Map unavailable. The city list is still available.";return}map=L.map('map',{zoomControl:false,rotate:true,rotateControl:false,touchRotate:false,shiftKeyRotate:false,bearing:0}).setView([50,-100],4);L.control.zoom({position:'bottomleft'}).addTo(map);
  const host=map.getContainer();
  map.on('dragstart',pauseMapForGesture);
  map.on('dragend',resumeMapAfterGesture);
  const zoomGesture=()=>{pauseMapForGesture();resumeMapAfterGesture()};
  host.addEventListener('wheel',zoomGesture,{passive:true});
  host.addEventListener('dblclick',zoomGesture,true);
  let pinching=false;
  host.addEventListener('touchmove',event=>{
    if(event.touches.length<2)return;
    pinching=true;
    pauseMapForGesture();
  },{passive:true});
  const endPinch=event=>{
    if(!pinching||event.touches.length>1)return;
    pinching=false;
    resumeMapAfterGesture();
  };
  host.addEventListener('touchend',endPinch,{passive:true});
  host.addEventListener('touchcancel',endPinch,{passive:true});
  host.addEventListener('click',event=>{if(event.target.closest('.leaflet-control-zoom'))zoomGesture()},true);
}
function drawRoute(){syncNavigationData();
  const driving=document.body.classList.contains('driving');
  const fitMain=!driving&&!mainMapBrowsing&&lastMainFitRevision!==routeRevision;
  if(fitMain){lastMainFitRevision=routeRevision;fitNavigationRoute()}
  if(!map)return;if(routeLayer)map.removeLayer(routeLayer);routeLayer=L.polyline(coords.map(c=>[c[1],c[0]]),{color:'#8538d1',weight:9,opacity:1}).addTo(map);markers.forEach(m=>map.removeLayer(m));markers=[];targets.filter(facilityVisible).forEach(t=>{const pin=t.routeCoord||t.coord;const m=L.circleMarker([pin[1],pin[0]],{radius:5,color:'#fff',weight:2,fillColor:t.kind&&t.kind!=='city'?'#e7be78':'#a5e7cb',fillOpacity:1}).addTo(map).bindTooltip(()=>{const label=document.createElement('span');label.textContent=t.name+' · '+kindLabel(t);return label},{direction:'top'});markers.push(m)});if(document.body.classList.contains('driving'))followCockpitPosition(lastPos||pointOnRoute(progress));else if(fitMain)map.fitBounds(routeLayer.getBounds(),{padding:[35,35]})}
function drawPosition(c){$('main-map-center').disabled=false;if(document.body.classList.contains('driving'))followCockpitPosition(c);else followNavigationPosition(c,!coords.length);if(!map)return;if(positionLayer)positionLayer.setLatLng([c[1],c[0]]);else positionLayer=L.marker([c[1],c[0]],{icon:L.divIcon({className:'',html:'<div class="gps-marker"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(map)}
function routeCityCandidates(list, destination, length, locate, via=null, viaAt=null, boundaries=new Map(), samples=[], routePoint=null, lookupRegion=null, roads=[]){
  const candidates=[];
  for(const city of list){
    if(hav(city.coord,destination.coord)<=1500)continue;
    const nearest=locate(city.coord);
    if(nearest.off>=CITY_CORRIDOR_METERS)continue;
    const relations=boundaries.get(searchKey(city.en||city.name))||[];
    const {hasBoundary,hit}=cityBoundaryMatch(city,relations,samples,locate);
    const cityKey=searchKey(city.en||city.name);
    const bypass=cityKey.length>=4&&roads.some((segment,index)=>
      nearest.along>=segment.at&&nearest.along< (roads[index+1]?.at??length)&&
      /beltway|ring road|bypass|périphérique|rocade/i.test(segment.road)&&searchKey(segment.road).includes(cityKey));
    if(!hit&&!bypass&&(hasBoundary||nearest.off>CITY_CENTER_FALLBACK_METERS))continue;
    const match=hit||nearest;
    if(match.along<=500||match.along>=length-500)continue;
    const routeCountry=lookupRegion?.(routePoint?.(match.along))?.country;
    const cityCountry=city.country||lookupRegion?.(city.coord)?.country;
    if(routeCountry&&cityCountry&&routeCountry!==cityCountry)continue;
    candidates.push({...city,...match});
  }
  if(via&&viaAt>0&&viaAt<length&&hav(via.coord,destination.coord)>1500){
    const match=candidates.findIndex(c=>searchKey(c.en||c.name)===searchKey(via.en||via.name)&&hav(c.coord,via.coord)<5000);
    if(match!==-1)candidates.splice(match,1);
    candidates.push({...via,off:0,along:viaAt,via:true});
  }
  return candidates.sort((a,b)=>a.along-b.along);
}
function setTargets(list){
  const candidates=routeCityCandidates(list,dest,routeLength,project,routeViaPlace,viaRouteDistance,activeCityBoundaries,activeCitySamples,pointOnRoute,regionAt,routeRoads);
  targets=[];
  for(const c of candidates){
    const key=(c.en||c.name).normalize('NFKD').toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g,'');
    const duplicate=targets.some(t=>hav(c.coord,t.coord)<200||((t.key===key)&&Math.abs(t.at-c.along)<10000));
    if(!duplicate||c.via)targets.push({...c,key,at:c.along,routeCoord:pointOnRoute(c.along)});
  }
  targets.push({...dest,at:routeLength,final:true});cityTargets=targets.map(c=>({...c,kind:'city'}));rebuildRoadTargets();render();drawRoute();if(lastPos)drawPosition(lastPos);
}
function distanceToSegment(p,a,b){
  const k=Math.cos(p[1]*Math.PI/180),x=(b[0]-a[0])*k,y=b[1]-a[1],px=(p[0]-a[0])*k,py=p[1]-a[1];
  const t=Math.max(0,Math.min(1,(px*x+py*y)/(x*x+y*y||1)));
  return hav(p,[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
}
function discoveryChunks(line){
  // Simplify to a continuous corridor, with at most 1 km deviation from the road.
  if(line.length<2)return [];
  const keep=new Set([0,line.length-1]),stack=[[0,line.length-1]];
  while(stack.length){const [a,b]=stack.pop();let far=1000,index=-1;
    for(let i=a+1;i<b;i++){const d=distanceToSegment(line[i],line[a],line[b]);if(d>far){far=d;index=i}}
    if(index!==-1){keep.add(index);stack.push([a,index],[index,b])}
  }
  const reduced=[...keep].sort((a,b)=>a-b).map(i=>line[i]),simple=[reduced[0]],chunks=[];
  for(let i=1;i<reduced.length;i++){const a=reduced[i-1],b=reduced[i],steps=Math.ceil(hav(a,b)/50000);for(let j=1;j<=steps;j++)simple.push([a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps])}
  let chunk=[simple[0]],length=0;
  for(let i=1;i<simple.length;i++){
    length+=hav(simple[i-1],simple[i]);chunk.push(simple[i]);
    if(length>=350000||chunk.length>=70){chunks.push(chunk);chunk=[simple[i]];length=0}
  }
  if(chunk.length>1)chunks.push(chunk);return chunks;
}

async function discoverCities(token,revision=routeRevision){
  const chunks=discoveryChunks(coords),found=[...known];let completed=0,failures=0,hasCatalog=false;
  const current=()=>token===session&&revision===routeRevision&&!isDemo;
  discoveryBusy=true;$('retry-cities').hidden=true;
  $('discovery-status').textContent="Finding cities along your route\u2026";
  const municipalFiles=[];
  if(coords.some(([x,y])=>x>=-139.1&&x<=-114&&y>=48.2&&y<=60.1))municipalFiles.push('bc-municipalities.json?v=1');
  if(chunks.some(chunk=>chunk.some(point=>regionAt(point)?.country==='CA')))municipalFiles.push('ca-municipalities.json?v=1');
  const [catalog,...municipalities]=await Promise.allSettled([
    loadCatalog(),
    ...municipalFiles.map(loadMunicipalBoundaries),
  ]);
  if(!current())return;
  if(catalog.status==='fulfilled'){found.push(...catalog.value);hasCatalog=true}
  for(const municipalitiesResult of municipalities){
    if(municipalitiesResult.status!=='fulfilled')continue;
    for(const [name,entries] of municipalitiesResult.value){
      const existing=activeCityBoundaries.get(name)||[];
      activeCityBoundaries.set(name,[...existing,...entries]);
    }
  }
  setTargets(found);

  for(const chunk of chunks){
    if(!current())return;
    $('discovery-status').textContent="Checking the entire route: "+integer(completed)+" of "+integer(chunks.length)+" sections";
    const path=chunk.flatMap(c=>[c[1].toFixed(5),c[0].toFixed(5)]).join(',');
    const countries=[...new Set(chunk.map(point=>regionAt(point)?.country).filter(Boolean))];
    const area=countries.length?'area["ISO3166-1"~"^('+countries.join('|')+')$"][admin_level=2]->.countries;':'';
    const scope=countries.length?'(area.countries)':'';
    const body='[out:json][timeout:18];'+area+
      'node'+scope+'[place~"^(city|town|village)$"](around:16000,'+path+');out body;'+
      'relation'+scope+'[boundary=administrative][admin_level~"^(6|7|8|9|10)$"][name](around:2500,'+path+');out geom;';

    try{
      const json=await getJSON('https://overpass-api.de/api/interpreter',{method:'POST',body:new URLSearchParams({data:body})});
      if(!current())return;
      if(!Array.isArray(json.elements)||json.remark)throw Error('incomplete');
      found.push(...json.elements.filter(n=>n.type==='node'&&n.tags).map(n=>({name:n.tags['name:en']||n.tags.name,en:n.tags['name:en']||n.tags.name||'',coord:[n.lon,n.lat]})).filter(c=>c.name&&c.coord.every(Number.isFinite)));
      indexCityBoundaries(json.elements,activeCityBoundaries);
      setTargets(found);
    }catch{if(!current())return;failures++}
    completed++;
  }
  if(!current())return;discoveryBusy=false;
  const count=cityTargets.filter(t=>!t.final&&t.at>=progress-150).length;
  $('discovery-status').textContent=failures?(hasCatalog?"City database loaded; online details unavailable for "+integer(failures)+" sections.":"Partial list: "+integer(failures)+" sections unavailable."):integer(count)+" cities before your destination \u00b7 Entire route checked";
  $('retry-cities').hidden=!failures;
  message(failures?(hasCatalog?"Cities loaded from the regional database. Additional online town details are unavailable.":"Some city information could not be loaded. Use Retry to complete the list."):"All identified cities on your route to "+dest.name+" are listed in route order.");
}
function activateRoute(route,via,c,token) {
  const revision=++routeRevision;
  prepare(route.geometry.coordinates,route.distance);
  activeCityBoundaries=new Map();activeCitySamples=routeCitySamples(coords);
  buildTravelProfile(route);
  routeManeuvers=buildRouteManeuvers(route);
  routeViaPlace=via?.points?null:via;
  viaRouteDistance=routeViaPlace?(route.legs?.[0]?.distance??null):null;
  let along=0;
  highwayWaypoints=(via?.points||[]).map((coord,index)=>({coord,at:along+=route.legs[index].distance}));
  const point=project(lastPos||c);
  progress=point.off<=Math.max(45,(lastAccuracyMeters||0)*2)?point.along:0;
  guidanceOffRoute=false;
  offRouteFixes=0;
  resetSpeedContext();
  roadFacilities=[];
  facilityLoadRevision++;
  setTargets(known);
  refreshRoadContext(token,revision);
  scanFacilities(token,revision);
  loadSpeedAhead(true);
  const viaName=route.highwayName||via?.name;
  $('route-label').textContent='Your location → '+(viaName?viaName+' → ':'')+dest.name;
  $('route-type').textContent=viaName?'Via '+viaName:'Road route';
  $('map-status').textContent='Calculated route';
  $('hero-state').textContent='Live GPS';
  message('Route ready. Finding cities ahead…');
  discoverCities(token,revision);
  window.rahyarPersistTrip?.(route,via);
}
const ONTARIO_HIGHWAYS={
  'on-11':{name:'Hwy 11 · North Bay to Nipigon',points:[[-79.44322,46.312769],[-79.748986,46.927422],[-80.330601,48.430449],[-82.998646,49.551972],[-88.320757,49.010646]]},
  'on-17':{name:'Hwy 17 · North Bay to Nipigon',points:[[-79.44322,46.312769],[-79.656131,46.359229],[-81.05644,46.443109],[-84.291892,46.539192],[-85.916306,48.691448],[-88.320757,49.010646]]},
};
function northernOntarioVia(key,[x,y],[dx,dy]){
  const atNorthBay=x>=-79.55&&x<=-79.40&&y>=46.31&&y<=46.43;
  const approaching=x>-79.40||(x>=-83.5&&y<46.31);
  if((!atNorthBay&&!approaching)||dx>-88.32||dy<47.4)return null;
  const corridor=ONTARIO_HIGHWAYS[key];
  return atNorthBay?{...corridor,points:corridor.points.slice(1)}:corridor;
}
const BC_17_91={name:'Hwy 1 → 17 → 91',points:[[-122.89656,49.193327]]};

function bcHighwayOption([x,y],[dx,dy]){
  return x>=-122.57&&x<=-119.7&&y>=48.95&&y<=51&&
    dx>=-123.35&&dx<=-122.86&&dy>=49.10&&dy<=49.32 ? BC_17_91 : null;
}
function usesBC17And91(route){
  const steps=(route.legs||[]).flatMap(leg=>leg.steps||[]);
  const h17=steps.findIndex(step=>/\b(?:BC|Highway) 17\b/i.test(step.ref||step.name||''));
  const after17=steps.slice(h17+1);
  return h17>0&&steps.slice(0,h17).some(step=>/\b(?:TCH|BC) 1\b/i.test(step.ref||''))&&
    after17.some(step=>/\bBC 91\b/i.test(step.ref||''))&&
    !after17.some(step=>/\bBC 91A\b/i.test(step.ref||''));
}
async function calculate(c,token,heading) {
  if(!dest||routeBusy||token!==session)return;
  routeBusy=true;
  lastRouteAt=Date.now();
  const preset=pendingVia?.ontarioHighway;
  const via=preset?northernOntarioVia(preset,c,dest.coord):pendingVia;
  if(preset){
    pendingVia=via;
    $('route-via-note').textContent=via?'':'This option is for westbound trips through North Bay and Nipigon. Automatic routing is in use.';
    if(!via){$('route-via').value='';updateViaLabel()}
  }
  $('retry-route').hidden=true;
  message(coords.length?'Recalculating from your current location…':'Calculating '+vehicleLabel(activeRouteVehicle)+' routes…');
  updateRouteGuidance();
  try {
    const points=[c,...(via?.points|| (via?[via.coord]:[])),dest.coord];
    try { await loadRegions(); }
    catch { throw Object.assign(new Error('Could not load country boundaries'), {code:'RouteCountryUnavailable'}); }
    if(token!==session)return;
    const startCountry=regionAt(tripDeparture?.place.coord||c)?.country;
    const destinationCountry=dest.country||regionAt(dest.coord)?.country;
    if(!startCountry||!destinationCountry)throw Object.assign(new Error('Could not locate a trip endpoint'), {code:'RouteCountryUnavailable'});
    const isNorthAmerican=code=>code==='CA'||code==='US';
    if(isNorthAmerican(startCountry)!==isNorthAmerican(destinationCountry)){
      throw Object.assign(new Error('Different routing regions'), {code:'RouteRegionMismatch'});
    }
    const canadaOnly=startCountry==='CA'&&destinationCountry==='CA';
    const suggested=!via?bcHighwayOption(c,dest.coord):null;
    const [routes,extra]=await Promise.all([
      requestRoadRoutes(points,undefined,undefined,heading,canadaOnly),
      suggested?requestRoadRoutes([c,...suggested.points,dest.coord],0,15000,heading,canadaOnly).catch(()=>[]):[],
    ]);
    if(token!==session)return;
    if(via?.points)for(const route of routes){route.highwayName=via.name;route.highwayVia=via}
    else if(via)for(const route of routes)route.cityVia=via;
    if(suggested){
      const existing=routes.find(usesBC17And91);
      if(existing){existing.highwayName=suggested.name;existing.highwayVia=null}
      else {
        const alternate=extra.find(usesBC17And91);
        if(alternate){alternate.highwayName=suggested.name;alternate.highwayVia=suggested;routes.push(alternate)}
      }
    }
    if(!routes.length)throw Error('No route returned');
    let index=0;
    if(selectedAlternative&&coords.length){
      const scores=routes.map(routeContinuity);
      index=scores.indexOf(Math.max(...scores));
    }
    displayRouteChoices(routes,index);
    pendingVia=routes[index].highwayVia||routes[index].cityVia||via;
    activateRoute(routes[index],pendingVia,c,token);
  } catch(error) {
    if(token!==session)return;
    console.warn('Route loading failed',error);
    const routeError = truckRouteErrorMessage(error);
    message(routeError,true);
    $('hero-state').textContent='Route unavailable';
    if(!coords.length)$('trip-summary-empty').textContent=routeError;
    $('retry-route').hidden=false;
  } finally {
    if(token===session){routeBusy=false;updateRouteGuidance()}
  }
}
function onPosition(p,token) {
  if(token!==session)return;
  const c=[p.coords.longitude,p.coords.latitude];
  lastPos=c;
  gpsTime=Date.now();
  if(!tripDeparture)tripDeparture={place:{coord:c},time:new Date(gpsTime)};
  recordGpsHeading(p.coords,c);
  timingSnapshot=gpsTime;
  lastSpeedMps=Number.isFinite(p.coords.speed)?p.coords.speed:null;
  lastAccuracyMeters=p.coords.accuracy;
  updateGpsStatus('GPS connected · Accuracy '+nearDistance(lastAccuracyMeters));


  $('status').textContent='● Live location';
  $('hero-state').textContent='Live GPS';
  $('update').textContent='Updated: '+new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const heading=p.coords.speed>=3&&p.coords.accuracy<=25&&Date.now()-p.timestamp<=5000?p.coords.heading:null;
  const mayRetry=$('retry-route').hidden&&Date.now()-lastRouteAt>=8000;
  if(!coords.length) {
    drawPosition(c);
    updateRegionPanel();
    if(mayRetry)calculate(c,token,heading);
    return;
  }
  const point=project(c);
  const reliable=Number.isFinite(lastAccuracyMeters)&&lastAccuracyMeters<=50;
  const off=point.off>Math.max(45,lastAccuracyMeters*2);
  if(off) {
    arrivalFixes=0;lastArrivalFix=null;
    offRouteFixes=reliable?offRouteFixes+1:0;
    guidanceOffRoute=true;
    drawPosition(c);
    updateRegionPanel();
    updateRouteGuidance();
    if(mayRetry&&reliable&&(offRouteFixes>=2||point.off>=150))calculate(c,token,heading);
    return;
  }
  guidanceOffRoute=false;
  offRouteFixes=0;
  progress=Math.max(0,point.along);
  drawPosition(c);
  if(pendingVia?.points&&reliable&&highwayWaypoints[0]?.at<=progress-15){
    highwayWaypoints=highwayWaypoints.filter(point=>point.at>progress-15);
    pendingVia=highwayWaypoints.length?{...pendingVia,points:highwayWaypoints.map(point=>point.coord)}:null;
    displayRouteChoices([]);
  }
  if(pendingVia&&viaRouteDistance!==null&&reliable&&progress>=viaRouteDistance-15){pendingVia=null;displayRouteChoices([])}
  if(confirmTripArrival(c,p.timestamp)){endTrip(true);return}
  refreshLiveProgress();
}
function refreshLiveProgress() {
  const next=targets.find(t=>t.at>=progress-150&&facilityVisible(t));
  if(next!==weatherRows.values().next().value?.city){render();return}
  updateRegionPanel();
  updateDistanceCells();
  updateMainTripSummary();
  refreshFocusSummary(false);
  updateRouteGuidance();
  updateDrivingHud();
}
function stopWatch(){setScreenAwakeReason('trip',false);if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;session++;routeBusy=false;$('route-vehicle').disabled=false;displayRouteChoices([]);selectedAlternative=false;$('start').hidden=!dest;$('start').textContent=coords.length?'Resume trip':'Start saved trip';$('stop').hidden=true;$('trip-actions').hidden=!dest;updateRouteGuidance()}
function endTrip(arrived=false){
  stopWatch();
  tripEndState=arrived?'Arrived at your destination':'Trip ended';
  if(arrived)speakNavigation('reached');
  else window.speechSynthesis?.cancel();
  coords=[];targets=[];routeLength=0;progress=0;routeManeuvers=[];routeRoads=[];guidanceOffRoute=false;
  resetRoadContext();
  if(routeLayer){routeLayer.remove();routeLayer=null}
  for(const marker of markers)marker.remove();
  markers=[];
  routeRevision++;
  syncNavigationData();
  $('end-trip').hidden=true;
  $('retry-route').hidden=true;
  $('retry-cities').hidden=true;
  $('start').textContent='Start saved trip';
  $('mode').textContent=tripEndState;
  $('status').textContent=tripEndState;
  $('hero-state').textContent=tripEndState;
  $('route-type').textContent=tripEndState;
  $('map-status').textContent=tripEndState;
  $('trip-summary-empty').textContent=tripEndState;
  $('discovery-status').textContent='Start a new trip to see cities along your route.';
  updateGpsStatus('Trip tracking stopped.');
  render();
  updateRouteGuidance();
}
function start(){
  if(!dest){message('Choose a city or street address before starting the trip.',true);$('query').focus();return}
  const vehicle=$('route-vehicle').value;
  let profile=null;
  if(vehicle==='truck'){
    profile=readTruckProfile();
    if(!profile){reviewTruckProfileBeforeStart(false);return}
    if(truckProfileNeedsReview){
      if(document.body.classList.contains('driving'))exitDriving();
      reviewTruckProfileBeforeStart();
      return;
    }
    persistTruckProfile(profile);
  }
  unlockNavigationAudio();
  if(spokenAlerts&&!voiceActivated)speakNavigation('enabled');
  resetMapHeading();if(!navigator.geolocation){updateGpsStatus("Location is not available in this browser. Open this link in Safari or Chrome.",true);return}stopWatch();tripEndState='';arrivalFixes=0;lastArrivalFix=null;spokenManeuvers.clear();$('end-trip').hidden=false;activeRouteVehicle=vehicle;activeTruckProfile=profile;mainMapBrowsing=false;pendingVia=selectedVia();viaRouteDistance=null;offRouteFixes=0;setScreenAwakeReason('trip',true);isDemo=false;tripDeparture=null;$('trip-summary-empty').textContent='Calculating your '+vehicleLabel(vehicle)+' route…';resetRoadContext();travelDistances=[0];travelSeconds=[0];timingSnapshot=Date.now();discoveryBusy=false;$('retry-cities').hidden=true;$('discovery-status').textContent="Cities will load after GPS connects.";coords=[];targets=[];routeLength=0;progress=0;lastPos=null;gpsTime=0;routeManeuvers=[];guidanceOffRoute=false;lastRouteAt=0;$('retry-route').hidden=true;syncNavigationData();render();if(map){if(routeLayer)map.removeLayer(routeLayer);markers.forEach(m=>map.removeLayer(m));if(positionLayer)map.removeLayer(positionLayer);positionLayer=null}const token=session;$('route-vehicle').disabled=true;updateGpsStatus("Waiting for location permission and GPS\u2026");$('mode').textContent="Live trip";$('hero-state').textContent="Waiting for GPS";$('status').textContent="\u25cc Connecting GPS";$('start').hidden=true;$('stop').hidden=false;$('trip-actions').hidden=false;$('route-label').textContent="Your location \u2192 "+dest.name;message('');watch=navigator.geolocation.watchPosition(p=>onPosition(p,token),e=>{if(token!==session)return;gpsError(e);stopWatch()},{enableHighAccuracy:true,maximumAge:3000,timeout:20000});updateRouteGuidance()}
$('retry-route').onclick=()=>{if(lastPos&&!isDemo&&!routeBusy)calculate(lastPos,session)};for(const id of ['route-choice','focus-route-choice'])$(id).onchange=()=>chooseRoute(Number($(id).value));$('route-via').onchange=()=>{$('route-via-note').textContent='';updateViaLabel();if(watch!==null)start()};$('start').onclick=start;$('end-trip').onclick=()=>endTrip();$('stop').onclick=()=>{stopWatch();updateGpsStatus("GPS stopped. City search is available.");$('status').textContent="Location paused";$('hero-state').textContent="Paused";message("Tracking paused. Distances and arrival estimates are frozen at the last update.")};$('destination').onchange=()=>{const c=destinations[$('destination').value];if(c)selectDestination(c)};
function selectDestination(city,startNow=true){
  if(!city)return;clearTruckProfileStart();const active=watch!==null,wasDemo=isDemo;dest=city;tripEndState='';$('save-current-destination').disabled=false;if(!active)$('end-trip').hidden=true;isDemo=false;drawMapPin(city.mapPin ? city.coord : null);
  try{localStorage.setItem('rahyar.lastDestination',JSON.stringify(city))}catch{}
  if(startNow||active){start();return}
  if(wasDemo||coords.length){tripDeparture=null;stopWatch();resetRoadContext();coords=[];targets=[];routeLength=0;progress=0;travelDistances=[0];travelSeconds=[0];$('update').textContent='';syncNavigationData();if(map){if(routeLayer)map.removeLayer(routeLayer);routeLayer=null;markers.forEach(m=>map.removeLayer(m));markers=[]}}
  $('trip-summary-empty').textContent='Start a live trip to see your route and weather.';
  $('start').hidden=false;$('trip-actions').hidden=false;$('mode').textContent='Destination selected';$('status').textContent=lastPos?'Current location ready':'Waiting for location';$('hero-state').textContent='Destination selected';$('discovery-status').textContent='Start your saved trip to calculate the route.';$('route-label').textContent='Your location → '+(dest.addressLabel||dest.name);render();message('');
}
$('retry-cities').onclick=()=>{if(!isDemo&&coords.length&&!discoveryBusy)discoverCities(session)};
const provinceNames={'01':'Alberta','02':'British Columbia','03':'Manitoba','04':'New Brunswick','05':'Newfoundland and Labrador','07':'Nova Scotia','08':'Ontario','09':'Prince Edward Island','10':'Québec','11':'Saskatchewan','12':'Yukon','13':'Northwest Territories','14':'Nunavut'};
const cityAliases={Toronto:['تورنتو'],Vancouver:['ونکوور','ونکور'],Calgary:['کلگری','کالگری'],Winnipeg:['وینیپگ','وینیپک','وینپگ'],Montréal:['مونترال','مونترآل','Montreal'],Ottawa:['اتاوا','اوتاوا'],'New York':['نیویورک','نیو یورک','New York City'],Seattle:['سیاتل'],Chicago:['شیکاگو'],Edmonton:['ادمونتون'],'Los Angeles':['لس آنجلس','لس انجلس','لس‌آنجلس']};
function searchKey(value){return String(value||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\s\u200c\u200d\p{P}]/gu,'')}
function localCityMatches(query,catalog){
  const q=searchKey(query),ranked=[];
  for(const c of [...known,...catalog]){
    const names=[c.name,c.en,...(c.aliases||[]),...(cityAliases[c.en]||[])];
    let score=Infinity;
    for(const name of names){const key=searchKey(name);if(key===q)score=0;else if(key.startsWith(q))score=Math.min(score,1);else if(key.includes(q))score=Math.min(score,2)}
    const region=c.country==='CA'?(provinceNames[c.region]||c.region):c.region;
    if(!Number.isFinite(score)&&[c.country, countryName(c.country), ...(c.country==='GB'?['UK','England','Scotland','Wales','Northern Ireland']:[])].some(country=>searchKey([c.name,region,country].join(' ')).includes(q)||searchKey([c.name,country].join(' ')).includes(q)))score=3;
    if(Number.isFinite(score))ranked.push({...c,score,regionLabel:region||''});
  }
  ranked.sort((a,b)=>a.score-b.score||a.name.length-b.name.length||a.name.localeCompare(b.name));
  const matches=[];
  for(const c of ranked){
    if(matches.some(t=>hav(t.coord,c.coord)<2000&&searchKey(t.en)===searchKey(c.en)))continue;
    // Prefer the catalog record so homonymous cities have a country and state/province.
    const match=c.country?c:catalog.find(t=>hav(t.coord,c.coord)<2000&&searchKey(t.en)===searchKey(c.en));
    matches.push(match?{...c,...match,regionLabel:match.country==='CA'?(provinceNames[match.region]||match.region):match.country==='US'?match.region:''}:c);
    if(matches.length>=16)break;
  }
  return matches;
}
function setSearchedDestination(city,startNow=true){
  destinations.custom=city;
  const picker=$('destination');
  let option=picker.querySelector('[value="custom"]');
  if(!option){option=new Option('', 'custom');picker.append(option)}
  const label=city.addressLabel||city.name;
  option.textContent=label;picker.value='custom';
  $('results').replaceChildren();$('query').value=city.mapPin ? label : '';
  $('search-status').textContent='Destination selected: '+label;
  selectDestination(city,startNow);
}
function restoreLastDestination(){
  let city;
  try{city=JSON.parse(localStorage.getItem('rahyar.lastDestination'))}catch{return}
  if(typeof city?.name!=='string'||!city.name||city.coord?.length!==2||!Array.isArray(city.coord)||
    !city.coord.every(Number.isFinite)||Math.abs(city.coord[0])>180||Math.abs(city.coord[1])>90)return;
  setSearchedDestination(city,false);
}
let placeSearchMode = 'destination';

function setPlaceSearchMode(mode) {
  clearPendingMapPin();
  requestId++;
  placeSearchMode = mode;
  const isStop = mode === 'stop';
  const isWatch = mode === 'watch';
  const field = $('query');
  $('place-search-label').textContent = isStop ? 'Intermediate stop' : isWatch ? 'Watchlist city' : 'Destination';
  field.placeholder = isWatch ? 'City name' : 'City, address or postal code';
  field.value = '';
  $('results').replaceChildren();
  $('search').disabled = false;
  $('search-for-stop').setAttribute('aria-pressed', String(isStop));
  $('search-for-watch').setAttribute('aria-pressed', String(isWatch));
  $('search-for-stop').textContent = isStop ? 'Cancel stop search' : 'Search for a stop';
  $('search-for-watch').textContent = isWatch ? 'Cancel watchlist search' : 'Find a watchlist city';
  $('search-status').textContent = isStop ? 'Select a result to add a stop.' :
    isWatch ? 'Select a city to save it to your Dashboard watchlist.' : 'Select a result to start your trip.';
  if (isStop || isWatch) field.focus();
}

function showCityResults(matches) {
  const mode = placeSearchMode;
  const results = $('results');
  results.replaceChildren();
  for (const city of matches) {
    const country = countryName(city.country);
    if (mode === 'watch' && (city.isAddress || city.addressLabel)) continue;
    const button = document.createElement('button');
    button.type = 'button';
    const address = city.postalMismatch ? city.providerAddress : city.addressLabel;
    button.textContent = (address || [city.name, city.regionLabel || (['CA','US'].includes(city.country) ? city.region : ''), country].filter(Boolean).join(', ')) +
      (city.mapPin ? ' · Navigate to pin' : city.postalMismatch ? ' · Postal code differs' : city.matchNote ? ' · ' + city.matchNote : '');
    button.onclick = () => {
      setPlaceSearchMode('destination');
      if (mode === 'stop') setCustomVia(city);
      else if (mode === 'watch') {
        addFocusWatchCity(city);
        $('search-status').textContent = city.name + ' saved to your Dashboard watchlist.';
      } else setSearchedDestination(address ? {...city,addressLabel:address} : city);
    };
    if (mode !== 'destination') {
      results.append(button);
      continue;
    }
    const row = document.createElement('div');
    row.className = 'saveable-search-result';
    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = city.mapPin ? 'Save this pin' : 'Save';
    save.setAttribute('aria-label','Save '+(address || city.name));
    save.onclick = () => openSavePlace(city);
    row.append(button,save);
    results.append(row);
  }
}

async function search(){return searchPlaces()}

function updateGpsStatus(text,error=false){
  for(const id of ['gps-status','settings-gps-status']){
    $(id).textContent=text;
    $(id).classList.toggle('error',error);
  }
  if(error)$('gps-help').open=true;
}
function gpsError(e){
  const text=e.code===1?"Location permission denied. Open in Safari or Chrome and set Location to Allow in site settings.":e.code===2?"Location unavailable. Turn on Location Services on your phone and try again.":"GPS timed out. Try again outdoors.";
  if(!coords.length)$('trip-summary-empty').textContent='Waiting for GPS to calculate your route.';
  updateGpsStatus(text,true);message('');$('status').textContent="GPS unavailable";$('hero-state').textContent="No GPS";
}
let tripDeparture=null;
let travelDistances=[0],travelSeconds=[0],timingSnapshot=Date.now(),weatherObserver;
const forecastCache=new Map(),weatherQueue=new Map(),cityFormatters=new Map();let weatherBusy=false;
const weatherRows=new Map();
function buildTravelProfile(route){
  travelDistances=[0];travelSeconds=[0];
  for(const leg of route.legs||[]){const a=leg.annotation||{distance:leg.steps?.map(step=>step.distance),duration:leg.steps?.map(step=>step.duration)};if(!a.distance||!a.duration)continue;
    for(let i=0;i<a.distance.length;i++){const d=a.distance[i],t=a.duration[i];if(!Number.isFinite(d)||!Number.isFinite(t)||d<0||t<0)continue;travelDistances.push(travelDistances.at(-1)+d);travelSeconds.push(travelSeconds.at(-1)+t)}
  }
  if(travelDistances.length<2||travelDistances.at(-1)<=0){travelDistances=[0,route.distance];travelSeconds=[0,route.duration]}
  else{const ds=route.distance/travelDistances.at(-1),ts=route.duration/(travelSeconds.at(-1)||1);travelDistances=travelDistances.map(d=>d*ds);travelSeconds=travelSeconds.map(t=>t*ts)}
  timingSnapshot=Date.now();
}
function timeAtDistance(distance){
  if(travelDistances.length<2||!Number.isFinite(travelSeconds.at(-1)))return null;
  const d=Math.max(0,Math.min(distance,travelDistances.at(-1)));let lo=0,hi=travelDistances.length-1;
  while(lo+1<hi){const m=(lo+hi)>>1;if(travelDistances[m]<=d)lo=m;else hi=m}
  const span=travelDistances[hi]-travelDistances[lo],f=span?(d-travelDistances[lo])/span:0;
  return travelSeconds[lo]+f*(travelSeconds[hi]-travelSeconds[lo]);
}
function arrivalFor(city){
  const end=timeAtDistance(city.at),start=timeAtDistance(progress);if(end===null||start===null)return null;
  const clock=(!isDemo&&watch!==null&&(!gpsTime||Date.now()-gpsTime<25000))?Date.now():timingSnapshot;
  return new Date(clock+Math.max(0,end-start)*1000);
}
function forecastKey(city){return city.coord.map(c=>c.toFixed(3)).join(',')}
function arrivalLabel(date,city){
  if(!date)return {time:'—',detail:'Waiting for a route'};
  const cached=forecastCache.get(forecastKey(city));const zone=city.zone||cached?.data?.timezone;
  const opts=zone?{timeZone:zone}:{};
  try{const key=zone||'device';if(!cityFormatters.has(key))cityFormatters.set(key,{clock:new Intl.DateTimeFormat('en-US',{...opts,hour:'numeric',minute:'2-digit',hour12:true}),detail:new Intl.DateTimeFormat('en-US',{...opts,month:'short',day:'numeric',timeZoneName:'short'})});const f=cityFormatters.get(key);return {time:f.clock.format(date),detail:f.detail.format(date)+(zone?'':' · Device time')}}catch{return {time:'—',detail:'Time zone unavailable'}}
}
function weatherCondition(code,isDay=1){
  if(code===0)return [isDay?'Clear':'Clear night',isDay?'sun':'moon'];
  if(code===1)return ['Mostly clear',isDay?'sun':'moon'];
  if(code===2)return ['Partly cloudy','partly'];if(code===3)return ['Overcast','cloud'];
  if([45,48].includes(code))return ['Fog','fog'];
  if([56,57,66,67].includes(code))return ['Freezing rain','ice-warning'];
  if([51,53,55].includes(code))return ['Drizzle','rain'];
  if([61,63,65].includes(code))return ['Rain','rain'];
  if([71,73,75,77,85,86].includes(code))return ['Snow','snow'];
  if([80,81,82].includes(code))return ['Rain showers','rain'];
  if([95,96,99].includes(code))return ['Thunderstorm','storm'];
  return ['Unknown conditions','unknown'];
}
function weatherIcon(type,label){
  const cloud='<path d="M7 20a5 5 0 0 1-.5-10A7 7 0 0 1 20 9a5.5 5.5 0 1 1 1 11H7Z"/>';
  const paths={sun:'<circle cx="16" cy="16" r="6"/><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3"/>',moon:'<path d="M25 21A12 12 0 0 1 11 4a12 12 0 1 0 14 17Z"/>',cloud,partly:'<path d="M7 7 5 5m8 0V2m7 5 2-2M4 13H1"/><path d="M6 15a6 6 0 1 1 11-4"/>'+cloud,rain:cloud+'<path d="m9 24-2 5m9-5-2 5m9-5-2 5"/>',snow:cloud+'<path d="M9 24v6m-3-3h6m8-3v6m-3-3h6"/>',fog:cloud+'<path d="M3 25h26M6 29h20"/>','ice-warning':'<path d="M16 3 30 29H2L16 3Z"/><path d="M16 12v8m0 4v1"/>',storm:cloud+'<path d="m17 19-5 7h5l-3 6"/>',unknown:'<circle cx="16" cy="16" r="12"/><path d="M13 12a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 5h.01"/>'};
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 32 34');svg.setAttribute('class','weather-icon');svg.setAttribute('role','img');svg.setAttribute('aria-label',label);svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.innerHTML=paths[type]||paths.unknown;return svg;
}
function forecastAt(data,date){
  const h=data?.hourly;if(!h?.time?.length||!date)return null;const seconds=date.getTime()/1000;
  if(seconds<h.time[0]-1800||seconds>h.time.at(-1)+1800)return {outside:true};
  let lo=0,hi=h.time.length-1;while(lo<hi){const m=(lo+hi)>>1;if(h.time[m]<seconds)lo=m+1;else hi=m}
  let i=lo;if(i&&Math.abs(h.time[i-1]-seconds)<Math.abs(h.time[i]-seconds))i--;
  const temp=h.temperature_2m?.[i],code=h.weather_code?.[i];
  if(!Number.isFinite(temp)||!Number.isFinite(code))return null;
  return {temp,code,isDay:h.is_day?.[i]??1,time:h.time[i]};
}
function renderWeather(cell,city,date=arrivalFor(city)){
  cell.replaceChildren();let forecast;
  if(isDemo)forecast={temp:city.sampleTemp??7,code:city.sampleCode??2,isDay:1};
  else{const cached=forecastCache.get(forecastKey(city));forecast=forecastAt(cached?.data,date);
    if(!forecast){const p=document.createElement('span');p.className='weather-placeholder';p.textContent=!date?'Waiting for route':cached?.status==='error'?'Forecast unavailable':cached?.status==='loading'||cached?.status==='queued'?'Loading forecast…':'Forecast loads on view';cell.append(p);return}
  }
  if(forecast.outside){const p=document.createElement('span');p.className='weather-placeholder';p.textContent='Beyond forecast range';cell.append(p);return}
  const [label,icon]=weatherCondition(forecast.code,forecast.isDay),main=document.createElement('div'),temp=document.createElement('span'),desc=document.createElement('span');main.className='weather-main';temp.textContent=formatTemperature(forecast.temp);main.append(weatherIcon(icon,label),temp);desc.className='weather-desc';desc.textContent=label+(isDemo?' · Sample':'');
  if(icon==='ice-warning'&&!isDemo){
    main.classList.add('weather-ice');
    desc.classList.add('weather-ice-warning');
    desc.textContent='Black ice risk';
    desc.title='Freezing precipitation forecast for the displayed time. Road ice is not verified.';
  }
  cell.append(main,desc);
}
function ensureWeather(city,date=arrivalFor(city)){
  if(isDemo||!date)return;
  const key=forecastKey(city),cached=forecastCache.get(key);
  if(cached&&(cached.status==='queued'||cached.status==='loading'||cached.status==='error'||Date.now()-cached.fetchedAt<1800000))return;
  forecastCache.set(key,{status:'queued'});weatherQueue.set(key,city);pumpWeather();
}
async function pumpWeather(){
  if(weatherBusy||!weatherQueue.size)return;weatherBusy=true;
  const batch=[...weatherQueue.entries()].slice(0,4);for(const [key]of batch){weatherQueue.delete(key);forecastCache.set(key,{status:'loading'})}
  updateTripCells();
  try{
    const parameters=new URLSearchParams({latitude:batch.map(([,c])=>c.coord[1]).join(','),longitude:batch.map(([,c])=>c.coord[0]).join(','),hourly:'temperature_2m,weather_code,is_day',timezone:'auto',timeformat:'unixtime',forecast_days:'16'});
    const response=await getJSON('https://api.open-meteo.com/v1/forecast?'+parameters,{},18000),data=Array.isArray(response)?response:[response];
    batch.forEach(([key],i)=>{if(!data[i]?.hourly?.time?.length)throw Error('Missing forecast');forecastCache.set(key,{status:'ready',data:data[i],fetchedAt:Date.now()})});
  }catch{for(const [key]of batch)if(forecastCache.get(key)?.status!=='ready')forecastCache.set(key,{status:'error'})}
  finally{weatherBusy=false;updateTripCells();if(weatherQueue.size)pumpWeather()}
}
function updateMainTripSummary(){
  const ready=!!(coords.length&&dest);
  $('trip-summary-details').hidden=!ready;
  $('trip-summary-empty').hidden=ready;
  if(!ready)return [];
  const end=cityTargets.find(city=>city.final)||{...dest,at:routeLength};
  const date=arrivalFor(end),arrival=arrivalLabel(date,end);
  const totalTime=timeAtDistance(routeLength),elapsed=timeAtDistance(progress);
  const duration=totalTime===null||elapsed===null?null:Math.max(0,totalTime-elapsed);
  const minutes=duration===null?null:Math.round(duration/60);
  $('trip-destination-name').textContent=dest.name;
  const address=$('trip-destination-address');
  address.textContent=dest.addressLabel||'';
  address.hidden=!address.textContent||address.textContent===dest.name;
  const city=dest.locality||(dest.isAddress?dest.providerAddress?.split(',')[1]?.trim():'');
  $('trip-city').textContent=city||'—';
  $('trip-city-row').hidden=!dest.isAddress||!city||city===dest.name;
  $('trip-distance').textContent=fa(roadDistance(routeLength))+' '+distanceUnit();
  $('total').textContent=fa(roadDistance(routeLength-progress))+' '+distanceUnit();
  $('trip-eta').textContent=arrival.time;
  $('trip-eta-zone').textContent=arrival.detail;
  $('trip-duration').textContent=minutes===null?'—':(minutes>=60?Math.floor(minutes/60)+' h ':'')+minutes%60+' min';
  $('trip-city-count').textContent=integer(cityTargets.filter(city=>!city.final).length);
  $('trip-arrival-time').textContent=[arrival.time,arrival.detail].filter(Boolean).join(' · ');
  renderWeather($('trip-destination-weather'),end,date);
  if(!tripDeparture)return [end];
  const {place,time}=tripDeparture,departure=arrivalLabel(time,place);
  $('trip-departure-time').textContent=[departure.time,departure.detail].join(' · ');
  renderWeather($('trip-origin-weather'),place,time);
  return [end,place];
}
function updateTripCells(){
  refreshFocusSummary(false);
  updateRouteGuidance();
  for(const ref of weatherRows.values()){
    const label=arrivalLabel(arrivalFor(ref.city),ref.city);ref.eta.textContent=label.time;ref.zone.textContent=label.detail;renderWeather(ref.weather,ref.city);
  }
  const tripWeather=updateMainTripSummary();
  const failures=tripWeather.some(city=>forecastCache.get(forecastKey(city))?.status==='error')||
    [...weatherRows.values()].some(r=>forecastCache.get(forecastKey(r.city))?.status==='error');
  $('retry-weather').hidden=!failures;
  $('trip-retry-weather').hidden=!tripWeather.some(city=>forecastCache.get(forecastKey(city))?.status==='error');
  $('weather-status').textContent=isDemo?'Demo weather is illustrative, not a live forecast.':failures?'Some forecasts are unavailable. Distances and arrival estimates still work.':'Hourly forecast by Open-Meteo · Matched to estimated arrival · '+temperatureUnit();
}
function render(){
  updateRegionPanel();const remaining=targets.filter(t=>t.at>=progress-150&&facilityVisible(t)),next=remaining[0];$('city-count').textContent=integer(remaining.filter(t=>t.kind==='city'&&!t.final).length)+' cities · '+integer(remaining.filter(t=>t.kind!=='city').length)+' facilities';
  weatherObserver?.disconnect();weatherRows.clear();$('cities').replaceChildren();
  for(const [i,t]of remaining.entries()){
    const row=document.createElement('tr');if(!i)row.className='next-row';const city=document.createElement('td'),name=document.createElement('div'),b=document.createElement('b'),small=document.createElement('small');name.className='city-name';b.textContent=t.en||t.name;small.textContent=kindLabel(t)+(t.via?' · WAYPOINT':'')+(!i?' · NEXT':'');if(t.kind!=='city'){row.classList.add('facility-row');row.dataset.kind=t.kind;small.textContent+=isDemo?' · SAMPLE':t.sourceYear?' · '+t.sourceYear+' INVENTORY':' · NEAR ROUTE'}name.append(b,small);city.append(name);
    const distance=document.createElement('td');distance.className='city-distance';distance.textContent=fa(roadDistance(t.at-progress));
    const etaCell=document.createElement('td'),eta=document.createElement('span'),zone=document.createElement('span');eta.className='eta-value';zone.className='eta-zone';etaCell.append(eta,zone);
    const weather=document.createElement('td');row.append(city,distance,etaCell,weather);$('cities').append(row);weatherRows.set(row,{city:t,eta,zone,weather});
  }

  updateTripCells();updateDrivingHud();
  if(!isDemo&&coords.length){
    if(tripDeparture)ensureWeather(tripDeparture.place,tripDeparture.time);
    if(dest)ensureWeather({...dest,at:routeLength});
    if(next)ensureWeather(next);
    if(typeof IntersectionObserver!=='undefined'){weatherObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){const ref=weatherRows.get(e.target);if(ref)ensureWeather(ref.city);weatherObserver.unobserve(e.target)}},{rootMargin:'400px'});for(const row of weatherRows.keys())weatherObserver.observe(row)}
    else remaining.slice(0,8).forEach(ensureWeather);
  }
}
$('trip-retry-weather').onclick=$('retry-weather').onclick=()=>{for(const [key,value]of forecastCache)if(value.status==='error')forecastCache.delete(key);render()};

$('search').onclick=search;$('query').onkeydown=e=>{if(e.key==='Enter')search()};$('fit').onclick=()=>{if(map&&routeLayer){if(document.body.classList.contains('driving')){cockpitMapFollow=false;updateCockpitMapState()}else pauseMainMapFollow();map.fitBounds(routeLayer.getBounds(),{padding:[30,30]});fitNavigationRoute()}};function driving(){enterCockpit();setScreenAwakeReason('focus',true);requestFocusFullscreen(false)}$('drive').onclick=driving;function exitDriving(){leaveCockpit();setScreenAwakeReason('focus',false);setTimeout(()=>map?.invalidateSize(),100)}$('exit').onclick=exitDriving;setInterval(()=>{if(watch!==null&&gpsTime&&Date.now()-gpsTime>25000){$('status').textContent="Location stale \u00b7 Waiting for GPS";$('hero-state').textContent="Waiting for update"}updateRouteGuidance()},5000);setInterval(()=>{if(watch!==null&&!isDemo)updateTripCells()},30000);const viaSelect=$('route-via');
const highwayOptions=document.createElement('optgroup');
highwayOptions.label='Northern Ontario · westbound';
for(const [key,highway] of Object.entries(ONTARIO_HIGHWAYS))highwayOptions.append(new Option(highway.name,key));
viaSelect.append(highwayOptions);
for(const [label,keys] of quickStops){
  const group=document.createElement('optgroup');
  group.label=label;
  const details=document.createElement('details'),summary=document.createElement('summary'),buttons=document.createElement('div');
  summary.textContent=label;
  buttons.className='quick-stop-buttons';
  details.append(summary,buttons);
  for(const key of keys){
    const city=destinations[key];
    group.append(new Option(city.name,key));
    if(![...$('destination').options].some(option=>option.value===key))$('destination').append(new Option(city.name,key));
    const button=document.createElement('button');
    button.className='secondary';button.type='button';button.textContent=city.name;
    button.onclick=()=>{
      setPlaceSearchMode('destination');
      $('destination').value=key;
      $('search-status').textContent='Destination selected: '+city.name;
      selectDestination(city);
    };
    buttons.append(button);
  }
  viaSelect.append(group);
  $('popular-cities').append(details);
}
$('main-map-center').onclick=()=>{
  if(!lastPos){mainMapBrowsing=false;previewCurrentLocation();return}
  recenterOnVehicle();
};
$('refresh-app').onclick=()=>window.location.reload();
$('search-for-stop').onclick=()=>setPlaceSearchMode(placeSearchMode==='stop'?'destination':'stop');
$('search-for-watch').onclick=()=>setPlaceSearchMode(placeSearchMode==='watch'?'destination':'watch');
initSiteNotice(() => {
  initMap();
  initNavigationMap();
  initMapPin();
  initSavedPlaces();
  initNavigationAlerts();
  initRoadMapMarkers();
  initTraffic();
  initRoadControls();
  initDrivingHud();
  initScreenAwake();
  setScreenAwakeReason('app',true);
  initTrailerPresets();
  if (!restoreTruckProfile()) selectTrailerPreset('dry-van');
  initAppSettings();
  initTruckProfileControls();
  initVehicleChoice();
  initStartScreen();
});
