const {test}=require('node:test');const assert=require('node:assert/strict');const m=require('../src/report-model.cjs');
const now=Date.now(), row=(user,status='open',extra={})=>({user_id:user,category:'weigh',station_key:'station',status,heading:90,moderation:'visible',observed_at:new Date(now-1000).toISOString(),expires_at:new Date(now+60000).toISOString(),...extra});
test('station status requires two independent fresh same-direction drivers; disagreements stay Unknown',()=>{
 assert.equal(m.stationStatus([],'station',90,now).status,'unknown');
 assert.equal(m.stationStatus([row('a')],'station',90,now).status,'unknown');
 assert.equal(m.stationStatus([row('a'),row('a')],'station',90,now).status,'unknown');
 assert.equal(m.stationStatus([row('a'),row('b')],'station',90,now).status,'open');
 assert.equal(m.stationStatus([row('a'),row('b','closed')],'station',90,now).status,'unknown');
 assert.equal(m.stationStatus([row('a'),row('b')],'station',270,now).status,'unknown');
 assert.equal(m.stationStatus([row('a'),row('b')],'station',null,now).status,'unknown');
});
test('expiry and moderation exclude evidence even before the next network request',()=>{
 assert.equal(m.activeReports([row('a','open',{expires_at:new Date(now-1).toISOString()}),row('b','open',{moderation:'hidden'})],now).length,0);
});
test('offline queue never submits another account records or stale observations',()=>{
 const payload={observed_at:new Date(now).toISOString()};assert.deepEqual(m.pruneQueue([{owner:'a',payload},{owner:'b',payload},{owner:'a',payload:{observed_at:new Date(now-21*60000).toISOString()}}],'a',now),[{owner:'a',payload}]);
});
test('route reports filter opposite direction, parallel roads and passed locations',()=>{
 const r={longitude:-79,latitude:44,heading:270};const context={heading:90,project:()=>({off:10,along:2000}),progress:1000};
 assert.equal(m.relevantReport(r,context),false);r.heading=90;assert.equal(m.relevantReport(r,context),true);
 assert.equal(m.relevantReport(r,{...context,project:()=>({off:500,along:2000})}),false);
 assert.equal(m.relevantReport(r,{...context,project:()=>({off:10,along:100})}),false);
});
test('Explore mode follows the viewed map rather than hiding distant viewed reports',()=>{
 assert.equal(m.relevantReport({latitude:50,longitude:-120},{explore:true,bounds:{south:49,north:51,west:-121,east:-119},position:[-79,44],distance:()=>3000000}),true);
});
test('route-projected aliases retain each registered government station key',()=>{
 const fs=require('node:fs');const stations=JSON.parse(fs.readFileSync('dist/facility-catalog.json')).facilities.filter(s=>s.authority==='government');
 for(const station of stations){const projected={...station,osmType:station.sourceType||'bts',osmId:station.sourceId,at:1000,off:50};assert.equal(m.stationKey(projected),m.stationKey(station),station.name);}
});
