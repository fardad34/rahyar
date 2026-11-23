'use strict';
(function(root){
 function select(elements,origin,end,{routed=false}={}){
  const sx=111195*Math.cos(origin[1]*Math.PI/180),sy=111195,dx=(end[0]-origin[0])*sx,dy=(end[1]-origin[1])*sy,length=Math.hypot(dx,dy);if(length<15000)return [];
  const picks=new Map(),minimum=Math.min(6000,Math.max(1500,length*.04));
  for(const way of elements){const tags=way.tags||{},line=way.geometry;if(way.type!=='way'||!routed&&!['motorway','trunk','primary'].includes(tags.highway)||/^(private|no)$/.test(tags.access||'')||/^(private|no)$/.test(tags.hgv||'')||!Array.isArray(line))continue;
   for(let i=1;i<line.length;i++){
    const a=line[i-1],b=line[i];if(![a.lon,a.lat,b.lon,b.lat].every(Number.isFinite))continue;
    const ex=(b.lon-a.lon)*sx,ey=(b.lat-a.lat)*sy;const alignment=(ex*dx+ey*dy)/(Math.hypot(ex,ey)*length||1);if((routed?alignment:Math.abs(alignment))<.65)continue;
    const x=(b.lon-origin[0])*sx,y=(b.lat-origin[1])*sy,along=(x*dx+y*dy)/length,side=(dx*y-dy*x)/length;
    if(along<length*.05||along>length*.75||Math.abs(side)<minimum||Math.abs(side)>40000)continue;
    const detour=Math.hypot(x,y)+Math.hypot(dx-x,dy-y)-length;if(detour>length*.8+10000)continue;
    const sign=side>0?1:-1,score=Math.abs(side)-detour*.4-Math.abs(along-length*.3)*.2+(tags.highway==='primary'?0:12000);
    if(!picks.has(sign)||score>picks.get(sign).score)picks.set(sign,{coord:[b.lon,b.lat],name:tags.name||'',ref:tags.ref||'',side:sign,score});
   }
  }
  return [...picks.values()];
 }

 function routedPoint(route,origin,end,side){const elements=(route.legs||[]).flatMap(l=>l.steps||[]).filter(s=>s.distance>=5000&&s.geometry?.coordinates?.length>1).map(s=>({type:'way',tags:{name:s.name||'',highway:'routed'},geometry:s.geometry.coordinates.map(p=>({lon:p[0],lat:p[1]}))}));return select(elements,origin,end,{routed:true}).find(p=>p.side===side)||null;}
 function probes(origin,end){const sx=111195*Math.cos(origin[1]*Math.PI/180),sy=111195,dx=(end[0]-origin[0])*sx,dy=(end[1]-origin[1])*sy,length=Math.hypot(dx,dy);if(length<15000)return [];const offset=Math.min(22000,length*.22),bearing=(Math.atan2(dx,dy)*180/Math.PI+360)%360;return [-1,1].map(side=>({coord:[origin[0]+(dx*.1-dy/length*offset*side)/sx,origin[1]+(dy*.1+dx/length*offset*side)/sy],side,probe:true,bearing,source:'Router correlation search, not a claimed road location'}));}
 if(typeof module!=='undefined'&&module.exports){module.exports={select,probes,routedPoint};return;}
 async function find(origin,end){
  const elements=[];
  // Reuse road features already loaded by the existing map when available.
  const host=typeof navigationMap!=='undefined'?navigationMap:null;
  if(host?.getStyle){for(const [id,source]of Object.entries(host.getStyle().sources||{})){if(source.type!=='vector')continue;try{for(const f of host.querySourceFeatures(id,{sourceLayer:'transportation'})){const lines=f.geometry?.type==='LineString'?[f.geometry.coordinates]:f.geometry?.type==='MultiLineString'?f.geometry.coordinates:[];for(const line of lines)elements.push({type:'way',tags:{highway:f.properties.class,ref:f.properties.ref,name:f.properties.name,access:f.properties.access,hgv:f.properties.hgv},geometry:line.map(p=>({lon:p[0],lat:p[1]}))});}}catch{}}}
  const existing=select(elements,origin,end),sides=new Set(existing.map(p=>p.side));return [...existing,...probes(origin,end).filter(p=>!sides.has(p.side))].slice(0,2);
 }
 root.RahyarCorridorRoads={find,select,probes,routedPoint};
})(typeof window!=='undefined'?window:globalThis);
