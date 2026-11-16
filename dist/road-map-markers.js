'use strict';

const roadMarkerKinds = {
  signals:{icon:'🚦',label:'Mapped traffic signals'},
  speed:{icon:'📷',label:'Mapped speed camera'},
  redlight:{icon:'🚦📷',label:'Mapped red-light camera'},
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
    return kind ? [{kind,lat:node.lat,lon:node.lon}] : [];
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
      node.textContent = icon;
      node.title = label;
      node.setAttribute('aria-label',label);
      roadMarkers.push(new maplibregl.Marker({element:node}).setLngLat([lon,lat]).addTo(navigationMap));
    }
  }
}

async function refreshRoadMapMarkers() {
  const visibleMap = $('map').hidden ? navigationMap : map;
  if (!visibleMap || visibleMap.getZoom() < 14) {
    if (activeRoadMarkerCell) showRoadMapMarkers([]);
    activeRoadMarkerCell = '';
    return;
  }
  const {lat,lng} = visibleMap.getCenter();
  const grid = .014;
  const y = Math.floor(lat/grid)*grid;
  const x = Math.floor(lng/grid)*grid;
  const cell = y.toFixed(3)+','+x.toFixed(3);
  if (cell === activeRoadMarkerCell) return;
  activeRoadMarkerCell = cell;
  if (!roadMarkerCache.has(cell)) {
    if (roadMarkerCache.size >= 50) roadMarkerCache.delete(roadMarkerCache.keys().next().value);
    const box = [y-grid/2,x-grid/2,y+grid*1.5,x+grid*1.5].map(n=>n.toFixed(5)).join(',');
    const query = '[out:json][timeout:10];(node["highway"~"^(traffic_signals|speed_camera)$"]('+box+');' +
      'rel["type"="enforcement"]["enforcement"~"^(maxspeed|traffic_signals)$"]('+box+'););' +
      'out body;node(r:"device");out body;';
    const lookup = url => getJSON(url,{method:'POST',body:new URLSearchParams({data:query})},13000);
    roadMarkerCache.set(cell,lookup('https://overpass-api.de/api/interpreter')
      .catch(()=>lookup('https://overpass.private.coffee/api/interpreter'))
      .then(result=>mappedRoadPoints(result.elements || [])).catch(()=>{
        setTimeout(()=>{
          roadMarkerCache.delete(cell);
          if (activeRoadMarkerCell === cell) activeRoadMarkerCell = '';
        },45000);
        return [];
      }));
  }
  const points = await roadMarkerCache.get(cell);
  if (activeRoadMarkerCell !== cell) return;
  const closest = points.sort((a,b)=>Math.hypot(a.lat-lat,a.lon-lng)-Math.hypot(b.lat-lat,b.lon-lng)).slice(0,60);
  showRoadMapMarkers(closest);
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
