'use strict';
let focusRows=[],focusRowsKey='',cockpitMapHome=null,cockpitMapFollow=true,cockpitFullscreenOwned=false,fullscreenUnavailable=false;
function selectFocusPlaces(cities,facilities,at,destination,length){
  const final=cities.find(c=>c.final)||{...(destination||{name:'Choose a destination',en:'Choose a destination',coord:[0,0]}),kind:'city',final:true,at:length};
  const next=cities.filter(c=>!c.final&&c.at>at+20).sort((a,b)=>a.at-b.at).slice(0,3);
  const stop=facilities.filter(f=>['truck','service','rest'].includes(f.kind)&&facilityVisible(f)&&f.at>=at).sort((a,b)=>a.at-b.at)[0]||null;
  const inspection=facilities.filter(f=>f.at>=at&&isGovernmentFacility(f)&&facilityVisible(f)).sort((a,b)=>a.at-b.at)[0]||null;
  return {final,next,stop,inspection};
}
let focusWatchCities=[], focusWatchSlots=['',''];
try {
  const saved=JSON.parse(localStorage.getItem('rahyar-focus-watch')||'{}');
  if(Array.isArray(saved.cities))focusWatchCities=saved.cities;
  if(Array.isArray(saved.slots)&&saved.slots.length===2)focusWatchSlots=saved.slots;
} catch {}
function focusCityKey(city){
  return JSON.stringify([city.name,city.coord?.map(n=>Number(n.toFixed(4)))]);
}
function saveFocusWatch(){
  try{localStorage.setItem('rahyar-focus-watch',JSON.stringify({cities:focusWatchCities,slots:focusWatchSlots}))}catch{}
}
function addFocusWatchCity(city){
  const key=focusCityKey(city);
  if(!focusWatchCities.some(c=>focusCityKey(c)===key)){
    focusWatchCities.push({name:city.name,en:city.en,coord:city.coord,region:city.region,country:city.country});
    saveFocusWatch();
  }
  return key;
}
function sameFocusCity(a,b){
  return focusCityKey(a)===focusCityKey(b)||
    (a.coord&&b.coord&&searchKey(a.en||a.name)===searchKey(b.en||b.name)&&hav(a.coord,b.coord)<5000);
}
function focusWatchRows(ahead,allCities,final,at){
  const first=ahead[0]||null;
  let reset=false;
  const manual=focusWatchSlots.map((key,index)=>{
    const saved=focusWatchCities.find(c=>focusCityKey(c)===key);
    if(!saved||sameFocusCity(saved,final)||(first&&sameFocusCity(saved,first)))return null;
    const mapped=allCities.find(c=>!c.final&&sameFocusCity(c,saved));
    if(mapped&&!isDemo&&at>mapped.at+20){focusWatchSlots[index]='';reset=true;return null}
    if(mapped&&mapped.at>=at-20)return mapped;
    return null;
  });
  if(reset)saveFocusWatch();
  const automatic=ahead.slice(1).filter(c=>!manual.some(p=>p&&sameFocusCity(c,p)));
  return [first,manual[0]||automatic.shift(),manual[1]||automatic.shift()].filter(Boolean);
}
function refreshFocusWatchOptions(ahead){
  const available=ahead.map(city=>focusWatchCities.find(saved=>sameFocusCity(saved,city))||city);
  const key=JSON.stringify([available.map(focusCityKey),focusWatchSlots]);
  const selects=[$('focus-watch-2'),$('focus-watch-3')];
  if(selects[0].dataset.options===key)return;
  selects[0].dataset.options=key;
  selects.forEach((select,index)=>{
    select.replaceChildren(new Option('Automatic',''));
    available.forEach(c=>select.add(new Option([c.en||c.name,c.region].filter(Boolean).join(', '),focusCityKey(c))));
    select.value=available.some(c=>focusCityKey(c)===focusWatchSlots[index])?focusWatchSlots[index]:'';
    select.onchange=()=>{
      const selected=available.find(c=>focusCityKey(c)===select.value);
      const value=selected?addFocusWatchCity(selected):'';
      const other=focusWatchCities.find(c=>focusCityKey(c)===focusWatchSlots[1-index]);
      if(selected&&other&&sameFocusCity(selected,other))focusWatchSlots[1-index]='';
      focusWatchSlots[index]=value;
      saveFocusWatch();
      refreshFocusSummary(true);
    };
  });
}
function refreshFocusSummary(loadForecasts=false){
  if(!document.body.classList.contains('driving'))return;
  const chosen=selectFocusPlaces(cityTargets,roadFacilities,progress,dest,routeLength);
  if(coords.length&&watch!==null&&!isDemo&&activeRouteVehicle==='truck')chosen.inspection=nextAlertStation()||chosen.inspection;
  const ahead=coords.length?cityTargets.filter(c=>!c.final&&c.at>progress+20).sort((a,b)=>a.at-b.at):[];
  chosen.next=focusWatchRows(ahead,coords.length?cityTargets:[],chosen.final,progress);
  refreshFocusWatchOptions(ahead);
  const places=[chosen.final,...chosen.next,chosen.stop,chosen.inspection].filter(Boolean);
  const key=[session,routeRevision,isDemo,routeLength,...places.map(c=>[c.name,c.at,c.kind,c.coord?.join(',')].join(':'))].join('|');
  if(key!==focusRowsKey){
    focusRowsKey=key;focusRows=[];const box=$('focus-trip-summary');box.replaceChildren();
    const label=text=>{const node=document.createElement('div');node.className='focus-section-label';node.textContent=text;box.append(node)};
    const row=(city,kind)=>{const el=document.createElement('div');el.className='focus-place-row '+kind;const name=document.createElement('strong'),distance=document.createElement('strong'),etaBox=document.createElement('div'),eta=document.createElement('strong'),zone=document.createElement('small'),weather=document.createElement('div');name.className='focus-place-name';name.textContent=city.en||city.name;distance.className='focus-place-distance';const unit=document.createElement('small');const value=document.createElement('span');distance.append(value,unit);etaBox.className='focus-place-eta';weather.className='focus-place-weather';etaBox.append(eta,zone);el.append(name,distance,etaBox,weather);box.append(el);focusRows.push({city,distance:value,unit,eta,zone,weather})};
    const empty=text=>{const node=document.createElement('p');node.className='focus-empty';node.textContent=text;box.append(node)};
    label('FINAL DESTINATION');row(chosen.final,'focus-final');
    const headings=document.createElement('div');headings.className='focus-column-labels';for(const text of ['NEXT 3 CITIES','DISTANCE','ARRIVAL','WEATHER']){const span=document.createElement('span');span.textContent=text;headings.append(span)}box.append(headings);
    chosen.next.forEach(c=>row(c,'focus-city'));if(!chosen.next.length)empty(coords.length?'No more mapped cities before your destination.':'Start a trip to see the next cities.');
    label('NEXT TRUCK STOP / REST AREA');if(chosen.stop)row(chosen.stop,'focus-stop');else empty(facilityScanBusy?'Finding stops along your route…':'No truck stop or rest area identified ahead in loaded data.');
    label('NEXT GOVERNMENT INSPECTION / WEIGH STATION');
    if(chosen.inspection){row(chosen.inspection,'focus-stop');box.append(createStationReportPanel(chosen.inspection));}else empty(facilityScanBusy?'Finding stations…':'No mapped station ahead.');
  }
  $('focus-trip-summary').querySelector('.station-report-panel')?.refreshStatus();
  for(const ref of focusRows){
    const label=arrivalLabel(arrivalFor(ref.city),ref.city);ref.distance.textContent=coords.length?fa(roadDistance(ref.city.at-progress)):'—';ref.unit.textContent=distanceUnit();ref.eta.textContent=label.time;ref.zone.textContent=label.detail;ref.eta.parentElement.title=label.detail;renderWeather(ref.weather,ref.city);if(loadForecasts&&!isDemo)ensureWeather(ref.city)}
}
function followCockpitPosition(c,resetZoom=false){
  if(!c||!document.body.classList.contains('driving'))return;
  if(cockpitMapFollow)updateCockpitBearing();
  followNavigationPosition(c,resetZoom);
  if(map&&cockpitMapFollow&&!$('map').hidden){
    const expanded=document.body.classList.contains('map-expanded');
    const drop=document.body.classList.contains('navigation-redesign')?(map.getSize().y-(parseFloat(document.documentElement.style.getPropertyValue('--nav-sheet-height'))||112))*.65-map.getSize().y/2:Math.min(expanded?38:76,map.getSize().y*.19);
    const autoZoom=typeof followingZoom==='function'?followingZoom():null;
    const zoom=autoZoom===null ? (resetZoom?17:map.getZoom()) : Math.round(autoZoom);
    const scale=map.getZoomScale(zoom);
    const position=map.latLngToContainerPoint([c[1],c[0]]);
    const center=map.containerPointToLatLng(position.subtract([0,drop/scale]));
    if(resetZoom||zoom!==map.getZoom())map.setView(center,zoom,{animate:false});
    else map.panTo(center,{animate:true,duration:.35});
  }
  updateCockpitMapState();
}
function updateCockpitMapState(){
  if(!$('focus-map-state'))return;
  $('focus-map-state').textContent=isDemo?'DEMO MAP · Sample position':!gpsTime?'Waiting for GPS':watch===null?'GPS paused · Last known position':Date.now()-gpsTime>25000?'GPS stale · Last known position':cockpitMapFollow?'LIVE MAP · Following GPS':'LIVE MAP · Browse mode';
  $('focus-follow').title=cockpitMapFollow?'Following GPS':'Return to your vehicle';
}
function startCockpitLayout(){
  if(document.body.classList.contains('navigation-redesign')){
    document.body.classList.add('driving');cockpitMapFollow=true;focusRowsKey='';refreshFocusSummary(true);updateDrivingHud();updateRouteGuidance();setTimeout(()=>{navigationMap?.resize();map?.invalidateSize({pan:false});followCockpitPosition(lastPos||pointOnRoute(progress),true);},120);return;
  }
  const region=document.querySelector('.region-panel'),mapPanel=document.querySelector('.map-panel');
  if(!regionHome){regionHome=document.createComment('region home');region.before(regionHome)}
  $('focus-region-footer').append(region);
  if(mapPanel){if(!cockpitMapHome){cockpitMapHome=document.createComment('map home');mapPanel.before(cockpitMapHome)}$('focus-map-host').append(mapPanel)}
  $('tools-menu').open=false;
  layoutFocusMapOverlays(true);
  document.body.classList.add('driving');cockpitMapFollow=true;focusRowsKey='';window.scrollTo({top:0,behavior:'instant'});refreshFocusSummary(true);updateDrivingHud();updateRouteGuidance();
  setTimeout(()=>{navigationMap?.resize();map?.invalidateSize({pan:false});followCockpitPosition(lastPos||pointOnRoute(progress),true)},100);
}
function stopCockpitLayout(){
  if(document.body.classList.contains('navigation-redesign')){document.body.classList.remove('driving','map-expanded');resizeCockpitMap();return;}
  setFocusMapExpanded(false);
  $('dashboard-media').open=false;
  layoutFocusMapOverlays(false);
  if(map&&typeof map.setBearing==='function')map.setBearing(0);
  document.body.classList.remove('driving');const region=document.querySelector('.region-panel'),mapPanel=document.querySelector('.map-panel');
  if(regionHome?.parentNode)regionHome.parentNode.insertBefore(region,regionHome.nextSibling);
  if(cockpitMapHome?.parentNode&&mapPanel)cockpitMapHome.parentNode.insertBefore(mapPanel,cockpitMapHome.nextSibling);
  if(navigationMap){navigationMap.resize();if(!mainMapBrowsing)fitNavigationRoute()}
  if(cockpitFullscreenOwned)exitFocusFullscreen();setTimeout(()=>{if(map){map.invalidateSize({pan:false});if(routeLayer&&!mainMapBrowsing)map.fitBounds(routeLayer.getBounds(),{padding:[30,30]})}},120);
}
function fullscreenElement(){return document.fullscreenElement||document.webkitFullscreenElement}
function standaloneDisplay(){return !!navigator.standalone||!!window.matchMedia?.('(display-mode: standalone)').matches||!!window.matchMedia?.('(display-mode: fullscreen)').matches}
function showFullscreenHelp(){const box=$('fullscreen-help');if(typeof box.showModal==='function'){if(!box.open)box.showModal()}else box.setAttribute('open','')}
async function requestFocusFullscreen(interactive=true){
  if(fullscreenElement())return exitFocusFullscreen();
  if(standaloneDisplay())return;
  const root=document.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;
  if(!request||fullscreenUnavailable){fullscreenUnavailable=true;$('focus-fullscreen').textContent='Full screen help';if(interactive)showFullscreenHelp();return}
  try{await request.call(root);cockpitFullscreenOwned=true;resizeCockpitMap()}catch{fullscreenUnavailable=true;$('focus-fullscreen').textContent='Full screen help';if(interactive)showFullscreenHelp()}
}
async function exitFocusFullscreen(){
  const exit=document.exitFullscreen||document.webkitExitFullscreen;cockpitFullscreenOwned=false;
  if(fullscreenElement()&&exit)try{await exit.call(document)}catch{}
}
function resizeCockpitMap(){setTimeout(()=>{navigationMap?.resize();map?.invalidateSize({pan:false});followCockpitPosition(lastPos||pointOnRoute(progress))},100);$('focus-fullscreen').textContent=fullscreenElement()?'Windowed view':'Full screen'}
function layoutFocusMapOverlays(active) {
  if(document.body.classList.contains('navigation-redesign'))return;
  const area = $('focus-map-area');
  const controls = area.querySelector('.focus-map-controls');
  const heading = area.querySelector('.map-heading');
  const top = area.querySelector('.focus-map-top');
  const card = area.querySelector('.map-guidance-card');
  const dials = area.querySelector('.speed-dials');
  const guidance = $('focus-guidance');
  const destination = $('route-label');
  const road = $('focus-current-road');
  if (!card) return;
  if (active) {
    heading.append(controls);
    card.append(destination, guidance);
    card.parentElement.append(dials, road);
    card.hidden = false;
  } else {
    card.hidden = true;
    heading.firstElementChild.append(destination);
    guidance.querySelector('.focus-guidance-copy').append(road);
    top.append(dials, guidance);
    area.append(controls);
  }
}
function setFocusMapExpanded(expanded) {
  const wasExpanded = document.body.classList.contains('map-expanded');
  document.body.classList.toggle('map-expanded', expanded);
  const button = $('focus-map-expand');
  button.textContent = expanded ? 'Back to dashboard' : 'Full map';
  button.setAttribute('aria-pressed', String(expanded));
  const shortcut = $('phone-full-map');
  if (!expanded && wasExpanded && shortcut.getClientRects().length) {
    shortcut.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  } else if (expanded || wasExpanded || document.activeElement === document.body) {
    button.focus({preventScroll:true});
  }
  requestAnimationFrame(() => {
    map?.invalidateSize({pan:false});
    navigationMap?.resize();
    followCockpitPosition(lastPos || pointOnRoute(progress));
  });
}
function initFocusDashboard(){
  initMapHeading();
  $('phone-full-map').onclick = () => setFocusMapExpanded(true);
  $('focus-map-expand').onclick = () => setFocusMapExpanded(!document.body.classList.contains('map-expanded'));
  $('focus-route-action').onclick = () => {
    if (dest && !isDemo) start();
    else {
      exitDriving();
      $('query').focus();
    }
  };
  $('focus-route-retry').onclick = () => $('retry-route').click();
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('map-expanded')) {
      event.preventDefault();
      setFocusMapExpanded(false);
    }
  });
  $('focus-fullscreen').onclick=()=>requestFocusFullscreen(true);
  $('close-fullscreen-help').onclick=()=>{const box=$('fullscreen-help');if(typeof box.close==='function')box.close();else box.removeAttribute('open')};
  $('focus-follow').onclick=recenterOnVehicle;
  document.addEventListener('fullscreenchange',resizeCockpitMap);document.addEventListener('webkitfullscreenchange',resizeCockpitMap);
  window.addEventListener('resize',()=>{if(document.body.classList.contains('driving'))resizeCockpitMap()});
}
