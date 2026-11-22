'use strict';
(() => {
 const panel=document.createElement('details');panel.className='panel cloud-panel';panel.innerHTML='<summary>Saved route &amp; offline preparation</summary><p>Standard online maps remain the default. Basic preparation saves the route line, instructions and your configured truck dimensions. It does not download map tiles, satellite imagery or support offline rerouting. Detailed offline maps are unavailable until a licensed source is configured.</p><label><input type="checkbox" id="offline-wifi" checked> Prefer Wi-Fi (browser network detection is not available on every Safari version)</label><p id="offline-size"></p><button id="prepare-offline" type="button" class="secondary">Prepare Basic offline route</button><button id="review-saved-route" type="button" class="secondary">Review saved route</button><button id="delete-offline" type="button" class="secondary">Delete saved route &amp; offline app data</button><p id="offline-status" role="status"></p><canvas id="offline-route-canvas" width="720" height="400" aria-label="Saved route line; no offline basemap"></canvas><p id="offline-next" role="status"></p><ol id="offline-directions"></ol>';$('cloud-panel').after(panel);
 let snapshot=null,gpsWatch=null,previewAttempted=false;const fallbackKey='rahyar.routeFallback.v1';
 function mirror(value){
  // Keep the full route line/profile/instructions; avoid duplicating every step's shape/intersection graph.
  const compact={...value,alternatives:undefined,selectedChoice:0,route:{...value.route,legs:(value.route.legs||[]).map(leg=>({...leg,steps:(leg.steps||[]).map(step=>{const {geometry,intersections,...guidance}=step;return guidance;})}))}};
  try{const text=JSON.stringify(compact);if(text.length>2200000)throw Error('Route exceeds backup capacity');localStorage.setItem(fallbackKey,text);}
  catch{try{localStorage.removeItem(fallbackKey);}catch{}$('offline-status').textContent='Persistent route backup is unavailable. Keep this tab open; Safari storage may be full or restricted.';}
 }
 function readMirror(){try{return JSON.parse(localStorage.getItem(fallbackKey)||'null');}catch{return null;}}
 const db=new Promise((resolve,reject)=>{const request=indexedDB.open('rahyar.trips.v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('trips');request.onsuccess=()=>resolve(request.result);request.onerror=request.onblocked=()=>reject(Error('Trip storage unavailable'));});
 async function transaction(mode,operation){const d=await db;return new Promise((resolve,reject)=>{const t=d.transaction('trips',mode);const request=operation(t.objectStore('trips'));let value;request.onsuccess=()=>{value=request.result;};t.oncomplete=()=>resolve(value);t.onerror=t.onabort=()=>reject(Error('Could not save route on this device'));});}
 function draw(position){
  const canvas=$('offline-route-canvas'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f2f5fa';ctx.fillRect(0,0,canvas.width,canvas.height);if(!snapshot)return;
  const line=snapshot.route.geometry.coordinates;
  const bounds=line.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[180,90,-180,-90]);
  const k=Math.cos((bounds[1]+bounds[3])/2*Math.PI/180),w=Math.max(.0001,(bounds[2]-bounds[0])*k),h=Math.max(.0001,bounds[3]-bounds[1]),scale=Math.min(650/w,330/h);
  const xy=p=>[35+(p[0]-bounds[0])*k*scale,365-(p[1]-bounds[1])*scale];
  ctx.beginPath();line.forEach((p,i)=>{const [x,y]=xy(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#8538d1';ctx.lineWidth=5;ctx.stroke();
  if(position){const [x,y]=xy(position);ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fillStyle='#176cbd';ctx.fill();}
 }
 async function render(){
  $('offline-size').textContent=snapshot?'Saved route data: '+(new Blob([JSON.stringify(snapshot)]).size/1024).toFixed(0)+' KB, plus the app files listed before download.':'Start a valid trip to save route geometry and guidance.';
  $('offline-directions').replaceChildren();
  if(snapshot){for(const step of snapshot.maneuvers){const li=document.createElement('li');li.textContent=(step.at/1000).toFixed(1)+' km from route origin · '+step.instruction;$('offline-directions').append(li);}
   $('offline-status').textContent='Saved '+snapshot.destination.name+' · '+new Date(snapshot.savedAt).toLocaleString()+' · '+snapshot.vehicle+'. The saved profile is preserved, but truck restrictions and closures cannot be rechecked offline. Follow posted signs.';
  }
  draw();
  if(navigator.storage?.estimate){const storage=await navigator.storage.estimate();$('offline-size').textContent+=' Browser storage used: '+((storage.usage||0)/1024/1024).toFixed(1)+' MB. Safari may evict data.';}
 }
 window.rahyarCheckpointTrip=async()=>{if(snapshot){snapshot={...snapshot,updatedAt:Date.now(),progress,departure:tripDeparture,cities:cityTargets.map(c=>({...c}))};mirror(snapshot);await transaction('readwrite',s=>s.put(snapshot,'last'));}};
 window.rahyarPersistTrip=async(route,via)=>{
  previewAttempted=true;
  const value={version:1,route,alternatives:routeChoices.slice(0,3),selectedChoice:Number($('route-choice').value)||0,maneuvers:routeManeuvers,via,viaValue:$('route-via').value,destination:dest,vehicle:activeRouteVehicle,profile:activeTruckProfile,origin:route.geometry.coordinates[0],savedAt:Date.now(),progress,departure:tripDeparture,cities:cityTargets.map(c=>({...c}))};
  snapshot=value;mirror(value);try{await transaction('readwrite',s=>s.put(value,'last'));render();}catch(error){$('offline-status').textContent=error.message;}
 };
 $('review-saved-route').onclick=()=>{
  if(!snapshot){$('offline-status').textContent='No saved route is available.';return;}
  draw();panel.open=true;$('offline-status').textContent='Review only: '+snapshot.destination.name+'. Vehicle: '+snapshot.vehicle+'. Saved truck profile: '+(snapshot.profile?JSON.stringify(snapshot.profile):'Passenger car')+'. Start a trip online to revalidate routing.';
  if(watch===null){if(!dest||hav(dest.coord,snapshot.destination.coord)>5)setSearchedDestination(snapshot.destination,false);$('route-vehicle').value=snapshot.vehicle;$('route-vehicle').dispatchEvent(new Event('change'));if([...$('route-via').options].some(o=>o.value===snapshot.viaValue)){$('route-via').value=snapshot.viaValue;updateViaLabel();}previewAttempted=false;restorePreview();}
  if(navigator.geolocation&&gpsWatch===null)gpsWatch=navigator.geolocation.watchPosition(p=>{
   const position=[p.coords.longitude,p.coords.latitude];draw(position);
   if(p.coords.accuracy>100){$('offline-next').textContent='GPS accuracy too low for prepared guidance.';return;}
   // Project onto the cached geometry independently of the live route state.
   let nearest={off:Infinity,along:0},along=0;
   for(let i=1;i<snapshot.route.geometry.coordinates.length;i++){
    const a=snapshot.route.geometry.coordinates[i-1],b=snapshot.route.geometry.coordinates[i],length=hav(a,b),k=Math.cos(position[1]*Math.PI/180),dx=(b[0]-a[0])*k,dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,(((position[0]-a[0])*k)*dx+(position[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
    const point=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],off=hav(position,point);if(off<nearest.off)nearest={off,along:along+t*length};along+=length;
   }
   const progress=nearest.along*snapshot.route.distance/Math.max(1,along);
   const next=snapshot.maneuvers.find(s=>s.at>=progress);
   $('offline-next').textContent=nearest.off>150?'Off the saved route. Offline rerouting is unavailable.':next?Math.round(next.at-progress)+' m · '+next.instruction:'Near saved destination. No live road legality or closure verification.';
  },()=>{$('offline-next').textContent='GPS unavailable or permission denied.';},{enableHighAccuracy:true,maximumAge:5000,timeout:20000});
 };
 panel.addEventListener('toggle',()=>{if(!panel.open&&gpsWatch!==null){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null;}});
 $('prepare-offline').onclick=async()=>{
  if(!snapshot){$('offline-status').textContent='No valid calculated route has been saved.';return;}
  const connection=navigator.connection;
  if($('offline-wifi').checked&&connection?.type&&connection.type!=='wifi'&&connection.type!=='ethernet'){$('offline-status').textContent='Wi-Fi preference blocked this download. Connect to Wi-Fi or disable the preference.';return;}
  try{
   const response=await fetch('offline-manifest.json');if(!response.ok)throw Error('Build the application before offline preparation.');const manifest=await response.json();
   if(!confirm('Store '+(manifest.bytes/1024/1024).toFixed(1)+' MB of app files and '+(new Blob([JSON.stringify(snapshot)]).size/1024).toFixed(0)+' KB of route data on this device? No map tiles will be downloaded. Safari may evict this data.'+($('offline-wifi').checked&&!connection?.type?' This browser cannot verify Wi-Fi; continue only after checking your connection.':'' )))return;
   if(!('serviceWorker' in navigator))throw Error('Service workers are unavailable in this browser. Route data remains saved locally.');
   const registration=await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;
   const worker=registration.active||registration.waiting||registration.installing;
   await new Promise((resolve,reject)=>{const channel=new MessageChannel();channel.port1.onmessage=e=>e.data.ok?resolve():reject(Error('Offline preparation failed'));worker.postMessage({type:'PREPARE'},[channel.port2]);setTimeout(()=>reject(Error('Offline preparation timed out')),60000);});
   const persistent=await navigator.storage?.persist?.();$('offline-status').textContent='Basic route/app files prepared. No offline basemap or rerouting. '+(persistent?'Persistent storage granted.':'Storage may be evicted by Safari. Recheck before travel.');
  }catch(error){$('offline-status').textContent=error.message;}
 };
 $('delete-offline').onclick=async()=>{
  if(!confirm('Delete this saved route and offline app cache? Media and other saved places will be preserved.'))return;
  try{localStorage.removeItem(fallbackKey);}catch{}await transaction('readwrite',s=>s.delete('last'));snapshot=null;window.RahyarLocalCorridors?.reset();
  for(const name of await caches.keys())if(name.startsWith('rahyar-offline-'))await caches.delete(name);
  if(gpsWatch!==null){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null;}render();$('offline-status').textContent='Saved route and offline app cache deleted.';
 };
 function restorePreview(){
  if(!snapshot||document.body.classList.contains('notice-required')||previewAttempted)return;
  previewAttempted=true;
  if(watch!==null||coords.length)return;
  if(!dest)setSearchedDestination(snapshot.destination,false);
  if(hav(dest.coord,snapshot.destination.coord)>5)return;
  try{
   activeRouteVehicle=snapshot.vehicle;
   prepare(snapshot.route.geometry.coordinates,snapshot.route.distance);
   buildTravelProfile(snapshot.route);routeManeuvers=buildRouteManeuvers(snapshot.route);
   progress=Math.max(0,Math.min(routeLength,snapshot.progress||0));const departureTime=new Date(snapshot.departure?.time||snapshot.savedAt);tripDeparture={place:snapshot.departure?.place||{coord:snapshot.origin},time:Number.isFinite(departureTime.getTime())?departureTime:new Date()};activeTruckProfile=snapshot.profile;
   pendingVia=snapshot.via||null;
   if([...$('route-via').options].some(o=>o.value===snapshot.viaValue)){$('route-via').value=snapshot.viaValue;updateViaLabel();}
   displayRouteChoices(snapshot.alternatives?.length?snapshot.alternatives:[snapshot.route],snapshot.selectedChoice||0);activeNavigationRoute=routeChoices[snapshot.selectedChoice||0]||snapshot.route;setTargets(snapshot.cities?.length?snapshot.cities:known);drawRoute();
   $('route-type').textContent='Saved route preview · Revalidate before driving';
   $('map-status').textContent='Saved origin → '+snapshot.destination.name+' · GPS tracking is off';
   $('start').textContent='Start & revalidate saved route';
   message('Your selected route was restored for review. Start a trip online to revalidate the current vehicle and restrictions.');
   window.rahyarRestoreUpgradeSession?.();
  }catch{$('offline-status').textContent='Saved route preview could not be restored. Start a fresh trip.';}
 }
 new MutationObserver(()=>{if(!document.body.classList.contains('notice-required'))queueMicrotask(restorePreview);}).observe(document.body,{attributes:true,attributeFilter:['class']});
 Promise.race([db.then(()=>transaction('readonly',s=>s.get('last'))).catch(()=>null),new Promise(resolve=>setTimeout(()=>resolve(null),1800))]).then(value=>{const fallback=readMirror();return !value||(fallback?.updatedAt||fallback?.savedAt||0)>(value.updatedAt||value.savedAt||0)?fallback:value;}).then(value=>{if(value?.version===1&&value.route?.geometry?.coordinates?.length>1&&value.destination?.coord){snapshot=value;render();restorePreview();}}).catch(()=>{$('offline-status').textContent='Saved trip storage is unavailable in this browser.';});
})();
