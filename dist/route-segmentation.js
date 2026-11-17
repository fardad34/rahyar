'use strict';
// Public-provider distance limits are handled without substituting car geometry.
// Candidate split points come from the existing city catalog; every traversed
// section, including any snapped join, must be returned by the vehicle router.
async function requestSegmentedVehicleRoute(points,requestSingle,{canadaOnly=false,maxRequests=48,onProgress=()=>{}}={}) {
  const catalog=(await loadCatalog()).filter(c=>['CA','US'].includes(c.country)&&(!canadaOnly||c.country==='CA'));
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
    try{const routes=await request([a,b]);if(routes.length)return [routes[0]];throw Object.assign(new Error('No vehicle route for a section'),{code:'SegmentNoRoute'});}
    catch(error){
      if(!['DistanceExceeded','SegmentNoRoute','CanadaOnlyRouteUnavailable'].includes(error.code)&&error.errorCode!==154)throw error;
      if(depth>=9)throw error;
      for(const middle of candidates(a,b)){
        try{return [...await split(a,middle,depth+1),...await split(middle,b,depth+1)];}
        catch(next){if(!['DistanceExceeded','SegmentNoRoute','CanadaOnlyRouteUnavailable','DisconnectedSegments'].includes(next.code)&&next.errorCode!==154)throw next;}
      }
      throw Object.assign(new Error('No connected vehicle-aware corridor was found within the service limit'),{code:'SegmentNoRoute'});
    }
  }
  const pieces=[];const geometry=[];const originalLegs=[];let totalDistance=0,totalDuration=0;
  async function append(route,steps){
    const line=route.geometry?.coordinates;
    if(!line?.length||!Number.isFinite(route.distance)||!Number.isFinite(route.duration))throw Object.assign(new Error('Invalid routed segment'),{code:'DisconnectedSegments'});
    if(geometry.length&&hav(geometry.at(-1),line[0])>.5){
      const connectors=await request([geometry.at(-1),line[0]]);const connector=connectors[0];
      if(!connector||hav(geometry.at(-1),connector.geometry.coordinates[0])>.5||hav(connector.geometry.coordinates.at(-1),line[0])>.5)throw Object.assign(new Error('Provider sections do not join on the same road'),{code:'DisconnectedSegments'});
      await append(connector,steps);
    }
    geometry.push(...(geometry.length?line.slice(1):line));totalDistance+=route.distance;totalDuration+=route.duration;pieces.push(route);
    steps.push(...(route.legs||[]).flatMap(l=>l.steps||[]));
  }
  for(let i=1;i<points.length;i++){
    const parts=await split(points[i-1],points[i]);const steps=[];const beforeDistance=totalDistance,beforeDuration=totalDuration;
    for(const part of parts)await append(part,steps);
    // Intermediate split arrivals/departures are not destinations. Keep only
    // the first departure and last arrival for each originally requested leg.
    const lastArrival=steps.findLastIndex(s=>s.maneuver?.type==='arrive');
    originalLegs.push({distance:totalDistance-beforeDistance,duration:totalDuration-beforeDuration,steps:steps.map((step,index)=>((step.maneuver?.type==='arrive'&&index!==lastArrival)||(step.maneuver?.type==='depart'&&index!==0))?{...step,maneuver:{...step.maneuver,type:'notification'}}:step)});
  }
  return {distance:totalDistance,duration:totalDuration,geometry:{type:'LineString',coordinates:geometry},legs:originalLegs,segmented:true,segmentCount:pieces.length};
}
