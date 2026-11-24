'use strict';
// Public-provider distance limits are handled without substituting car geometry.
// Candidate split points come from the existing city catalog; every traversed
// section, including any snapped join, must be returned by the vehicle router.
async function requestSegmentedVehicleRoute(points,requestSingle,{canadaOnly=false,maxRequests=48,maxSectionMeters=400000,alternativeCount=0,onProgress=()=>{}}={}) {
  const originCountry=typeof regionAt==='function'?regionAt(points[0])?.country:null;
  const northAmerica=originCountry?['CA','US'].includes(originCountry):null;
  const catalog=(await loadCatalog(points[0])).filter(c=>(!canadaOnly||c.country==='CA')&&(northAmerica===null||['CA','US'].includes(c.country)===northAmerica));
  let requests=0,extraRequests=0;const memo=new Map(),failed=new Map();
  const request=async pair=>{
    const key=JSON.stringify(pair);if(memo.has(key))return memo.get(key);if(failed.has(key))throw failed.get(key);
    if(++requests>maxRequests)throw Object.assign(new Error('Segment request budget exceeded'),{code:'SegmentBudgetExceeded'});
    onProgress(requests);
    const reserveExtra=()=>{if(extraRequests>=4||requests>=maxRequests-8)return false;extraRequests++;requests++;onProgress(requests);return true;};
    try{const result=await requestSingle(pair,reserveExtra);memo.set(key,result);return result;}catch(error){failed.set(key,error);throw error;}
  };
  function candidates(a,b){
    const direct=hav(a,b),middle=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    const ranked=catalog.map(c=>{const start=hav(a,c.coord),end=hav(c.coord,b);return {c,start,end,score:start+end+hav(middle,c.coord)*.3};})
      .filter(x=>x.start>15000&&x.end>15000&&x.start<direct*.85&&x.end<direct*.85)
      .sort((a,b)=>a.score-b.score);
    const choices=[];
    for(const item of ranked){if(choices.every(c=>hav(item.c.coord,c)>25000))choices.push(item.c.coord);if(choices.length===3)break;}
    return choices;
  }
  async function split(a,b,depth=0){
    try{if(hav(a,b)>maxSectionMeters&&depth<9&&candidates(a,b).length)throw Object.assign(new Error('Split long section before requesting it'),{code:'DistanceExceeded'});const routes=await request([a,b]);if(routes.length)return [routes[0]];throw Object.assign(new Error('No vehicle route for a section'),{code:'SegmentNoRoute'});}
    catch(error){
      const recoverable=['DistanceExceeded','NoRoute','SegmentNoRoute','CanadaOnlyRouteUnavailable'].includes(error.code)||error.errorCode===154||((error.name==='TimeoutError'||error.name==='TypeError'||error.status>=500)&&hav(a,b)>150000);
      if(!recoverable)throw error;
      if(depth>=9)throw error;
      for(const middle of candidates(a,b)){
        try{return [...await split(a,middle,depth+1),...await split(middle,b,depth+1)];}
        catch(next){if(!['DistanceExceeded','NoRoute','SegmentNoRoute','CanadaOnlyRouteUnavailable','DisconnectedSegments'].includes(next.code)&&next.errorCode!==154)throw next;}
      }
      throw Object.assign(new Error('No connected vehicle-aware corridor was found within the service limit'),{code:'SegmentNoRoute'});
    }
  }
  const pieces=[];let originalLeg=0;const geometry=[];const originalLegs=[];let totalDistance=0,totalDuration=0;
  async function append(route,steps){
    const line=route.geometry?.coordinates;
    if(!line?.length||!Number.isFinite(route.distance)||!Number.isFinite(route.duration))throw Object.assign(new Error('Invalid routed segment'),{code:'DisconnectedSegments'});
    if(geometry.length&&hav(geometry.at(-1),line[0])>.5){
      const connectors=await request([geometry.at(-1),line[0]]);const connector=connectors[0];
      if(!connector||hav(geometry.at(-1),connector.geometry.coordinates[0])>.5||hav(connector.geometry.coordinates.at(-1),line[0])>.5)throw Object.assign(new Error('Provider sections do not join on the same road'),{code:'DisconnectedSegments'});
      await append(connector,steps);
    }
    for(let i=geometry.length?1:0;i<line.length;i++)geometry.push(line[i]);totalDistance+=route.distance;totalDuration+=route.duration;pieces.push({route,leg:originalLeg});
    steps.push(...(route.legs||[]).flatMap(l=>l.steps||[]));
  }
  for(let i=1;i<points.length;i++){
    originalLeg=i-1;let parts=await split(points[i-1],points[i]);parts=await bypassArtificialStops(parts,pair=>requests>=maxRequests-8?Promise.resolve([]):request(pair));const steps=[];const beforeDistance=totalDistance,beforeDuration=totalDuration;
    for(const part of parts)await append(part,steps);
    // Intermediate split arrivals/departures are not destinations. Keep only
    // the first departure and last arrival for each originally requested leg.
    const lastArrival=steps.findLastIndex(s=>s.maneuver?.type==='arrive');
    originalLegs.push({distance:totalDistance-beforeDistance,duration:totalDuration-beforeDuration,steps:steps.map((step,index)=>((step.maneuver?.type==='arrive'&&index!==lastArrival)||(step.maneuver?.type==='depart'&&index!==0))?{...step,maneuver:{...step.maneuver,type:'notification'}}:step)});
  }
  const primary={distance:totalDistance,duration:totalDuration,geometry:{type:'LineString',coordinates:geometry},legs:originalLegs,segmented:true,segmentCount:pieces.length};
  if(alternativeCount>0){
    const candidates=[];
    for(let i=0;i<pieces.length;i++){
      const base=pieces[i].route,line=base.geometry.coordinates;
      // Only substitute genuine provider alternatives for the exact same endpoints.
      for(const options of memo.values())for(const candidate of options.slice(1)){
        const alt=options.includes(base)?candidate:replaceProviderSection(base,options[0],candidate);
        const shape=alt?.geometry?.coordinates;
        if(!shape?.length||hav(line[0],shape[0])>.5||hav(line.at(-1),shape.at(-1))>.5)continue;
        const selected=pieces.map((piece,j)=>({...piece,route:j===i?alt:piece.route}));
        const joined=joinVehicleSections(selected,originalLegs.length);
        if(joined)candidates.push(joined);
      }
    }
    primary.alternativeRoutes=distinctVehicleAlternatives(primary,candidates,Math.min(2,alternativeCount));
  }
  return primary;
}

// Remove city-center excursions introduced solely by distance-limit split points.
// Only a shorter, connected route returned with the same vehicle profile can replace them.
async function bypassArtificialStops(parts,request){
 const stepsOf=route=>(route.legs||[]).flatMap(l=>l.steps||[]).filter(s=>s.distance>0);
 const fromSteps=steps=>{
  if(!steps.length)return null;
  const coordinates=[];for(const step of steps){const line=step.geometry?.coordinates;if(!line?.length)return null;for(const p of line){if(!coordinates.length||hav(coordinates.at(-1),p)>.01)coordinates.push(p);}}
  return {distance:steps.reduce((v,s)=>v+s.distance,0),duration:steps.reduce((v,s)=>v+s.duration,0),geometry:{type:'LineString',coordinates},legs:[{steps}]};
 };
 const result=[...parts];
 for(let i=0;i<result.length-1;i++){
  const left=stepsOf(result[i]),right=stepsOf(result[i+1]);
  if(!left.length||!right.length||[...left,...right].some(s=>!s.geometry?.coordinates?.length))continue;
  let cutL=left.length,cutR=0,dL=0,dR=0;
  while(cutL>0&&dL<130000)dL+=left[--cutL].distance;
  while(cutR<right.length&&dR<130000)dR+=right[cutR++].distance;
  const a=left[cutL].geometry.coordinates[0],b=right[cutR-1].geometry.coordinates.at(-1);
  if(hav(a,b)>400000)continue;
  try{
   const bridge=(await request([a,b]))[0];
   if(!bridge||bridge.distance>=dL+dR-1000||hav(a,bridge.geometry.coordinates[0])>2||hav(b,bridge.geometry.coordinates.at(-1))>2)continue;
   const prefix=fromSteps(left.slice(0,cutL)),suffix=fromSteps(right.slice(cutR));
   // Merge steps/geometry without routing through the arbitrary split city again.
   const mergedSteps=[...(prefix?stepsOf(prefix):[]),...stepsOf(bridge),...(suffix?stepsOf(suffix):[])].map((step,index)=>index>0&&step.maneuver?.type==='depart'?{...step,maneuver:{...step.maneuver,type:'notification'}}:step);
   const lastArrival=(result[i+1].legs||[]).flatMap(l=>l.steps||[]).findLast(s=>s.maneuver?.type==='arrive');if(lastArrival)mergedSteps.push(lastArrival);
   const merged=fromSteps(mergedSteps);
   if(merged){result.splice(i,2,merged);i--;}
  }catch(error){if(error.code==='SegmentBudgetExceeded'||error.name==='AbortError')throw error;/* Keep connected vehicle-routed sections if refinement is unavailable. */}
 }
 return result;
}

// A complete alternative retains each user waypoint and every provider maneuver.
// Reject incompatible snaps instead of drawing a straight connector between roads.
function joinVehicleSections(pieces,legCount){
 const coordinates=[],legs=Array.from({length:legCount},()=>({distance:0,duration:0,steps:[]}));
 for(const {route,leg}of pieces){
  const line=route.geometry?.coordinates;
  if(!line?.length||!Number.isFinite(route.distance)||!Number.isFinite(route.duration)||!legs[leg])return null;
  if(coordinates.length&&hav(coordinates.at(-1),line[0])>.5)return null;
  for(let i=coordinates.length?1:0;i<line.length;i++)coordinates.push(line[i]);
  legs[leg].distance+=route.distance;legs[leg].duration+=route.duration;
  legs[leg].steps.push(...(route.legs||[]).flatMap(l=>l.steps||[]));
 }
 for(const leg of legs){const end=leg.steps.findLastIndex(s=>s.maneuver?.type==='arrive');leg.steps=leg.steps.map((s,i)=>((s.maneuver?.type==='depart'&&i!==0)||(s.maneuver?.type==='arrive'&&i!==end))?{...s,maneuver:{...s.maneuver,type:'notification'}}:s);}
 return {geometry:{type:'LineString',coordinates},legs,distance:legs.reduce((n,l)=>n+l.distance,0),duration:legs.reduce((n,l)=>n+l.duration,0),segmented:true,segmentCount:pieces.length};
}

// Preserve local alternatives returned for a shortcut around an artificial split city.
// Merged steps retain the original provider geometry objects, so replacements are exact.
function replaceProviderSection(base,section,alternative){
 const sectionSteps=(section?.legs||[]).flatMap(l=>l.steps||[]).filter(s=>s.distance>0);
 const steps=(base.legs||[]).flatMap(l=>l.steps||[]);
 if(!sectionSteps.length||sectionSteps.some(s=>!s.geometry?.coordinates?.length))return null;
 const start=steps.findIndex(s=>s.geometry===sectionSteps[0].geometry),end=steps.findLastIndex(s=>s.geometry===sectionSteps.at(-1).geometry);
 if(start<0||end<start)return null;
 const a=section.geometry.coordinates,b=alternative.geometry?.coordinates;if(!b?.length||hav(a[0],b[0])>.5||hav(a.at(-1),b.at(-1))>.5)return null;
 const fromSteps=list=>{const coordinates=[];for(const s of list){if(!s.geometry?.coordinates?.length)return null;for(const p of s.geometry.coordinates){if(!coordinates.length||hav(coordinates.at(-1),p)>.01)coordinates.push(p);}}return list.length?{geometry:{type:'LineString',coordinates},distance:list.reduce((n,s)=>n+(s.distance||0),0),duration:list.reduce((n,s)=>n+(s.duration||0),0),legs:[{steps:list}]}:null;};
 const prefix=fromSteps(steps.slice(0,start)),suffix=fromSteps(steps.slice(end+1));
 if(start>0&&!prefix||end<steps.length-1&&!suffix)return null;
 return joinVehicleSections([prefix,alternative,suffix].filter(Boolean).map(route=>({route,leg:0})),1);
}
function distinctVehicleAlternatives(primary,candidates,count=2){
 const key=p=>p[0].toFixed(5)+','+p[1].toFixed(5);
 const segments=route=>{const line=route.geometry.coordinates,set=new Set();for(let i=1;i<line.length;i++)set.add(key(line[i-1])+'>'+key(line[i]));return set;};
 const novel=(route,known)=>{const line=route.geometry.coordinates;let total=0;for(let i=1;i<line.length;i++)if(!known.has(key(line[i-1])+'>'+key(line[i])))total+=hav(line[i-1],line[i]);return total;};
 const seen=new Set([JSON.stringify(primary.geometry.coordinates)]),remaining=candidates.filter(r=>{const k=JSON.stringify(r.geometry.coordinates);if(seen.has(k))return false;seen.add(k);return true;}),chosen=[],known=[segments(primary)];
 while(remaining.length&&chosen.length<count){remaining.sort((a,b)=>Math.min(...known.map(s=>novel(b,s)))-Math.min(...known.map(s=>novel(a,s)))||a.duration-b.duration);const route=remaining.shift();chosen.push(route);known.push(segments(route));}
 return chosen;
}

// Seek alternatives in the upcoming driving window, then attach only the untouched
// provider-routed suffix. A far-away difference must not stand in for an urban option.
async function requestUpcomingCorridors(base,origin,request,{fromDistance=0,ahead=110000,maxAhead=180000,onDiagnostic=()=>{},roadCandidates=null,refineCandidate=null}={}){
 if(!base||base.distance-fromDistance<maxAhead*1.2)return [];
 let along=0,boundary=null;const legs=base.legs||[],prefix=[];
 for(let leg=0;leg<legs.length;leg++){
  const steps=legs[leg].steps||[],legEnd=along+steps.reduce((n,s)=>n+(s.distance||0),0);
  if(legEnd<=fromDistance){along=legEnd;continue;}
  for(let index=0;index<steps.length;index++){
   const step=steps[index],line=step.geometry?.coordinates,before=along,prefixSize=prefix.length;
   if(line?.length){for(const p of line)prefix.push(p);}
   along+=step.distance||0;
   // Providers may encode hundreds of kilometres as one maneuver. Use an actual
   // shape vertex inside it; remaining time follows the existing per-step profile.
   const target=fromDistance+ahead;
   if(line?.length>2&&target>before&&target<along){
    const distances=[0];for(let j=1;j<line.length;j++)distances.push(distances.at(-1)+hav(line[j-1],line[j]));
    const wanted=(target-before)/(step.distance||1)*distances.at(-1);let cut=1;for(let j=1;j<line.length-1;j++)if(Math.abs(distances[j]-wanted)<Math.abs(distances[cut]-wanted))cut=j;
    const fraction=distances[cut]/(distances.at(-1)||1),cutAt=before+(step.distance||0)*fraction;
    if(cutAt-fromDistance>=Math.min(60000,ahead)&&cutAt-fromDistance<=maxAhead){
     const clipped={...step,distance:step.distance*(1-fraction),duration:step.duration*(1-fraction),geometry:{type:'LineString',coordinates:line.slice(cut)},maneuver:{...step.maneuver,type:'notification',modifier:'straight',location:line[cut]}};delete clipped.exits;
     boundary={leg,index:index+1,point:line[cut],incoming:line.slice(0,cut+1),reference:[...prefix.slice(0,prefixSize),...line.slice(0,cut+1)],tailSteps:[clipped,...steps.slice(index+1)],partial:true};break;
    }
   }
   if(along-fromDistance>=Math.min(60000,ahead)&&along-fromDistance<=maxAhead&&index+1<steps.length&&line?.length>1){boundary={leg,index:index+1,point:line.at(-1),incoming:line,reference:[...prefix]};if(along-fromDistance>=ahead)break;}
  }
  break; // Do not skip an unpassed user waypoint to search the following leg.
 }
 if(!boundary){onDiagnostic({reason:'NoStepBoundary'});return [];}
 const source={geometry:{coordinates:boundary.reference}},local=[...await request([origin,boundary.point],{via:false})];let roads=[];if(roadCandidates){try{roads=(await roadCandidates(origin,boundary.point)).slice(0,2);}catch{roads=[];}for(const road of roads){try{const options=await request([origin,road.coord,boundary.point],{via:true,probe:road.probe?road:null});if(refineCandidate){const actual=options[0]&&refineCandidate(options[0],origin,boundary.point,road.side);if(actual)local.push(...await request([origin,actual.coord,boundary.point],{via:true}));}else local.push(...options);}catch{/* Optional side corridor unavailable; retain other genuine options. */}}}const candidates=[],stats={roadCandidates:roads.map(r=>({ref:r.ref,name:r.name,side:r.side})),received:local.length,endpointRejected:0,directionRejected:0,sharedRejected:0,joinRejected:0};
 const compact=line=>line.filter((p,i)=>i===0||hav(line[i-1],p)>.01);const reference=compact(boundary.reference),baseline=fromDistance<1?local.find(r=>{const line=compact(r.geometry?.coordinates||[]);return Number.isFinite(base.duration)&&base.duration>=r.duration&&base.distance>=r.distance&&line.length===reference.length&&line.every((p,i)=>hav(p,reference[i])<.5);}):null;stats.baselineCalibrated=!!baseline;
 const stepRoute=steps=>{const coordinates=[];for(const step of steps){const line=step.geometry?.coordinates;if(!line?.length)return null;for(const p of line){if(!coordinates.length||hav(coordinates.at(-1),p)>.01)coordinates.push(p);}}return {geometry:{type:'LineString',coordinates},distance:steps.reduce((n,s)=>n+(s.distance||0),0),duration:steps.reduce((n,s)=>n+(s.duration||0),0),legs:[{steps:[...steps]}]};};
 const incoming=line=>{const b=line.at(-1);for(let i=line.length-2;i>=0;i--)if(hav(line[i],b)>5)return [line[i],b];return null;};
 const aligned=(a,b)=>{const x=incoming(a),y=incoming(b);if(!x||!y)return false;const scale=Math.cos(x[1][1]*Math.PI/180),dx=(x[1][0]-x[0][0])*scale,dy=x[1][1]-x[0][1],ex=(y[1][0]-y[0][0])*scale,ey=y[1][1]-y[0][1];return (dx*ex+dy*ey)/(Math.hypot(dx,dy)*Math.hypot(ex,ey)||1)>.5;};
 for(const route of local){
  const line=route.geometry?.coordinates;if(!line?.length||hav(line.at(-1),boundary.point)>.5){stats.endpointRejected++;continue;}if(!aligned(line,boundary.incoming)){stats.directionRejected++;continue;}
  const memory=typeof window!=='undefined'?window.RahyarRouteMemory:null;if(memory&&!memory.different(route,source)){stats.sharedRejected++;continue;}
  const sections=[{route,leg:0}],tail=stepRoute(boundary.tailSteps||legs[boundary.leg].steps.slice(boundary.index));if(!tail)continue;sections.push({route:tail,leg:0});
  let valid=true;for(let i=boundary.leg+1;i<legs.length;i++){const next=stepRoute(legs[i].steps||[]);if(!next){valid=false;break;}sections.push({route:next,leg:i-boundary.leg});}if(!valid)continue;
  if(baseline&&boundary.partial){const expectedDistance=base.distance-baseline.distance,expectedTime=base.duration-baseline.duration,totalDistance=sections.slice(1).reduce((n,p)=>n+p.route.distance,0),totalTime=sections.slice(1).reduce((n,p)=>n+p.route.duration,0),first=tail.legs[0].steps[0],distance=first.distance+expectedDistance-totalDistance,duration=first.duration+expectedTime-totalTime;if(distance>=0&&duration>=0){tail.legs[0].steps[0]={...first,distance,duration};tail.distance+=expectedDistance-totalDistance;tail.duration+=expectedTime-totalTime;}}
  const full=joinVehicleSections(sections,legs.length-boundary.leg);if(full)candidates.push({...full,localCorridor:true,partialStepEstimate:boundary.partial===true&&!baseline});else stats.joinRejected++;
 }
 onDiagnostic(stats);return candidates;
}
