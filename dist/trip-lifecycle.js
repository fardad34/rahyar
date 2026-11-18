'use strict';
// Backgrounding a tab is not an End Trip action. Never clear route/storage on visibility changes.
(() => {
 const intentKey='rahyar.activeTripIntent',upgradeKey='rahyar.upgradeResume';
 let intent=false,refreshing=false;
 try{intent=sessionStorage.getItem(intentKey)==='active';}catch{}
 window.rahyarSetTripIntent=active=>{intent=active;try{sessionStorage.setItem(intentKey,active?'active':'inactive');}catch{}};
 function attachLiveWatch(){
  if(!intent||!dest||coords.length<2||isDemo||!navigator.geolocation)return;
  if(watch!==null)navigator.geolocation.clearWatch(watch);
  const token=session;
  watch=navigator.geolocation.watchPosition(p=>onPosition(p,token),error=>{if(token!==session)return;gpsError(error);if(error.code===1){window.rahyarSetTripIntent(false);stopWatch();}},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  $('route-vehicle').disabled=true;$('start').hidden=true;$('stop').hidden=false;$('end-trip').hidden=false;
  setScreenAwakeReason('trip',true);updateRouteGuidance();
 }
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){window.rahyarCheckpointTrip?.().catch(()=>{});return;}
  if(intent&&watch!==null)attachLiveWatch();
  navigationMap?.resize();map?.invalidateSize({pan:false});
 });
 window.addEventListener('pagehide',()=>window.rahyarCheckpointTrip?.().catch(()=>{}));
 window.addEventListener('pageshow',event=>{if(event.persisted&&intent)attachLiveWatch();});
 window.rahyarRestoreUpgradeSession=()=>{
  let resume=false;
  try{const saved=JSON.parse(sessionStorage.getItem(upgradeKey)||'null');resume=intent&&(!saved||(Date.now()-saved.at<120000&&saved.destination===dest?.coord?.join(',')));sessionStorage.removeItem(upgradeKey);}catch{}
  if(resume){attachLiveWatch();if(typeof discoverCities==='function')discoverCities(session,routeRevision);if(typeof scanFacilities==='function')scanFacilities(session,routeRevision);message('Updated. Your active route is retained; reconnecting GPS.');}
 };
 if(coords.length>1)window.rahyarRestoreUpgradeSession();
 window.rahyarUpgradeApp=async()=>{
  if(refreshing)return;refreshing=true;
  try{
   message('Checking for an app update…');
   // Verify that reload will return the app, not a login page or a network error.
   const response=await fetch('/index.html?update-check='+Date.now(),{cache:'no-store',credentials:'same-origin'});
   const html=await response.text();if(!response.ok||!html.includes('navigation-shell.js'))throw Error('Update is unavailable or the hosting login has expired. Your current trip is still open.');
   await window.rahyarCheckpointTrip?.();
   const registrations=await navigator.serviceWorker?.getRegistrations?.()||[];
   await Promise.all(registrations.map(r=>r.update().catch(()=>{})));
   try{sessionStorage.setItem(upgradeKey,JSON.stringify({at:Date.now(),destination:dest?.coord?.join(','),active:intent}));}catch{}
   const url=new URL(location.href);url.searchParams.set('app-update',String(Date.now()));location.replace(url.href);
  }catch(error){message(error.message,true);refreshing=false;}
 };
})();
