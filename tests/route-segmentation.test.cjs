const {test}=require('node:test');const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function ctx(){const c={loadCatalog:async()=>[{country:'CA',coord:[1,0]},{country:'CA',coord:[3,0]}],hav:(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])*100000};vm.createContext(c);vm.runInContext(fs.readFileSync('dist/route-segmentation.js','utf8'),c);return c;}
function route(a,b){return {distance:100000,duration:3600,geometry:{coordinates:[a,b]},legs:[{steps:[{distance:100000,duration:3600,maneuver:{type:'depart'}},{distance:0,duration:0,maneuver:{type:'arrive'}}]}]};}
test('segmentation returns one continuous vehicle-routed shape with original waypoint legs',async()=>{
 const c=ctx();let calls=0;const result=await c.requestSegmentedVehicleRoute([[0,0],[2,0],[4,0]],async([a,b])=>{calls++;if(b[0]-a[0]>1)throw Object.assign(Error('limit'),{code:'DistanceExceeded'});return [route(a,b)];});
 assert.equal(result.segmentCount,4);assert.equal(result.distance,400000);assert.equal(result.duration,14400);assert.equal(result.legs.length,2);assert.deepEqual(JSON.parse(JSON.stringify(result.geometry.coordinates)),[[0,0],[1,0],[2,0],[3,0],[4,0]]);assert(calls<=6);assert.equal(result.legs.flatMap(l=>l.steps).reduce((n,s)=>n+s.distance,0),result.distance);assert.equal(result.legs.flatMap(l=>l.steps).reduce((n,s)=>n+s.duration,0),result.duration);
});
test('segment budget and disconnected joins fail explicitly rather than drawing unverified gaps',async()=>{
 const c=ctx();await assert.rejects(c.requestSegmentedVehicleRoute([[0,0],[4,0]],async()=>{throw Object.assign(Error('limit'),{code:'DistanceExceeded'});},{maxRequests:1}),e=>e.code==='SegmentBudgetExceeded');
 let n=0;await assert.rejects(c.requestSegmentedVehicleRoute([[0,0],[1,0],[2,0]],async([a,b])=>{n++;if(n===2)return [route([1.5,0],b)];if(n>2)return [];return [route(a,b)];}),e=>e.code==='DisconnectedSegments');
});
test('long sections split before hitting the public provider limit and preserve the vehicle router',async()=>{const c=ctx();let calls=0;const result=await c.requestSegmentedVehicleRoute([[0,0],[4,0]],async([a,b])=>{calls++;assert(Math.abs(b[0]-a[0])<=3);return [route(a,b)];},{maxSectionMeters:300000});assert.equal(calls,2);assert.equal(result.segmentCount,2);assert.equal(result.legs.length,1);});
test('a timed-out long section is split into shorter routed legs instead of aborting the journey',async()=>{const c=ctx();let calls=0;const r=await c.requestSegmentedVehicleRoute([[0,0],[4,0]],async([a,b])=>{calls++;if(b[0]-a[0]>3)throw Object.assign(Error('timeout'),{name:'TimeoutError'});return [route(a,b)];},{maxSectionMeters:Infinity});assert.equal(calls,3);assert.equal(r.segmentCount,2);});
test('artificial split-city excursion is removed only by a shorter real vehicle route',async()=>{
 const c=ctx();const step=(a,b,d)=>({distance:d,duration:d/20,maneuver:{type:'turn'},geometry:{coordinates:[a,b]}});
 const a={distance:200000,duration:10000,legs:[{steps:[step([0,0],[1,0],50000),step([1,0],[1,1],150000)]}],geometry:{coordinates:[[0,0],[1,0],[1,1]]}};
 const b={distance:200000,duration:10000,legs:[{steps:[step([1,1],[2,0],150000),step([2,0],[3,0],50000)]}],geometry:{coordinates:[[1,1],[2,0],[3,0]]}};
 const result=await c.bypassArtificialStops([a,b],async([x,y])=>[{distance:100000,duration:5000,legs:[{steps:[step(x,y,100000)]}],geometry:{coordinates:[x,y]}}]);assert.equal(result.length,1);assert.equal(result[0].distance,200000);assert(!result[0].geometry.coordinates.some(p=>p[1]===1));
 const retained=await c.bypassArtificialStops([a,b],async()=>{throw Error('provider down')});assert.equal(retained.length,2);
});
test('long journeys retain real section alternatives with all original waypoint legs',async()=>{
 const c=ctx();let calls=0;
 const result=await c.requestSegmentedVehicleRoute([[0,0],[2,0],[4,0]],async([a,b])=>{
  calls++;if(b[0]-a[0]>1)throw Object.assign(Error('limit'),{code:'DistanceExceeded'});
  const primary=route(a,b),alternate=route(a,b);alternate.distance=120000;alternate.duration=4000;
  alternate.geometry.coordinates=[a,[(a[0]+b[0])/2,.2],b];alternate.legs[0].steps[0].distance=120000;alternate.legs[0].steps[0].duration=4000;
  return [primary,alternate];
 },{alternativeCount:2});
 assert.equal(result.alternativeRoutes.length,2);assert(calls<=6,'retaining alternatives must not add network requests');
 for(const alt of result.alternativeRoutes){assert.equal(alt.legs.length,2);assert.equal(alt.distance,420000);assert.equal(alt.duration,14800);assert(alt.geometry.coordinates.some(p=>p[0]===2&&p[1]===0));assert(alt.geometry.coordinates.some(p=>p[1]===.2));assert.equal(alt.legs.flatMap(l=>l.steps).reduce((n,s)=>n+s.distance,0),alt.distance);}
});
test('single provider option never produces invented alternatives and disconnected alternate snaps are rejected',async()=>{
 const c=ctx();const result=await c.requestSegmentedVehicleRoute([[0,0],[1,0],[2,0]],async([a,b])=>[route(a,b)],{alternativeCount:2});assert.equal(result.alternativeRoutes.length,0);
 const invalid=await c.requestSegmentedVehicleRoute([[0,0],[1,0]],async([a,b])=>[route(a,b),route([.1,0],b)],{alternativeCount:2});assert.equal(invalid.alternativeRoutes.length,0);
});
test('public routing entry requests truck alternatives for every user-waypoint leg',async()=>{
 const c=ctx(),requests=[];c.location={hostname:'rahyar.test'};c.regionAt=()=>({country:'CA'});
 c.getJSON=async url=>{const r=JSON.parse(new URL(url).searchParams.get('json'));requests.push(r);const [a,b]=r.locations.map(p=>[p.lon,p.lat]);const second=route(a,b);second.geometry.coordinates=[a,[(a[0]+b[0])/2,.1],b];return {code:'Ok',routes:[route(a,b),second]};};
 vm.runInContext(fs.readFileSync('dist/truck-routing.js','utf8'),c);
 vm.runInContext('activeTruckProfile={height:4.15,width:2.6,length:23,weight:39.5,axle_load:9,axle_count:5}',c);
 const routes=await c.requestRoadRoutes([[0,0],[1,0],[2,0]],2,undefined,undefined,true);
 assert.equal(routes.length,3);assert.equal(requests.length,2);
 for(const r of requests){assert.equal(r.alternates,2);assert.equal(r.costing,'truck');assert.equal(r.costing_options.truck.height,4.15);assert.equal(r.costing_options.truck.weight,39.5);}
 for(const r of routes)assert.equal(r.legs.length,2);
});
test('city-bypass bridge alternatives survive merging back into a long route',async()=>{
 const c=ctx();c.loadCatalog=async()=>[{coord:[1,1],country:'CA'}];const step=(a,b,d)=>({distance:d,duration:d/20,maneuver:{type:'turn'},geometry:{coordinates:[a,b]}});const make=steps=>({distance:steps.reduce((n,s)=>n+s.distance,0),duration:steps.reduce((n,s)=>n+s.duration,0),geometry:{coordinates:steps.flatMap(s=>s.geometry.coordinates)},legs:[{steps}]});
 const a=make([step([0,0],[1,0],50000),step([1,0],[1,1],150000)]),b=make([step([1,1],[2,0],150000),step([2,0],[3,0],50000)]),bridge=make([step([1,0],[2,0],100000)]),option=make([step([1,0],[1.5,.5],65000),step([1.5,.5],[2,0],65000)]);
 let calls=0;const result=await c.requestSegmentedVehicleRoute([[0,0],[3,0]],async([x,y])=>{calls++;if(x[0]===0&&y[0]===3)throw Object.assign(Error('limit'),{code:'DistanceExceeded'});if(y[1]===1)return[a];if(x[1]===1)return[b];return [bridge,option];},{alternativeCount:2});
 assert.equal(calls,4);assert.equal(result.distance,200000);assert.equal(result.alternativeRoutes.length,1);assert.equal(result.alternativeRoutes[0].distance,230000);assert(result.alternativeRoutes[0].geometry.coordinates.some(p=>p[1]===.5));assert(!result.alternativeRoutes[0].geometry.coordinates.some(p=>p[1]===1));
});
test('bounded corridor discovery retains truck dimensions and user exclusions; optional failure never removes the valid route',async()=>{
 const c=ctx();vm.runInContext(fs.readFileSync('dist/truck-routing.js','utf8'),c);const base=route([0,0],[4,0]);base.geometry.coordinates=[[0,0],[1,0],[2,0],[3,0],[4,0]];const north=route([0,0],[4,0]);north.geometry.coordinates=[[0,0],[1,1],[2,1],[3,1],[4,0]];const south=route([0,0],[4,0]);south.geometry.coordinates=[[0,0],[1,-1],[2,-1],[3,-1],[4,0]];
 const request={costing:'truck',costing_options:{truck:{height:4.15,weight:39.5}},exclude_locations:[{lon:-1,lat:-1}],alternates:2},calls=[];
 const result=await c.diversifyVehicleRoutes(request,[base],async body=>{calls.push(body);return {code:'Ok',routes:[calls.length===1?north:south]};});assert.equal(result.length,3);assert.equal(calls.length,2);for(const call of calls){assert.equal(call.costing_options.truck.height,4.15);assert.equal(call.costing_options.truck.weight,39.5);assert.deepEqual(call.exclude_locations[0],{lon:-1,lat:-1});assert(call.exclude_locations.length<=12);}assert.equal(request.exclude_locations.length,1);
 let deniedCalls=0;const denied=await c.diversifyVehicleRoutes(request,[base],async()=>{deniedCalls++;return {code:'Ok',routes:[north]};},()=>false);assert.equal(deniedCalls,0);assert.equal(denied.length,1);
 const failed=await c.diversifyVehicleRoutes(request,[base],async()=>{throw Error('offline');});assert.equal(failed.length,1);
});
test('long-route optional discovery shares the request budget and has at most four extra calls',async()=>{const c=ctx();let extras=0;const progress=[];await c.requestSegmentedVehicleRoute([[0,0],[1,0]],async([a,b],reserve)=>{while(reserve())extras++;return[route(a,b)];},{onProgress:n=>progress.push(n)});assert.equal(extras,4);assert.equal(progress.at(-1),5);assert(progress.at(-1)<=48);});
