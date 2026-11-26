'use strict';
// Rehydrate missing route sources/layers after style/context changes without ending GPS or the trip.
(() => {
 function restore(){
  if(!coords.length||!navigationReady||!navigationMap?.getStyle())return;
  if(!navigationMap.getSource('journey'))navigationMap.addSource('journey',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
  if(!navigationMap.getLayer('journey-outline'))navigationMap.addLayer({id:'journey-outline',type:'line',source:'journey',paint:{'line-color':navigationNight?'#112745':'#fff','line-width':15}});
  if(!navigationMap.getLayer('journey-line'))navigationMap.addLayer({id:'journey-line',type:'line',source:'journey',paint:{'line-color':'#a15aea','line-width':9}});
  if(!navigationMap.getSource('stops'))navigationMap.addSource('stops',{type:'geojson',data:navigationFeatures()});
  navigationRouteRevision='';syncNavigationData();if(window.RahyarRouteOptions?.choices.length&&!navigationMap.getSource('route-options'))window.RahyarRouteOptions.render();
 }
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(restore,500);});window.addEventListener('pageshow',()=>setTimeout(restore,500));setInterval(restore,30000);window.RahyarMapRecovery=restore;
})();
