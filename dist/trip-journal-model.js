'use strict';
(function(root){
 const validPoint=p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
 function meters(a,b){const r=Math.PI/180,dy=(b[1]-a[1])*r,dx=(b[0]-a[0])*r,h=Math.sin(dy/2)**2+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dx/2)**2;return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
 function appendFix(trip,fix){
  if(!validPoint(fix.coord)||!Number.isFinite(fix.accuracy)||fix.accuracy>50||!Number.isFinite(fix.time))return false;
  const previous=trip.trace.at(-1);if(previous){const dt=(fix.time-previous.time)/1000,d=meters(previous.coord,fix.coord);if(dt<=0||d/dt>60||dt<5||d<Math.max(8,Math.min(20,fix.accuracy)))return false;if(dt<=60)trip.actualMeters+=d;else fix.gap=true;}
  trip.trace.push({coord:[...fix.coord],time:fix.time,accuracy:fix.accuracy,gap:fix.gap===true});return true;
 }
 function shareSnapshot(trip){return {version:1,partialStart:trip.partialStart===true,appCommit:trip.appCommit||'unknown',id:trip.id,startedAt:trip.startedAt,endedAt:trip.endedAt,status:trip.status,origin:trip.origin,destination:trip.destination,vehicle:trip.vehicle,profile:trip.profile,plannedMeters:trip.plannedMeters,actualMeters:trip.actualMeters,planned:trip.planned,trace:trip.trace.map(p=>({coord:p.coord,time:p.time,gap:p.gap===true})),routeChanges:trip.routeChanges||[],legality:'Unverified: restrictions and closures must be rechecked before reuse.'};}
 function stable(value){return Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;}
 function reusable(trip,origin,destination,vehicle,profile){return !trip.partialStart&&trip.status==='completed'&&trip.vehicle===vehicle&&JSON.stringify(stable(trip.profile||null))===JSON.stringify(stable(profile||null))&&validPoint(trip.origin?.coord)&&validPoint(trip.destination?.coord)&&meters(origin,trip.origin.coord)<3000&&meters(destination,trip.destination.coord)<1000&&trip.trace.length>=2&&!trip.trace.some(p=>p.gap)&&meters(trip.trace[0].coord,origin)<3000&&meters(trip.trace.at(-1).coord,destination)<1000;}
 function validReport(t){return !!t&&t.version===1&&typeof t.id==='string'&&['active','completed','cancelled'].includes(t.status)&&validPoint(t.origin?.coord)&&validPoint(t.destination?.coord)&&Array.isArray(t.planned)&&t.planned.every(validPoint)&&Array.isArray(t.trace)&&t.trace.every(p=>validPoint(p.coord)&&Number.isFinite(p.time))&&Number.isFinite(t.plannedMeters)&&t.plannedMeters>=0&&Number.isFinite(t.actualMeters)&&t.actualMeters>=0;}
 const consentKey=userId=>'rahyar.journal.sync.'+(userId||'guest');
 const api={consentKey,validReport,validPoint,meters,appendFix,shareSnapshot,reusable};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RahyarTripModel=api;
})(typeof window!=='undefined'?window:globalThis);
