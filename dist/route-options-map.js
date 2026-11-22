'use strict';
(() => {
 let choices=[],selected=0,labels=[],fallback=[],styleBound=false,pending=true,selectedUntil=0,expiryTimer;
 const palette=['#9f60ed','#27bfdf','#f4b34e'];
 function offset(){return [0,-25];}
 function labelPoint(line,index,host=navigationMap){
  const container=host.getContainer(),width=container.clientWidth,height=container.clientHeight;
  const project=p=>host===navigationMap?host.project(p):host.latLngToContainerPoint([p[1],p[0]]);
  const origin=container.getBoundingClientRect();
  const blockers=['nav-turn','nav-trip-sheet','nav-search-panel'].map(id=>document.getElementById(id)).filter(e=>e&&!e.hidden).map(e=>{const r=e.getBoundingClientRect();return {left:r.left-origin.left,right:r.right-origin.left,top:r.top-origin.top,bottom:r.bottom-origin.top};});
  // An alternative is labeled only on a visible branch that differs from the selected route.
  const active=index===selected?[]:(choices[selected]?.geometry.coordinates||[]).map(project);
  let best=null,score=Infinity;const stride=Math.max(1,Math.floor(line.length/180));
  const gap=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
  for(let i=0;i<line.length;i+=stride){
   const p=project(line[i]),box={left:p.x-105,right:p.x+105,top:p.y-45,bottom:p.y-5};
   if(box.left<15||box.right>width-85||box.top<85||box.bottom>height-20||blockers.some(r=>box.left<r.right&&box.right>r.left&&box.top<r.bottom&&box.bottom>r.top))continue;
   let overlaps=false;for(let j=1;j<active.length;j++){if(gap(p,active[j-1],active[j])<24){overlaps=true;break;}}if(overlaps)continue;
   const value=Math.abs(p.y-height*.43);if(value<score){score=value;best=line[i];}
  }
  return best;
 }
 function showLabel(index){return index!==selected||Date.now()<selectedUntil;}
 function fit(){if(!choices.length||!navigationReady)return;const first=choices[0].geometry.coordinates[0],bounds=new maplibregl.LngLatBounds(first,first);choices.slice(0,3).forEach(r=>r.geometry.coordinates.forEach(p=>bounds.extend(p)));cockpitMapFollow=false;navigationMap.fitBounds(bounds,{padding:80,pitch:0,bearing:0,duration:300});}
 function clear(){labels.forEach(m=>m.remove());labels=[];fallback.forEach(l=>l.remove());fallback=[];}
 function choose(index){if(index===selected){rememberRoutePreference(choices[index]);return;}if(watch!==null&&!confirm('Use this alternative? Routing will keep your current vehicle restrictions.'))return;chooseRoute(index);}
 function render(){if(!navigationReady||!navigationMap?.getSource('journey')){pending=true;if(!map||$('map').hidden)return;}else pending=false;clear();const visible=choices.slice(0,3);
  if(navigationReady&&navigationMap?.getSource('journey')){
   if(!navigationMap.getSource('route-options')){navigationMap.addSource('route-options',{type:'geojson',data:{type:'FeatureCollection',features:[]}});navigationMap.addLayer({id:'route-options-line',type:'line',source:'route-options',paint:{'line-color':['get','color'],'line-width':7,'line-opacity':.86}},navigationMap.getLayer('journey-outline')?'journey-outline':undefined);}
   navigationMap.getSource('route-options').setData({type:'FeatureCollection',features:visible.map((r,index)=>({type:'Feature',geometry:r.geometry,properties:{index,color:palette[index]}}))});
   for(const [index,route]of visible.entries()){
    if(!showLabel(index))continue;const line=route.geometry.coordinates,p=labelPoint(line,index);if(!p)continue;const b=document.createElement('button');b.className='route-map-label'+(index===selected?' selected':'');b.type='button';b.style.borderColor=palette[index];b.textContent=(route.preferred?(window.rahyarText?.('Preferred')||'Preferred')+' · ':'')+(route.distance/1000).toFixed(0)+' km / '+(route.distance/1609.344).toFixed(0)+' mi · '+Math.round(route.duration/60)+' min';b.setAttribute('aria-label','Choose route '+(index+1)+': '+b.textContent);b.onclick=e=>{e.stopPropagation();choose(index);};const marker=new maplibregl.Marker({element:b,offset:offset(index)}).setLngLat(p).addTo(navigationMap);b.setAttribute('aria-label','Choose route '+(index+1)+': '+b.textContent);marker.routeIndex=index;labels.push(marker);
   }
  }
  if(map&&!$('map').hidden)for(const [index,r]of visible.entries()){const layer=L.polyline(r.geometry.coordinates.map(p=>[p[1],p[0]]),{color:palette[index],weight:index===selected?8:6}).addTo(map);layer.on('click',e=>{L.DomEvent.stopPropagation(e.originalEvent);choose(index);});fallback.push(layer);const anchor=showLabel(index)?labelPoint(r.geometry.coordinates,index,map):null;if(anchor){const tooltip=L.tooltip({permanent:true,direction:'top',className:'route-option-tooltip'}).setLatLng([anchor[1],anchor[0]]).setContent((r.distance/1000).toFixed(0)+' km / '+Math.round(r.duration/60)+' min').addTo(map);fallback.push(tooltip);}}
 }
 window.RahyarRouteOptions={fit,set(routes,index){if(routes[index]!==choices[selected]){selectedUntil=Date.now()+60000;clearTimeout(expiryTimer);expiryTimer=setTimeout(render,60000);}choices=routes.slice(0,3);selected=index;render();},render,get choices(){return choices;}};
 function bind(){if(!navigationMap||styleBound)return;styleBound=true;navigationMap.on('style.load',()=>{pending=true;setTimeout(render,0);});navigationMap.on('idle',()=>{if(pending)render();});navigationMap.on('moveend',()=>{render();});render();navigationMap.on('click','route-options-line',e=>{if(!e.features?.length)return;e.originalEvent._rahyarRoute=true;choose(Number(e.features[0].properties.index));});}
 if(typeof map!=='undefined'&&map)map.on('moveend',()=>{if(!navigationReady)render();});
 const timer=setInterval(()=>{bind();if(styleBound)clearInterval(timer);},500);
})();
