'use strict';

const roadPointSVG=path=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">'+path+'</svg>';
const roadMarkerKinds={
 signals:{icon:roadPointSVG('<rect x="7" y="2" width="10" height="19" rx="3"/><circle cx="12" cy="6" r="1" fill="#ec6262"/><circle cx="12" cy="11" r="1" fill="#f8ce54"/><circle cx="12" cy="16" r="1" fill="#55d998"/>'),label:'Mapped traffic signals · OpenStreetMap'},
 speed:{icon:roadPointSVG('<path d="M3 7h5l2-3h5l2 3h4v14H3z"/><circle cx="12" cy="13" r="4"/>'),label:'Mapped speed camera · OpenStreetMap, coverage incomplete'},
 redlight:{icon:roadPointSVG('<rect x="3" y="7" width="18" height="14" rx="2"/><circle cx="12" cy="14" r="4"/><circle cx="5" cy="3" r="2" fill="#ec6262"/>'),label:'Mapped red-light camera · OpenStreetMap, coverage incomplete'},
 junction:{icon:roadPointSVG('<path d="M12 2v20M2 12h20"/>'),label:'Mapped road junction · OpenStreetMap'},
};
const roadMarkerCache = new Map();
let roadMarkers = [];
let activeRoadMarkerCell = '';
let roadMarkerTimer;

function mappedRoadPoints(elements) {
  const cameras = new Map();
  for (const relation of elements.filter(item => item.type === 'relation')) {
    const kind = relation.tags?.enforcement === 'traffic_signals' ? 'redlight' : 'speed';
    for (const member of relation.members || []) {
      if (member.type === 'node' && member.role === 'device') cameras.set(member.ref,kind);
    }
  }
  return elements.filter(node => node.type === 'node' && Number.isFinite(node.lat) && Number.isFinite(node.lon)).flatMap(node => {
    const kind = cameras.get(node.id) || (node.tags?.highway === 'speed_camera' ? 'speed' :
      node.tags?.highway === 'traffic_signals' ? 'signals' : null);
    return kind ? [{kind,lat:node.lat,lon:node.lon}] : node.tags?.highway==='motorway_junction'?[{kind:'junction',lat:node.lat,lon:node.lon}]:[];
  });
}

function showRoadMapMarkers(points) {
  for (const marker of roadMarkers) marker.remove();
  roadMarkers = [];
  for (const {kind,lat,lon} of points) {
    const {icon,label} = roadMarkerKinds[kind];
    if (map) {
      const marker = L.marker([lat,lon],{interactive:false,keyboard:false,
        icon:L.divIcon({className:'road-map-marker',html:icon,iconSize:[28,28]})}).addTo(map);
      marker.getElement()?.setAttribute('title',label);
      roadMarkers.push(marker);
    }
    if (navigationMap) {
      const node = document.createElement('span');
      node.className = 'road-map-marker';
      node.innerHTML = icon;
      node.title = label;
      node.setAttribute('aria-label',label);
      roadMarkers.push(new maplibregl.Marker({element:node}).setLngLat([lon,lat]).addTo(navigationMap));
    }
  }
}

async function refreshRoadMapMarkers() {
  const visibleMap = $('map').hidden ? navigationMap : map;
  if (!visibleMap || visibleMap.getZoom() < 14) {
    if (activeRoadMarkerCell) showRoadMapMarkers([]);updateKilometreMarker([]);
    activeRoadMarkerCell = '';
    return;
  }
  const center=watch!==null&&lastPos?{lat:lastPos[1],lng:lastPos[0]}:visibleMap.getCenter();
  const {lat,lng}=center;
  const grid = .014;
  const y = Math.floor(lat/grid)*grid;
  const x = Math.floor(lng/grid)*grid;
  const cell = y.toFixed(3)+','+x.toFixed(3);
  if(cell===activeRoadMarkerCell){const data=await roadMarkerCache.get(cell);if(data)updateKilometreMarker(data.milestones);return;}
  activeRoadMarkerCell = cell;
  if (!roadMarkerCache.has(cell)) {
    if (roadMarkerCache.size >= 50) roadMarkerCache.delete(roadMarkerCache.keys().next().value);
    const box = [y-grid/2,x-grid/2,y+grid*1.5,x+grid*1.5].map(n=>n.toFixed(5)).join(',');
    const query = '[out:json][timeout:10];(node["highway"~"^(traffic_signals|speed_camera|motorway_junction|milestone)$"]('+box+');' +
      'rel["type"="enforcement"]["enforcement"~"^(maxspeed|traffic_signals)$"]('+box+'););' +
      'out body;node(r:"device");out body;' + 'way["highway"~"^(primary|secondary|tertiary|residential|unclassified)$"]('+box+');out geom;' ;
    const lookup = url => getJSON(url,{method:'POST',body:new URLSearchParams({data:query})},13000);
    roadMarkerCache.set(cell,lookup('https://overpass-api.de/api/interpreter')
      .catch(()=>lookup('https://overpass.private.coffee/api/interpreter'))
      .then(result=>{const elements=result.elements||[];return {points:[...mappedRoadPoints(elements),...mappedJunctions(elements)],milestones:mappedMilestones(elements)};}).catch(()=>{
        setTimeout(()=>{
          roadMarkerCache.delete(cell);
          if (activeRoadMarkerCell === cell) activeRoadMarkerCell = '';
        },45000);
        return {points:[],milestones:[]};
      }));
  }
  const data = await roadMarkerCache.get(cell);
  const points=data.points;
  if (activeRoadMarkerCell !== cell) return;
  const closest = points.sort((a,b)=>Math.hypot(a.lat-lat,a.lon-lng)-Math.hypot(b.lat-lat,b.lon-lng)).slice(0,60);
  showRoadMapMarkers(closest);updateKilometreMarker(data.milestones);
}

function scheduleRoadMapMarkers() {
  if (roadMarkerTimer) return;
  roadMarkerTimer = setTimeout(() => {
    roadMarkerTimer = null;
    refreshRoadMapMarkers();
  },1800);
}

function initRoadMapMarkers() {
  map?.attributionControl?.addAttribution('Road markers © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>');
  map?.on('moveend',scheduleRoadMapMarkers);
  navigationMap?.on('moveend',scheduleRoadMapMarkers);
  navigationMap?.on('style.load',scheduleRoadMapMarkers);
  scheduleRoadMapMarkers();
}

// Shared OSM topology nodes represent actual junctions; geometric crossings alone do not.
function mappedJunctions(elements){
 const nodes=new Map();
 for(const way of elements.filter(e=>e.type==='way'&&e.nodes?.length&&e.geometry?.length)){
  if(way.tags?.access==='private')continue;
  way.nodes.forEach((id,i)=>{const p=way.geometry[i];if(!p)return;const item=nodes.get(id)||{lat:p.lat,lon:p.lon,neighbors:new Set()};if(i)item.neighbors.add(way.nodes[i-1]);if(i+1<way.nodes.length)item.neighbors.add(way.nodes[i+1]);nodes.set(id,item);});
 }
 return [...nodes.values()].filter(n=>n.neighbors.size>=3).map(({lat,lon})=>({kind:'junction',lat,lon}));
}
function mappedMilestones(elements){
 return elements.filter(n=>n.type==='node'&&n.tags?.highway==='milestone'&&Number.isFinite(n.lat)&&Number.isFinite(n.lon)).flatMap(n=>{
  const value=String(n.tags.distance||'').trim();if(!/^\d+(?:\.\d+)?(?:\s*(?:km|mi))?$/.test(value))return [];
  return [{coord:[n.lon,n.lat],label:(value.endsWith('mi')?'':'km ')+value.replace(/\s*km$/,''),source:'OpenStreetMap milestone',ref:n.tags.ref||''}];
 });
}
function updateKilometreMarker(points){
 let badge=document.getElementById('nav-km-marker');if(!badge){badge=document.createElement('div');badge.id='nav-km-marker';badge.className='nav-km-marker';badge.hidden=true;document.getElementById('nav-shell')?.append(badge);}
 const current=lastPos&&points.map(p=>({...p,d:typeof hav==='function'?hav(lastPos,p.coord):Infinity})).filter(p=>p.d<=100).sort((a,b)=>a.d-b.d)[0];
 badge.hidden=!current;if(current){badge.textContent=current.label;badge.title=current.source+' · nearby mapped marker, not trip distance';}
}
