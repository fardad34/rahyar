'use strict';
(function(root){
 const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
 const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
 function meters(a,b){const r=Math.PI/180,x=(a[0]-b[0])*r*Math.cos((a[1]+b[1])*r/2),y=(a[1]-b[1])*r;return Math.hypot(x,y)*6371000;}
 function gap(p,line){let best=Infinity;const x=111195*Math.cos(p[1]*Math.PI/180),y=111195;for(let i=1;i<line.length;i++){const ax=(line[i-1][0]-p[0])*x,ay=(line[i-1][1]-p[1])*y,dx=(line[i][0]-line[i-1][0])*x,dy=(line[i][1]-line[i-1][1])*y,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));best=Math.min(best,Math.hypot(ax+t*dx,ay+t*dy));}return best;}
 function anchors(route,others=[]){
  const line=route.geometry?.coordinates||[];if(line.length<2||!line.every(valid))return [];
  const candidates=[],stride=Math.max(1,Math.floor(line.length/300));
  for(let i=1;i<line.length-1;i+=stride){const p=line[i];if(meters(line[0],p)<1000||meters(line.at(-1),p)<1000)continue;const score=Math.max(0,...others.filter(r=>r!==route).map(r=>gap(p,r.geometry.coordinates)));candidates.push({p,i,score});}
  const groups=[];let group=[];for(const item of candidates){if(item.score>=120)group.push(item);else if(group.length){groups.push(group);group=[];}}if(group.length)groups.push(group);
  const ranked=groups.sort((a,b)=>Math.max(...b.map(c=>c.score))-Math.max(...a.map(c=>c.score))).slice(0,4),chosen=[];
  for(const rows of ranked){const fractions=ranked.length===1?[.2,.5,.8]:ranked.length===2?[.25,.75]:[.5];for(const f of fractions){const item=rows[Math.round((rows.length-1)*f)];if(chosen.every(c=>meters(c.p,item.p)>500))chosen.push(item);if(chosen.length===4)break;}if(chosen.length===4)break;}
  if(!chosen.length)for(const f of [.25,.5,.75]){const i=Math.floor((line.length-1)*f),p=line[i];if(meters(line[0],p)>1000&&meters(line.at(-1),p)>1000&&chosen.every(c=>meters(c.p,p)>3000))chosen.push({p,i});}
  return chosen.sort((a,b)=>a.i-b.i).map(c=>[...c.p]);
 }
 function different(a,b){const line=a.geometry.coordinates,other=b.geometry.coordinates,stride=Math.max(1,Math.floor(line.length/300));for(let i=0;i<line.length;i+=stride)if(gap(line[i],other)>120)return true;return gap(line.at(-1),other)>120;}
 function matches(p,c){return p?.version===1&&valid(p.origin)&&valid(p.destination)&&valid(c.origin)&&valid(c.destination)&&p.vehicle===c.vehicle&&JSON.stringify(stable(p.profile||null))===JSON.stringify(stable(c.profile||null))&&meters(p.origin,c.origin)<3000&&meters(p.destination,c.destination)<1000&&Array.isArray(p.points)&&p.points.length>0&&p.points.length<=4&&p.points.every(valid);}
 function create(route,routes,c){const points=anchors(route,routes);return points.length&&valid(c.origin)&&valid(c.destination)?{version:1,origin:[...c.origin],destination:[...c.destination],vehicle:c.vehicle,profile:stable(c.profile||null),points,chosenAt:Date.now()}:null;}
 function throughRoute(route){const steps=(route.legs||[]).flatMap(l=>l.steps||[]),end=steps.findLastIndex(s=>s.maneuver?.type==='arrive');return {...route,preferred:true,legs:[{distance:route.distance,duration:route.duration,steps:steps.map((s,i)=>((s.maneuver?.type==='depart'&&i!==0)||(s.maneuver?.type==='arrive'&&i!==end))?{...s,maneuver:{...s.maneuver,type:'notification'}}:s)}]};}
 const api={valid,meters,gap,different,anchors,matches,create,throughRoute};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 const key=()=> 'rahyar.routePreferences.v1.'+(root.RahyarCloud?.user?.id||'guest');
 function read(){try{const value=JSON.parse(localStorage.getItem(key())||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
 root.RahyarRouteMemory={...api,find:c=>read().find(p=>matches(p,c))||null,remember(route,routes,c){try{const p=create(route,routes,c);if(!p)return false;localStorage.setItem(key(),JSON.stringify([p,...read().filter(row=>!matches(row,c))].slice(0,100)));return true;}catch{return false;}},clear(){try{localStorage.removeItem(key());}catch{}}};
 const init=()=>{const host=document.getElementById('app-settings');if(!host)return;const b=document.createElement('button');b.type='button';b.className='secondary';b.dataset.rahyarText='';b.dataset.originalLabel='Forget route preferences';b.textContent=root.rahyarText?.('Forget route preferences')||'Forget route preferences';b.onclick=()=>{if(confirm('Forget learned route preferences on this account/device? Saved trips and destinations remain.'))root.RahyarRouteMemory.clear();};host.append(b);};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
