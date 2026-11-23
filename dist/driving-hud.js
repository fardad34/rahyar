'use strict';
let speedModel=[],speedLoadBusy=false,speedLoadAt=0,speedLoadEnd=0,speedError='',speedPreviewDistance=null,speedPreviewTimers=[],regionHome=null,heroHome=null;
const warnedChanges=new Set();
function decodeRouteShape(encoded){
  if(typeof encoded!=='string')throw Error('Missing road geometry');let index=0,lat=0,lon=0;const points=[];
  while(index<encoded.length){let results=[];for(let part=0;part<2;part++){let value=0,shift=0,b;do{if(index>=encoded.length||shift>30)throw Error('Invalid road geometry');b=encoded.charCodeAt(index++)-63;value|=(b&31)<<shift;shift+=5}while(b>=32);results.push(value&1?~(value>>1):value>>1)}lat+=results[0];lon+=results[1];points.push([lon/1e6,lat/1e6])}return points;
}
function parseSpeedTrace(data,from,to){
  if(data.units&&data.units!=='kilometers')throw Error('Unexpected speed units');const line=decodeRouteShape(data.shape),segments=[];
  for(const edge of data.edges||[]){const limit=Number(edge.speed_limit),a=line[edge.begin_shape_index],b=line[edge.end_shape_index];if(!a||!b)continue;
    const p=project(a),q=project(b),mid=line[Math.floor((edge.begin_shape_index+edge.end_shape_index)/2)],m=mid?project(mid):p;
    if(Math.max(p.off,q.off,m.off)>35||q.along<p.along-5||p.along<from-100||q.along>to+150)continue;
    const start=Math.max(from,p.along),end=Math.min(to,q.along);if(end-start<.5)continue;
    // Only the speed_limit attribute is used. Edge travel speeds are never legal limits.
    const mappedLimit=Number.isFinite(limit)&&limit>0&&limit<255?limit:null,previous=segments.at(-1);
    if(previous&&previous.limit===mappedLimit&&Math.abs(previous.end-start)<20)previous.end=Math.max(previous.end,end);
    else segments.push({start,end,limit:mappedLimit,wayId:edge.way_id});
  }
  return segments.sort((a,b)=>a.start-b.start);
}
function resetSpeedContext(){speedModel=[];speedLoadAt=0;speedLoadEnd=0;speedError='';speedLoadBusy=false;warnedChanges.clear();speedPreviewDistance=null;speedPreviewTimers.forEach(clearTimeout);speedPreviewTimers=[];if($('hud-upcoming-sign'))$('hud-upcoming-sign').classList.remove('flash-warning','flash-danger')}
async function loadSpeedAhead(force=false){
  if(isDemo||!coords.length||speedLoadBusy)return;
  const now=Date.now();if(!force&&(now-speedLoadAt<30000||(progress<speedLoadEnd-1200&&now-speedLoadAt<600000)))return;
  const token=session,revision=routeRevision,from=Math.max(0,progress-100),to=Math.min(routeLength,progress+4500);if(to-from<50)return;
  const shape=[];for(let d=from;d<to;d+=40){const p=pointOnRoute(d);shape.push({lat:p[1],lon:p[0]})}const last=pointOnRoute(to);shape.push({lat:last[1],lon:last[0]});
  speedLoadBusy=true;speedLoadAt=now;speedError='';updateDrivingHud();
  try{
    const request={shape,costing:'auto',shape_match:'map_snap',units:'kilometers',trace_options:{search_radius:30,gps_accuracy:10},filters:{action:'include',attributes:['edge.speed_limit','edge.length','edge.begin_shape_index','edge.end_shape_index','edge.way_id','shape']}};
    const response=await getJSON('https://valhalla1.openstreetmap.de/trace_attributes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)},18000);
    if(token!==session||revision!==routeRevision)return;
    const segments=parseSpeedTrace(response,from,to);if(!segments.length)throw Error('No road limits matched this route');speedModel=segments;speedLoadEnd=to;
  }catch{if(token===session&&revision===routeRevision){speedModel=[];speedError='Road-limit data unavailable. Follow posted signs.'}}
  finally{if(token===session&&revision===routeRevision){speedLoadBusy=false;updateDrivingHud()}}
}
function speedContext(){
  if(isDemo)return {current:{limit:90},next:{limit:70,start:progress+(speedPreviewDistance??650)},distance:speedPreviewDistance??650,demo:true};
  const current=[...speedModel].reverse().find(s=>s.start<=progress+2&&s.end>=progress-2);
  if(!current?.limit)return {current:null,next:null};
  const after=speedModel.find(s=>s.start>=current.end-2&&s.start>current.start+2);
  const next=after?.limit&&after.limit!==current.limit&&Math.abs(after.start-current.end)<40?after:null;
  return {current,next,distance:next?Math.max(0,next.start-progress):null};
}
function limitDisplay(kmh){return Number.isFinite(kmh)?integer(kmh/(usesMiles(currentCountry)?1.609344:1)):'—'}
function nearDistance(meters){return usesMiles(currentCountry)?(meters>0&&meters<16.09344?'<0.01':(roadDistance(meters)).toFixed(2))+' mi':integer(meters)+' m'}
function flashSpeedWarning(level,message){
  const sign=$('hud-upcoming-sign');sign.classList.remove('flash-warning','flash-danger');void sign.offsetWidth;sign.classList.add(level==='danger'?'flash-danger':'flash-warning');sign.onanimationend=()=>sign.classList.remove('flash-warning','flash-danger');$('hud-announcement').textContent=message;
}
function updateDrivingHud(){
  refreshFocusSummary(true);updateCockpitMapState();updateStationWarning();
  if(!$('hud-car-speed'))return;
  const fresh=isDemo||(watch!==null&&gpsTime&&Date.now()-gpsTime<15000),accurate=isDemo||(lastAccuracyMeters!==null&&lastAccuracyMeters<=35),context=speedContext();
  const current=fresh&&accurate?context.current:null,next=fresh&&accurate?context.next:null;
  $('hud-car-speed').textContent=isDemo?limitDisplay(85):fresh&&Number.isFinite(lastSpeedMps)?integer(lastSpeedMps*(usesMiles(currentCountry)?2.2369362921:3.6)):'—';
  $('hud-car-unit').textContent=speedUnit();$('hud-limit-unit').textContent=speedUnit();$('hud-next-unit').textContent=speedUnit();
  $('hud-road-limit').textContent=current?.limit?limitDisplay(current.limit):'—';
  const tooFast=!isDemo&&fresh&&accurate&&current?.limit&&Number.isFinite(lastSpeedMps)&&lastSpeedMps*3.6>current.limit+3;
  $('hud-car-ring').classList.toggle('over-limit',!!tooFast);$('hud-driving-state').textContent=isDemo?'DEMO · SAMPLE SPEEDS':!fresh?'GPS NOT READY / STALE':!accurate?'GPS ACCURACY LOW':tooFast?'ABOVE MAPPED LIMIT':'LIVE GPS';
  $('hud-limit-source').textContent=isDemo?'Sample limit · Not live road data':speedLoadBusy?'Loading road-limit data…':!fresh?'Start live tracking for road limits':!accurate?'Alerts paused until GPS accuracy improves':speedError||(current?.limit?'Mapped road limit · OSM / Valhalla':'No mapped limit for this road');
  if(speedError&&!speedLoadBusy&&!current?.limit)$('hud-limit-source').textContent=speedError;
  $('hud-next-limit').textContent=next?limitDisplay(next.limit):'—';$('hud-change-distance').textContent=next?nearDistance(context.distance)+' ahead':'No change ahead';
  const active=next&&context.distance>0&&context.distance<=300;
  $('hud-upcoming').hidden=!active;$('hud-upcoming').classList.toggle('change-near',!!active);$('hud-upcoming').classList.toggle('change-imminent',!!active&&context.distance<=100);
  $('hud-change-label').textContent=active?'SPEED LIMIT CHANGING':'NEXT MAPPED LIMIT';
  if(active){const stage=context.distance<=100?100:context.distance<=200?200:300,key=(isDemo?'demo':routeRevision)+':'+Math.round(next.start)+':'+next.limit+':'+stage;
    if(!warnedChanges.has(key)){warnedChanges.add(key);if(!isDemo){announceSpeedStage(stage);if(stage===300&&typeof speakNavigationText==='function')speakNavigationText(mappedSpeedAnnouncement(limitDisplay(next.limit),speedUnit(),nearDistance(context.distance)));}flashSpeedWarning(stage===100?'danger':'warning','Speed limit changes to '+limitDisplay(next.limit)+' '+speedUnit()+' in '+nearDistance(context.distance));}
  }
  $('hud-facility-status').textContent=isDemo?'Demo stops · Start a live trip for real locations.':facilityCatalogLoaded?'Bundled inventory loaded · '+integer(roadFacilities.filter(f=>f.at>=progress-150).length)+' stops ahead'+(facilityScanBusy?' · Checking online details…':facilityScanFailed?' · Extra online coverage unavailable':' · Coverage varies'):facilityScanBusy?'Loading stop inventory…':'Stop inventory not loaded · Use Refresh stops';
  for(const [key,kinds]of [['weigh',['weigh','inspection']],['truck',['truck','service']],['rest',['rest']],['diesel',['diesel']]]){
    const facility=roadFacilities.find(f=>facilityVisible(f)&&f.at>=progress-150&&(key!=='weigh'||isGovernmentFacility(f))&&(kinds.includes(f.kind)||(key==='diesel'&&f.commercialDiesel)));$('hud-'+key+'-distance').textContent=facility?fa(roadDistance(facility.at-progress))+' '+distanceUnit():'—';$('hud-'+key+'-name').textContent=facility?facility.name:facilityScanBusy?'Finding mapped locations…':!facilityCatalogLoaded&&facilityScanFailed?'Location data unavailable':'None identified ahead in loaded data';
  }
}
function previewSpeedWarnings(){
  if(!isDemo){$('hud-announcement').textContent='Use View demo to preview sample alerts.';return}
  warnedChanges.clear();speedPreviewTimers.forEach(clearTimeout);speedPreviewDistance=300;updateDrivingHud();
  for(const [delay,distance]of [[3300,200],[6600,100],[10000,null]])speedPreviewTimers.push(setTimeout(()=>{if(!isDemo)return;speedPreviewDistance=distance;updateDrivingHud()},delay));
}
function enterCockpit(){startCockpitLayout()}
function leaveCockpit(){stopCockpitLayout()}
function initDrivingHud(){
  initFocusDashboard();
  $('focus-exit').onclick=exitDriving;$('preview-speed-alert').onclick=previewSpeedWarnings;$('retry-speed').onclick=()=>{loadSpeedAhead(true);refreshFacilities()};
  setInterval(()=>{updateDrivingHud();if(watch!==null&&!isDemo)loadSpeedAhead()},2000);
}
