'use strict';
// Rehydrate missing route sources/layers after style/context changes without ending GPS or the trip.
(() => {
 function restore(force=false){
  if(!coords.length||!navigationReady||!navigationMap?.getStyle())return;
  const missingRoute=!navigationMap.getSource('journey')||
    !navigationMap.getLayer('journey-outline')||!navigationMap.getLayer('journey-line')||!navigationMap.getSource('stops')||!navigationMap.getLayer('journey-stops');
  if(!force&&!missingRoute){
   if(window.RahyarRouteOptions?.choices.length&&!navigationMap.getSource('route-options'))window.RahyarRouteOptions.render();
   return;
  }
  if(!navigationMap.getSource('journey'))navigationMap.addSource('journey',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
  if(!navigationMap.getLayer('journey-outline'))navigationMap.addLayer({id:'journey-outline',type:'line',source:'journey',paint:{'line-color':navigationNight?'#112745':'#fff','line-width':15}});
  if(!navigationMap.getLayer('journey-line'))navigationMap.addLayer({id:'journey-line',type:'line',source:'journey',paint:{'line-color':'#21a96b','line-width':9}});
  if(!navigationMap.getSource('stops'))navigationMap.addSource('stops',{type:'geojson',data:navigationFeatures()});
  if(!navigationMap.getLayer('journey-stops'))navigationMap.addLayer({id:'journey-stops',type:'circle',source:'stops',paint:{'circle-radius':6,'circle-color':['case',['get','government'],'#ffb76c','#a5e7cb'],'circle-stroke-color':'#102820','circle-stroke-width':2}});
  navigationRouteRevision='';syncNavigationData();if(window.RahyarRouteOptions?.choices.length&&!navigationMap.getSource('route-options'))window.RahyarRouteOptions.render();
 }
 setInterval(restore,30000);window.RahyarMapRecovery=restore;
})();
