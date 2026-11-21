'use strict';
(() => {
 let choices=[],selected=0,labels=[],fallback=[],styleBound=false,pending=true;
 const palette=['#9f60ed','#27bfdf','#f4b34e'];
 function offset(index){return [index*45,-45-index*45];}
 function labelPoint(line,index){
  const width=navigationMap.getContainer().clientWidth,height=navigationMap.getContainer().clientHeight,[dx,dy]=offset(index);const blockers=['nav-turn','nav-trip-sheet','nav-search-panel'].map(id=>document.getElementById(id)).filter(e=>e&&!e.hidden).map(e=>e.getBoundingClientRect());let best=line[0],score=Infinity;const stride=Math.max(1,Math.floor(line.length/160));
  for(let i=0;i<line.length;i+=stride){const p=navigationMap.project(line[i]),box={left:p.x+dx-100,right:p.x+dx+100,top:p.y+dy-20,bottom:p.y+dy+20};if(box.left<15||box.right>width-85||box.top<85||box.bottom>height-20||blockers.some(r=>box.left<r.right&&box.right>r.left&&box.top<r.bottom&&box.bottom>r.top))continue;const value=Math.abs(p.y-height*(.45+index*.12));if(value<score){score=value;best=line[i];}}
  return best;
 }
 function fit(){if(!choices.length||!navigationReady)return;const first=choices[0].geometry.coordinates[0],bounds=new maplibregl.LngLatBounds(first,first);choices.slice(0,3).forEach(r=>r.geometry.coordinates.forEach(p=>bounds.extend(p)));cockpitMapFollow=false;navigationMap.fitBounds(bounds,{padding:80,pitch:0,bearing:0,duration:300});}
 function clear(){labels.forEach(m=>m.remove());labels=[];fallback.forEach(l=>l.remove());fallback=[];}
 function choose(index){if(index===selected)return;if(watch!==null&&!confirm('Use this alternative? Routing will keep your current vehicle restrictions.'))return;chooseRoute(index);}
 function render(){if(!navigationReady||!navigationMap?.getSource('journey')){pending=true;if(!map||$('map').hidden)return;}else pending=false;clear();const visible=choices.slice(0,3);
  if(navigationReady&&navigationMap?.getSource('journey')){
   if(!navigationMap.getSource('route-options')){navigationMap.addSource('route-options',{type:'geojson',data:{type:'FeatureCollection',features:[]}});navigationMap.addLayer({id:'route-options-line',type:'line',source:'route-options',paint:{'line-color':['get','color'],'line-width':7,'line-opacity':.86}},navigationMap.getLayer('journey-outline')?'journey-outline':undefined);}
   navigationMap.getSource('route-options').setData({type:'FeatureCollection',features:visible.map((r,index)=>({type:'Feature',geometry:r.geometry,properties:{index,color:palette[index]}}))});
   for(const [index,route]of visible.entries()){
    const line=route.geometry.coordinates,p=labelPoint(line,index);const b=document.createElement('button');b.className='route-map-label'+(index===selected?' selected':'');b.type='button';b.textContent=(route.distance/1000).toFixed(0)+' km / '+(route.distance/1609.344).toFixed(0)+' mi · '+Math.round(route.duration/60)+' min';b.setAttribute('aria-label','Choose route '+(index+1)+': '+b.textContent);b.onclick=e=>{e.stopPropagation();choose(index);};const marker=new maplibregl.Marker({element:b,offset:offset(index)}).setLngLat(p).addTo(navigationMap);b.setAttribute('aria-label','Choose route '+(index+1)+': '+b.textContent);marker.routeIndex=index;labels.push(marker);
   }
  }
  if(map&&!$('map').hidden)for(const [index,r]of visible.entries()){const layer=L.polyline(r.geometry.coordinates.map(p=>[p[1],p[0]]),{color:palette[index],weight:index===selected?8:6}).addTo(map);layer.on('click',e=>{L.DomEvent.stopPropagation(e.originalEvent);choose(index);});layer.bindTooltip((r.distance/1000).toFixed(0)+' km / '+Math.round(r.duration/60)+' min',{permanent:true});fallback.push(layer);}
 }
 window.RahyarRouteOptions={fit,set(routes,index){choices=routes.slice(0,3);selected=index;render();},render,get choices(){return choices;}};
 function bind(){if(!navigationMap||styleBound)return;styleBound=true;navigationMap.on('style.load',()=>{pending=true;setTimeout(render,0);});navigationMap.on('idle',()=>{if(pending)render();});navigationMap.on('moveend',()=>{for(const marker of labels){const route=choices[marker.routeIndex];if(route)marker.setLngLat(labelPoint(route.geometry.coordinates,marker.routeIndex));}});render();navigationMap.on('click','route-options-line',e=>{if(!e.features?.length)return;e.originalEvent._rahyarRoute=true;choose(Number(e.features[0].properties.index));});}
 const timer=setInterval(()=>{bind();if(styleBound)clearInterval(timer);},500);
})();
