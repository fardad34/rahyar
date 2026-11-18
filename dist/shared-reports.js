'use strict';
// Bridge classic navigation state to the independently bundled account/report client.
window.rahyarReportContext = () => {
  const explore=watch===null || !coords.length;
  let bounds;
  if(explore && navigationReady && navigationMap){const b=navigationMap.getBounds();bounds={south:b.getSouth(),north:b.getNorth(),west:b.getWest(),east:b.getEast()};}
  else if(explore && map){const b=map.getBounds();bounds={south:b.getSouth(),north:b.getNorth(),west:b.getWest(),east:b.getEast()};}
  else if(coords.length){bounds={south:90,north:-90,west:180,east:-180};for(const [lon,lat] of coords){bounds.south=Math.min(bounds.south,lat-.1);bounds.north=Math.max(bounds.north,lat+.1);bounds.west=Math.min(bounds.west,lon-.1);bounds.east=Math.max(bounds.east,lon+.1);}}
  return {explore,bounds,position:lastPos,heading:gpsTravelHeading,project:coords.length?project:null,progress,distance:hav};
};
let sharedReportLeaflet=null;
window.rahyarRenderReportMarkers = rows => {
 const features={type:'FeatureCollection',features:rows.map(r=>({type:'Feature',geometry:{type:'Point',coordinates:[r.longitude,r.latitude]},properties:{id:r.id,label:r.category==='weigh'?'W':r.category==='police'?'P':r.category==='closed'?'×':'!'}}))};
 if(navigationReady && navigationMap){
  if(!navigationMap.getSource('driver-reports')){
   navigationMap.addSource('driver-reports',{type:'geojson',data:features});
   navigationMap.addLayer({id:'driver-report-points',type:'circle',source:'driver-reports',paint:{'circle-color':'#ffd24c','circle-radius':10,'circle-stroke-width':3,'circle-stroke-color':'#101827'}});
   navigationMap.addLayer({id:'driver-report-labels',type:'symbol',source:'driver-reports',layout:{'text-field':['get','label'],'text-size':13}});
  } else navigationMap.getSource('driver-reports').setData(features);
 }
 if(map && window.L){
  if(sharedReportLeaflet)map.removeLayer(sharedReportLeaflet);
  sharedReportLeaflet=L.layerGroup(rows.map(r=>{
   const label=document.createElement('span');label.textContent='Driver report · '+r.category+(r.status?' · '+r.status:'')+' · '+new Date(r.observed_at).toLocaleTimeString();
   return L.circleMarker([r.latitude,r.longitude],{radius:9,color:'#101827',weight:3,fillColor:'#ffd24c',fillOpacity:1}).bindPopup(label);
  })).addTo(map);
 }
};
document.addEventListener('rahyar:reports',()=>{
 document.querySelectorAll('.station-report-panel').forEach(p=>p.refreshStatus?.());
});
window.rahyarSubmitStation = async (station,status) => {
 if(!window.RahyarCloud)throw Error('Shared reports are not connected.');
 if(watch===null)throw Error('Start live GPS tracking before reporting a station so travel direction is current.');
 if(!lastPos || !gpsTime || Date.now()-gpsTime>15000 || !Number.isFinite(lastAccuracyMeters) || lastAccuracyMeters>100)throw Error('A fresh, accurate GPS fix is required.');
 if(hav(lastPos,station.coord)>1500)throw Error('Report only when you can observe this station within 1.5 km.');
 if(!Number.isFinite(gpsTravelHeading))throw Error('Travel direction is unavailable. Report when GPS direction is reliable.');
 return window.RahyarCloud.submit({category:'weigh',station_key:window.RahyarCloud.stationKey(station),status,latitude:lastPos[1],longitude:lastPos[0],accuracy_m:lastAccuracyMeters,heading:gpsTravelHeading});
};
window.rahyarOpenStationReport = () => {
 const box=$('nearby-station-actions');box.replaceChildren();
 const stations=(window.RAHYAR_FACILITY_CATALOG?.facilities||[]).filter(s=>s.authority==='government' && lastPos && hav(lastPos,s.coord)<=1500);
 for(const station of stations){
  const row=document.createElement('div'),label=document.createElement('strong');label.textContent=station.name;row.append(label);
  for(const status of ['open','closed']){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=status==='open'?'Open':'Closed';b.onclick=async()=>{try{const result=await window.rahyarSubmitStation(station,status);$('dashboard-report-status').textContent=result.queued?'Observation queued; not shared yet.':'Observation shared with drivers; official status remains unverified.';}catch(e){$('dashboard-report-status').textContent=e.message;}};row.append(b);}box.append(row);
 }
 if(!stations.length)box.textContent='No verified government station within 1.5 km of your GPS position. Status remains Unknown. Follow posted signs.';
};
$('report-open').onclick=()=>{$('report-dialog').showModal();};
$('report-close').onclick=()=>{$('report-dialog').close();};
setInterval(()=>{if(window.RahyarCloud?.user)window.RahyarCloud.refresh();},60000);
