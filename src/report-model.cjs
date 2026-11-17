'use strict';
const CATEGORIES = ['police','closed','construction','weigh'];
function stationKey(station) {
  return JSON.stringify([station.country || '',station.sourceType || '',station.sourceId || '',station.osmType || '',station.osmId || '',station.coord]);
}
function headingMatches(a,b,tolerance=60) {
  // Missing heading cannot verify a directional observation.
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(((a-b+540)%360)-180)<=tolerance;
}
function activeReports(rows,now=Date.now()) {
  return rows.filter(r=>r.moderation==='visible' && Date.parse(r.expires_at)>now && Date.parse(r.observed_at)<=now+30000);
}
function stationStatus(rows,key,heading,now=Date.now()) {
  const observations=activeReports(rows,now).filter(r=>r.category==='weigh' && r.station_key===key &&
    now-Date.parse(r.observed_at)<20*60000 && headingMatches(r.heading,heading));
  const drivers=new Map();
  for(const r of observations.sort((a,b)=>Date.parse(b.observed_at)-Date.parse(a.observed_at))) if(!drivers.has(r.user_id))drivers.set(r.user_id,r);
  const latest=[...drivers.values()];
  const credible=latest.length>=2 && latest.every(r=>r.status===latest[0].status);
  return {status:credible?latest[0].status:'unknown',source:credible?'Corroborated driver observations':'Unverified driver observation',count:latest.length,latest:latest[0]||null};
}
function pruneQueue(queue,owner,now=Date.now()) {
  return queue.filter(r=>r.owner===owner && now-Date.parse(r.payload.observed_at)<20*60000 && Date.parse(r.payload.observed_at)<=now+30000);
}
function relevantReport(report,{position,heading,project,progress=0,explore=false,distance,bounds}) {
  const coord=[report.longitude,report.latitude];
  if(!explore && project){const p=project(coord);return p.off<=200 && p.along>=progress-200 && (!Number.isFinite(report.heading)||headingMatches(report.heading,heading));}
  if(explore && bounds)return report.latitude>=bounds.south&&report.latitude<=bounds.north&&report.longitude>=bounds.west&&report.longitude<=bounds.east;
  return !position || distance(position,coord)<=100000;
}
module.exports={CATEGORIES,stationKey,headingMatches,activeReports,stationStatus,pruneQueue,relevantReport};
