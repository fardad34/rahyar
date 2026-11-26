'use strict';
// Independent proposal discovery: never activate a new route without a driver's choice.
(() => {
 let state={session:null,busy:false,at:0,origin:null},result={state:'idle'};
 const gateKey='rahyar.localCorridorGate.v1';
 function saveGate(value){try{sessionStorage.setItem(gateKey,JSON.stringify({trip:value.trip,at:value.at,origin:value.origin}));}catch{}}
 function showStatus(){const host=document.getElementById('nav-layers-dialog');if(!host)return;let p=document.getElementById('nav-local-route-status');if(!p){p=document.createElement('p');p.id='nav-local-route-status';p.setAttribute('role','status');host.append(p);}p.textContent=result.state==='checking'?'Checking nearby route alternatives…':result.state==='ready'?(result.localOptions?result.localOptions+' nearby corridor option(s) added. Choose a colored route on the map.':'No additional nearby corridor returned. Existing routes remain available.'):result.state==='stale'?'Route or GPS changed; nearby alternatives will be checked again with fresh data.':'Nearby alternatives unavailable. Your active route is retained.';}
 async function discover({force=false,manual=false}={}){
  if(typeof navigator!=='undefined'&&!navigator.onLine)return;
  if(watch===null||isDemo||!lastPos||!activeNavigationRoute||guidanceOffRoute||!Number.isFinite(lastAccuracyMeters)||lastAccuracyMeters>50||Date.now()-gpsTime>20000)return;
  const trip=JSON.stringify([typeof tripDeparture!=='undefined'?tripDeparture?.time:null,dest.coord,typeof activeRouteVehicle!=='undefined'?activeRouteVehicle:null,typeof activeTruckProfile!=='undefined'?activeTruckProfile:null]);
  if(state.session!==session||state.trip!==trip){let saved=null;try{saved=JSON.parse(sessionStorage.getItem(gateKey)||'null');}catch{}state={session,trip,busy:false,at:saved?.trip===trip&&Number.isFinite(saved.at)?saved.at:0,origin:saved?.trip===trip&&Array.isArray(saved.origin)&&saved.origin.length===2&&saved.origin.every(Number.isFinite)?saved.origin:null};}
  if(manual&&state.at&&Date.now()-state.at<30000)return;
  if(force&&!manual&&state.at&&Date.now()-state.at<300000&&state.origin&&hav(state.origin,lastPos)<30000)return;
  if(state.busy||!force&&(routeBusy||Date.now()-state.at<300000||state.origin&&hav(state.origin,lastPos)<30000))return;
  const captured=state,token=session,revision=routeRevision,base=activeNavigationRoute,origin=[...lastPos],startProgress=progress;captured.busy=true;captured.at=Date.now();captured.origin=origin;saveGate(captured);result={state:'checking'};showStatus();
  try{
   const canadaOnly=regionAt(origin)?.country==='CA'&&(regionAt(dest.coord)?.country||dest.country)==='CA';
   let details={};const alternatives=await requestUpcomingCorridors(base,origin,(points,options)=>fetchVehicleRoutes(points,options?.via?0:2,10000,gpsTravelHeading,{canadaOnly,through:true,segmenting:true,requestPurpose:'local-corridor',corridorProbe:options?.probe,reserveExtra:()=>false}),{fromDistance:startProgress,onDiagnostic:value=>{details=value;},roadCandidates:(a,b)=>window.RahyarCorridorRoads.find(a,b),refineCandidate:(r,a,b,side)=>window.RahyarCorridorRoads.routedPoint(r,a,b,side)});
   if(token!==session||revision!==routeRevision||activeNavigationRoute!==base||routeBusy||watch===null||guidanceOffRoute||Date.now()-gpsTime>20000||hav(origin,lastPos)>5000){if(captured===state){result={state:'stale'};captured.at=0;captured.origin=null;saveGate(captured);showStatus();}return;}
   const local=alternatives.filter(r=>!canadaOnly||!routeEntersUnitedStates(r));for(const route of local){if(pendingVia?.points)route.highwayVia=pendingVia;else if(pendingVia)route.cityVia=pendingVia;}
   if(local.length){const preferred=distinctVehicleAlternatives(base,local,2);const remaining=distinctVehicleAlternatives(base,routeChoices.filter(r=>r!==base),2-preferred.length);displayRouteChoices([base,...preferred,...remaining],0);window.rahyarPersistTrip?.(base,pendingVia)?.catch(()=>{});}
   result={state:'ready',localOptions:local.length,totalOptions:routeChoices.length,details};showStatus();
  }catch(error){result={state:'unavailable',reason:error.code||error.name||'RoutingError'};showStatus();}finally{captured.busy=false;}
 }
 window.RahyarLocalCorridors={discover,reset(){state={session:null,busy:false,at:0,origin:null};result={state:'idle'};try{sessionStorage.removeItem(gateKey);}catch{}},get diagnostics(){return result;}};
})();
