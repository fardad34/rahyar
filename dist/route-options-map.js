'use strict';
(() => {
 let choices=[],selected=0,labels=[],fallback=[],styleBound=false,pending=true,selectedUntil=0,expiryTimer;
 const palette=['#9f60ed','#27bfdf','#f4b34e'];
 function offset(){return [0,-25];}
 function labelPoint(line,index,host=navigationMap){
  const container=host.getContainer(),width=container.clientWidth,height=container.clientHeight;
  const project=p=>host===navigationMap?host.project(p):host.latLngToContainerPoint([p[1],p[0]]);
  const origin=container.getBoundingClientRect();
  const blockers=['nav-turn','nav-trip-sheet','nav-search-panel','focus-current-road'].map(id=>document.getElementById(id)).filter(e=>e&&!e.hidden).map(e=>{const r=e.getBoundingClientRect();return {left:r.left-origin.left,right:r.right-origin.left,top:r.top-origin.top,bottom:r.bottom-origin.top};});
  // An alternative is labeled only on a visible branch that differs from the selected route.
  const active=index===selected?[]:(choices[selected]?.geometry.coordinates||[]).map(project),segments=[];for(let i=1;i<active.length;i++){const a=active[i-1],b=active[i];if(Math.max(a.x,b.x)<0||Math.min(a.x,b.x)>width||Math.max(a.y,b.y)<0||Math.min(a.y,b.y)>height)continue;segments.push([a,b]);}
  const bounds=host.getBounds?.(),visible=line.filter(p=>!bounds||p[0]>=bounds.getWest()&&p[0]<=bounds.getEast()&&p[1]>=bounds.getSouth()&&p[1]<=bounds.getNorth()).map(p=>({coord:p,p:project(p)})).filter(({p})=>p.x>=15&&p.x<=width-85&&p.y>=85&&p.y<=height-20);
  let best=null,score=Infinity;const stride=Math.max(1,Math.floor(visible.length/180));
  const gap=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
  for(let i=0;i<visible.length;i+=stride){
   const {p,coord}=visible[i],box={left:p.x-105,right:p.x+105,top:p.y-45,bottom:p.y-5};
   if(box.left<15||box.right>width-85||box.top<85||box.bottom>height-20||blockers.some(r=>box.left<r.right&&box.right>r.left&&box.top<r.bottom&&box.bottom>r.top))continue;
   let overlaps=false;for(const [a,b]of segments){if(gap(p,a,b)<24){overlaps=true;break;}}if(overlaps)continue;
   const value=Math.abs(p.y-height*.43);if(value<score){score=value;best=coord;}
  }
  return best;
 }
 function showLabel(index){return index!==selected||Date.now()<selectedUntil;}
 function fit({nearby=false}={}){if(!choices.length||!navigationReady)return;const start=choices[0].geometry.coordinates[0],anchor=typeof lastPos!=='undefined'&&lastPos?lastPos:start,first=nearby?anchor:start,bounds=new maplibregl.LngLatBounds(first,first);let points=0;choices.slice(0,3).forEach(r=>r.geometry.coordinates.filter(p=>!nearby||hav(anchor,p)<80000).forEach(p=>{bounds.extend(p);points++;}));if(points<2)return;cockpitMapFollow=false;navigationMap.setPadding?.({top:0,bottom:0,left:0,right:0});const sheet=document.getElementById('nav-trip-sheet')?.getBoundingClientRect(),width=navigationMap.getContainer().clientWidth,height=navigationMap.getContainer().clientHeight,docked=nearby&&sheet&&sheet.width<width*.65&&sheet.height>height*.25,padding=docked?{top:100,bottom:60,left:Math.ceil(sheet.right+24),right:100}:80;navigationMap.fitBounds(bounds,{padding,pitch:0,bearing:0,duration:300,...(nearby?{maxZoom:13.5}:{})});}
 function clear(){labels.forEach(m=>m.remove());labels=[];fallback.forEach(l=>l.remove());fallback=[];}
 function choose(index){if(index===selected){rememberRoutePreference(choices[index]);return;}if(watch!==null&&!confirm('Use this alternative? Routing will keep your current vehicle restrictions.'))return;chooseRoute(index);}
 function render(){if(!navigationReady||!navigationMap?.getSource('journey')){pending=true;if(!map||$('map').hidden)return;}else pending=false;clear();const visible=choices.slice(0,3);
  if(navigationReady&&navigationMap?.getSource('journey')){
   if(!navigationMap.getSource('route-options')){navigationMap.addSource('route-options',{type:'geojson',data:{type:'FeatureCollection',features:[]}});navigationMap.addLayer({id:'route-options-line',type:'line',source:'route-options',paint:{'line-color':['get','color'],'line-width':7,'line-opacity':.86}},navigationMap.getLayer('journey-outline')?'journey-outline':undefined);}
   navigationMap.getSource('route-options').setData({type:'FeatureCollection',features:visible.map((r,index)=>({type:'Feature',geometry:r.geometry,properties:{index,color:palette[index]}}))});
   for(const [index,route]of visible.entries()){
    if(!showLabel(index))continue;const line=route.geometry.coordinates,p=labelPoint(line,index);if(!p)continue;const b=document.createElement('button');b.className='route-map-label'+(index===selected?' selected':'');b.type='button';b.style.borderColor=palette[index];b.title=route.partialStepEstimate?'Local section recalculated; remaining time estimated from the active route profile.':'';b.textContent=(route.partialStepEstimate?'≈ ':'')+(route.preferred?(window.rahyarText?.('Preferred')||'Preferred')+' · ':'')+(route.distance/1000).toFixed(0)+' km / '+(route.distance/1609.344).toFixed(0)+' mi · '+Math.round(route.duration/60)+' min';b.setAttribute('aria-label','Choose route '+(index+1)+': '+b.textContent);b.onclick=e=>{e.stopPropagation();choose(index);};const marker=new maplibregl.Marker({element:b,offset:offset(index)}).setLngLat(p).addTo(navigationMap);b.setAttribute('aria-label','Choose route '+(index+1)+': '+b.textContent);marker.routeIndex=index;labels.push(marker);
   }
  }
  if(map&&!$('map').hidden)for(const [index,r]of visible.entries()){const layer=L.polyline(r.geometry.coordinates.map(p=>[p[1],p[0]]),{color:palette[index],weight:index===selected?8:6}).addTo(map);layer.on('click',e=>{L.DomEvent.stopPropagation(e.originalEvent);choose(index);});fallback.push(layer);const anchor=showLabel(index)?labelPoint(r.geometry.coordinates,index,map):null;if(anchor){const tooltip=L.tooltip({permanent:true,direction:'top',className:'route-option-tooltip'}).setLatLng([anchor[1],anchor[0]]).setContent((r.distance/1000).toFixed(0)+' km / '+Math.round(r.duration/60)+' min').addTo(map);fallback.push(tooltip);}}
 }
 window.RahyarRouteOptions={fit,set(routes,index){if(routes[index]!==choices[selected]){selectedUntil=Date.now()+60000;clearTimeout(expiryTimer);expiryTimer=setTimeout(render,60000);}choices=routes.slice(0,3);selected=index;render();},render,get choices(){return choices;}};
 function bind(){if(!navigationMap||styleBound)return;styleBound=true;navigationMap.on('style.load',()=>{pending=true;setTimeout(render,0);});navigationMap.on('idle',()=>{if(pending)render();});navigationMap.on('moveend',()=>{render();});render();navigationMap.on('click','route-options-line',e=>{if(!e.features?.length)return;e.originalEvent._rahyarRoute=true;choose(Number(e.features[0].properties.index));});}
 if(typeof map!=='undefined'&&map)map.on('moveend',()=>{if(!navigationReady)render();});
 const timer=setInterval(()=>{bind();if(styleBound)clearInterval(timer);},500);
})();
