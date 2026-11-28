'use strict';
let navigationMap=null,navigationMarker=null,navigationReady=false,navigationFailed=false,navigationPitch=true,navigationRouteRevision='',navigationLastPosition=null;
let mainMapBrowsing=false;
let navigationBasemapReady=false,navigationContextLost=false;
let navigationBasemapSources=new Set();
function pauseMainMapFollow(){
  if(!document.body.classList.contains('driving'))mainMapBrowsing=true;
}
let recenterTimer;
function pauseMapForGesture(){
  clearTimeout(recenterTimer);
  if(document.body.classList.contains('driving')){
    cockpitMapFollow=false;
    updateCockpitMapState();
  }else pauseMainMapFollow();
}
function resumeMapAfterGesture(){
  clearTimeout(recenterTimer);
  if(watch===null||isDemo||pickingMapPin)return;
  const trip=session;
  recenterTimer=setTimeout(()=>{
    if(trip===session&&watch!==null&&!pickingMapPin&&lastPos)recenterOnVehicle();
  },7000);
}
function recenterOnVehicle(){
  clearTimeout(recenterTimer);
  cockpitMapFollow=true;
  mainMapBrowsing=false;
  if(document.body.classList.contains('driving')){
    followCockpitPosition(lastPos||pointOnRoute(progress),true);
    updateCockpitMapState();
  }else if(lastPos){
    followNavigationPosition(lastPos,true);
    if(map&&!$('map').hidden){map.setView([lastPos[1],lastPos[0]],14);
      if(document.body.classList.contains('navigation-redesign')&&typeof rahyarCameraFrame==='function'){const size=map.getSize(),frame=rahyarCameraFrame(size.x,size.y);
        const point=map.latLngToContainerPoint([lastPos[1],lastPos[0]]);
        map.panTo(map.containerPointToLatLng(point.subtract([frame.x-size.x/2,frame.y-size.y/2])),{animate:false});}}
  }
}
function navigationFeatures(){return {type:'FeatureCollection',features:targets.filter(t=>t.coord&&facilityVisible(t)).map(t=>({type:'Feature',geometry:{type:'Point',coordinates:t.routeCoord||t.coord},properties:{name:t.name,kind:kindLabel(t),government:isGovernmentFacility(t)}}))}}
function syncNavigationData(){
  if(!navigationReady||!navigationMap.getSource('journey')||!navigationMap.getSource('stops'))return;
  const key=session+':'+routeRevision+':'+coords.length;
  if(navigationRouteRevision!==key){navigationRouteRevision=key;
    navigationMap.getSource('journey').setData(coords.length>1?{type:'Feature',geometry:{type:'LineString',coordinates:coords},properties:{}}:{type:'FeatureCollection',features:[]})}
  navigationMap.getSource('stops').setData(navigationFeatures());
}
function navigationBearing(){return mapHeadingUp?(mapDisplayHeading??gpsTravelHeading??0):0}
function followNavigationPosition(coord,reset=false){
  if(!coord)return;navigationLastPosition=coord;
  if(!navigationMarker&&navigationReady)createNavigationMarker(coord);
  if(navigationMarker)navigationMarker.setLngLat(coord).setRotation((gpsTravelHeading??mapDisplayHeading??0)-(document.body.classList.contains('driving')?navigationBearing():0));
  if(!navigationMap||!navigationReady)return;
  const focused=document.body.classList.contains('driving');
  if(focused?!cockpitMapFollow:mainMapBrowsing)return;
  const mapHeight=navigationMap.getContainer().clientHeight;
  const focusDrop=focused?Math.min(document.body.classList.contains('map-expanded')?38:76,mapHeight*.19):0;
  const autoZoom=typeof followingZoom==='function'?followingZoom():null;
  const camera={center:coord,bearing:focused?navigationBearing():0,pitch:navigationPitch?60:0,...(autoZoom!==null?{zoom:autoZoom}:reset?{zoom:focused?16.5:14}:{}),padding:document.body.classList.contains('navigation-redesign')&&typeof rahyarCameraFrame==='function'?rahyarCameraFrame(navigationMap.getContainer().clientWidth,mapHeight).padding:focused?{top:Math.round(mapHeight*.4+focusDrop*2)+16,bottom:16,left:0,right:0}:{top:0,bottom:0,left:0,right:0}};
  if(reset)navigationMap.jumpTo(camera);
  else navigationMap.easeTo({...camera,duration:350,easing:t=>t});
}
function fitNavigationRoute(){
  if(!navigationReady||coords.length<2)return;
  syncNavigationData();
  const bounds=new maplibregl.LngLatBounds(coords[0],coords[0]);
  coords.forEach(c=>bounds.extend(c));
  navigationMap.fitBounds(bounds,{padding:40,pitch:navigationPitch?45:0,bearing:0,duration:0});
}
function createNavigationMarker(coord){const arrow=document.createElement('div');
  arrow.className='navigation-arrow';
  arrow.setAttribute('aria-label','Your position');
  navigationMarker=new maplibregl.Marker({element:arrow,rotationAlignment:'viewport',pitchAlignment:'viewport'}).setLngLat(coord).addTo(navigationMap)}
const imageryTiles='https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const imageryCredit='Imagery © Esri, Vantor, Earthstar Geographics and the GIS User Community';
let navigationNight=false,navigationSatellite=false,navigationStyleTimer,fallbackBasemap=null,fallbackSatellite;
try{
  navigationNight=localStorage.getItem('rahyar-map-theme')==='night';
  navigationSatellite=localStorage.getItem('rahyar-map-layer')==='satellite';
}catch{}
function navigationStyle(){
  if(!navigationSatellite)return 'https://tiles.openfreemap.org/styles/'+(navigationNight?'dark':'liberty');
  return {version:8,sources:{imagery:{type:'raster',tiles:[imageryTiles],tileSize:256,maxzoom:19,attribution:imageryCredit}},
    layers:[{id:'imagery',type:'raster',source:'imagery',paint:{'raster-brightness-max':navigationNight ? .8 : 1}}]};
}
function syncFallbackBasemap(){
  if(!map||fallbackSatellite===navigationSatellite)return;
  if(fallbackBasemap)map.removeLayer(fallbackBasemap);
  fallbackSatellite=navigationSatellite;
  fallbackBasemap=L.tileLayer(navigationSatellite?imageryTiles:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {maxZoom:19,attribution:navigationSatellite?imageryCredit:'© OpenStreetMap contributors'}).addTo(map);
}
function initMapTheme(){
  const night=$('map-night'),satellite=$('map-satellite');
  const render=()=>{
    document.body.classList.toggle('night-map',navigationNight);
    document.body.classList.toggle('satellite-map',navigationSatellite);
    night.setAttribute('aria-pressed',String(navigationNight));
    satellite.setAttribute('aria-pressed',String(navigationSatellite));
    syncFallbackBasemap();
  };
  const update=()=>{
    try{
      localStorage.setItem('rahyar-map-theme',navigationNight?'night':'day');
      localStorage.setItem('rahyar-map-layer',navigationSatellite?'satellite':'street');
    }catch{}
    render();
    if(navigationMap){
      navigationReady=false;
      navigationMap.setStyle(navigationStyle(),{diff:false});
      waitForNavigationStyle();
    }
  };
  night.onclick=()=>{navigationNight=!navigationNight;update()};
  satellite.onclick=()=>{navigationSatellite=!navigationSatellite;update()};
  render();
}
function showRasterMapFallback(reason){
  navigationReady=false;navigationFailed=true;
  const host=$('navigation-map');
  if(host){host.hidden=false;host.classList.remove('ready');host.style.visibility='hidden';host.style.pointerEvents='none';}
  $('map').hidden=false;$('map-dimension').disabled=!navigationMap;
  if(map&&navigationMap){const center=navigationMap.getCenter();map.setView([center.lat,center.lng],Math.min(19,navigationMap.getZoom()),{animate:false});}
  $('map-render-status').textContent=reason;
  map?.invalidateSize({pan:false});
  if(coords.length)drawRoute();if(lastPos)drawPosition(lastPos);
  window.RahyarRouteOptions?.render();
  if(typeof syncTrafficLayers==='function')syncTrafficLayers(true);
}
function waitForNavigationStyle(){
  clearTimeout(navigationStyleTimer);navigationBasemapReady=false;
  showRasterMapFallback('Loading map · showing 2D streets');navigationFailed=false;
  navigationStyleTimer=setTimeout(()=>{
    if(navigationBasemapReady)return;
    showRasterMapFallback('2D map · vector basemap unavailable. Retry 3D in Map layers.');
    if(typeof message==='function')message('3D map tiles could not load. Showing 2D streets; your trip is preserved.',true);
  },20000);
}
function navigationBaseSourceIds(style,satellite){return new Set(Object.entries(style.sources||{}).filter(([,source])=>source.type===(satellite?'raster':'vector')).map(([id])=>id));}
function navigationBaseTileReady(event,sourceIds){return sourceIds.has(event.sourceId)&&event.tile?.state==='loaded';}
function completeNavigationBasemap(event){
  if(navigationBasemapReady||navigationContextLost||!navigationBaseTileReady(event,navigationBasemapSources))return;
  navigationBasemapReady=true;navigationReady=true;navigationFailed=false;clearTimeout(navigationStyleTimer);
  const host=$('navigation-map');host.hidden=false;host.classList.add('ready');host.style.visibility='visible';host.style.pointerEvents='auto';
  $('map').hidden=true;$('map-dimension').disabled=false;
  $('map-render-status').textContent=navigationSatellite?'Satellite · Esri World Imagery':'3D · OpenFreeMap / OpenStreetMap';
  navigationRouteRevision='';syncNavigationData();navigationMap.resize();
  const position=navigationLastPosition||lastPos||(coords.length?pointOnRoute(progress):null);
  if(position)followNavigationPosition(position,true);else if(coords.length)fitNavigationRoute();
  window.RahyarRouteOptions?.render();if(typeof syncTrafficLayers==='function')syncTrafficLayers(true);
}

function initNavigationMap(){
  initMapTheme();
  const button=$('map-dimension');
  button.onclick=()=>{if(navigationMap&&(!navigationReady||navigationFailed)){waitForNavigationStyle();navigationMap.setStyle(navigationStyle(),{diff:false});return;}navigationPitch=!navigationPitch;
    button.textContent=navigationPitch?'3D':'2D';
    button.setAttribute('aria-pressed',String(navigationPitch));
    if(navigationMap)navigationMap.easeTo({pitch:navigationPitch?60:0,duration:500})};
  if(!window.maplibregl){button.disabled=true;$('map-render-status').textContent='2D fallback · 3D map library unavailable';return}
  const host=document.createElement('div');host.id='navigation-map';host.setAttribute('aria-label','3D route map');$('map').after(host);
  try{
    navigationMap=new maplibregl.Map({container:host,transformRequest:(url)=>typeof trafficTransformRequest==='function'?trafficTransformRequest(url):{url},style:navigationStyle(),center:[-100,50],zoom:4,pitch:60,maxPitch:70,attributionControl:{compact:true,customAttribution:'Road markers © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'},antialias:false});
    navigationMap.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'bottom-left');
    navigationMap.on('sourcedata',completeNavigationBasemap);
    navigationMap.on('style.load',()=>{
      const firstStyle=!host.classList.contains('ready');
      navigationReady=false;navigationFailed=false;navigationRouteRevision='';host.hidden=false;button.disabled=false;host.classList.remove('ready');host.style.visibility='hidden';host.style.pointerEvents='none';$('map').hidden=false;navigationBasemapSources=navigationBaseSourceIds(navigationMap.getStyle(),navigationSatellite);$('map-render-status').textContent='Loading vector tiles · 2D streets available';
      const layers=navigationMap.getStyle().layers,building=layers.find(l=>l['source-layer']==='building');
      if(building&&!layers.some(l=>l.type==='fill-extrusion'))navigationMap.addLayer({id:'navigation-buildings',source:building.source,'source-layer':'building',type:'fill-extrusion',minzoom:14,paint:{'fill-extrusion-color':navigationNight?'#333f52':'#adbcc5','fill-extrusion-height':['coalesce',['get','render_height'],5],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':.8}},layers.find(l=>l.type==='symbol')?.id);
      navigationMap.addSource('journey',{type:'geojson',data:{type:'FeatureCollection',features:[]}});navigationMap.addLayer({id:'journey-outline',type:'line',source:'journey',paint:{'line-color':navigationNight?'#112745':'#fff','line-width':15}});navigationMap.addLayer({id:'journey-line',type:'line',source:'journey',paint:{'line-color':'#21a96b','line-width':9}});
      navigationMap.addSource('stops',{type:'geojson',data:{type:'FeatureCollection',features:[]}});navigationMap.addLayer({id:'journey-stops',type:'circle',source:'stops',paint:{'circle-radius':6,'circle-color':['case',['get','government'],'#ffb76c','#a5e7cb'],'circle-stroke-color':'#102820','circle-stroke-width':2}});
      const position=navigationLastPosition||lastPos||(coords.length?pointOnRoute(progress):null);
      syncNavigationData();
      navigationMap.resize();
      if(position&&(firstStyle||!navigationMarker))followNavigationPosition(position,firstStyle&&!mainMapBrowsing);
      if(firstStyle&&coords.length&&!mainMapBrowsing&&!document.body.classList.contains('driving'))fitNavigationRoute();
    });
    navigationMap.on('click','journey-stops',e=>{if(pickingMapPin)return;const f=e.features?.[0];if(!f)return;const label=document.createElement('div');label.textContent=f.properties.name+' · '+f.properties.kind;new maplibregl.Popup().setLngLat(f.geometry.coordinates).setDOMContent(label).addTo(navigationMap)});
    navigationMap.on('webglcontextlost',e=>{navigationContextLost=true;navigationBasemapReady=false;e.originalEvent?.preventDefault?.();navigationReady=false;navigationFailed=true;host.hidden=true;$('map').hidden=false;map?.invalidateSize({pan:false});drawRoute();if(lastPos)drawPosition(lastPos);window.RahyarRouteOptions?.render();$('map-render-status').textContent='2D fallback · Graphics context lost; selected route preserved';});
    navigationMap.on('webglcontextrestored',()=>{navigationContextLost=false;navigationFailed=false;navigationMap.once('idle',()=>{navigationReady=true;navigationBasemapReady=true;host.hidden=false;host.style.visibility='visible';host.style.pointerEvents='auto';$('map').hidden=true;navigationRouteRevision='';syncNavigationData();window.RahyarRouteOptions?.render();if(lastPos)followNavigationPosition(lastPos,true);});navigationMap.triggerRepaint();});
    let userMovingMap=false;
    navigationMap.on('movestart',event=>{
      if(!event.originalEvent)return;
      userMovingMap=true;
      pauseMapForGesture();
    });
    navigationMap.on('dragstart',()=>{
      if(userMovingMap)return;
      userMovingMap=true;
      pauseMapForGesture();
    });
    navigationMap.on('moveend',()=>{
      if(!userMovingMap)return;
      userMovingMap=false;
      resumeMapAfterGesture();
    });
    let baseErrorTimer=null;
    navigationMap.on('error',event=>{
      if(!navigationReady)$('map-render-status').textContent='3D loading · 2D map available below';
      if(!navigationReady||navigationSatellite||!navigationBasemapSources.has(event.sourceId)||baseErrorTimer)return;
      baseErrorTimer=setTimeout(()=>{baseErrorTimer=null;if(!navigationReady||navigationContextLost)return;const canvas=navigationMap.getCanvas(),x=canvas.clientWidth/2,y=canvas.clientHeight/2;const visible=navigationMap.queryRenderedFeatures([[x-64,y-64],[x+64,y+64]]).some(f=>navigationBasemapSources.has(f.source));if(!visible){navigationBasemapReady=false;showRasterMapFallback('2D map · vector tiles failed in this area. Retry 3D in Map layers.');}},3000);
    });
    waitForNavigationStyle();
    window.addEventListener('resize',()=>navigationMap?.resize());
  }catch(error){console.warn('3D map initialization failed',error);
    navigationFailed=true;
    host.hidden=true;
    button.disabled=true;
    $('map-render-status').textContent='2D fallback · WebGL unavailable on this device'}
}
