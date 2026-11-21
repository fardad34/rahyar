'use strict';
// Public-provider distance limits are handled without substituting car geometry.
// Candidate split points come from the existing city catalog; every traversed
// section, including any snapped join, must be returned by the vehicle router.
async function requestSegmentedVehicleRoute(points,requestSingle,{canadaOnly=false,maxRequests=48,maxSectionMeters=400000,alternativeCount=0,onProgress=()=>{}}={}) {
  const originCountry=typeof regionAt==='function'?regionAt(points[0])?.country:null;
  const northAmerica=originCountry?['CA','US'].includes(originCountry):null;
  const catalog=(await loadCatalog()).filter(c=>(!canadaOnly||c.country==='CA')&&(northAmerica===null||['CA','US'].includes(c.country)===northAmerica));
  let requests=0;const memo=new Map();
  const request=async pair=>{
    const key=JSON.stringify(pair);if(memo.has(key))return memo.get(key);
    if(++requests>maxRequests)throw Object.assign(new Error('Segment request budget exceeded'),{code:'SegmentBudgetExceeded'});
    onProgress(requests);
    const result=await requestSingle(pair);memo.set(key,result);return result;
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
    originalLeg=i-1;let parts=await split(points[i-1],points[i]);parts=await bypassArtificialStops(parts,request);const steps=[];const beforeDistance=totalDistance,beforeDuration=totalDuration;
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
      for(const options of memo.values())if(options.includes(base))for(const alt of options.slice(1)){
        const shape=alt.geometry?.coordinates;
        if(!shape?.length||hav(line[0],shape[0])>.5||hav(line.at(-1),shape.at(-1))>.5)continue;
        const selected=pieces.map((piece,j)=>({...piece,route:j===i?alt:piece.route}));
        const joined=joinVehicleSections(selected,originalLegs.length);
        if(joined)candidates.push(joined);
      }
    }
    const seen=new Set([JSON.stringify(primary.geometry.coordinates)]);
    primary.alternativeRoutes=candidates.sort((a,b)=>a.duration-b.duration).filter(r=>{const key=JSON.stringify(r.geometry.coordinates);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,Math.min(2,alternativeCount));
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
