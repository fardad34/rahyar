if(process.env.RAHYAR_LIVE_ROUTE_TEST!=='1'){console.log('Set RAHYAR_LIVE_ROUTE_TEST=1 to make real public routing requests.');process.exit(0);}
const fs=require('fs'),vm=require('vm');const root=process.cwd()+'/';let calls=0;
const c={Intl,window:{},console,location:{hostname:'rahyar-staging'},fetch,setTimeout,clearTimeout,AbortController};vm.createContext(c);
vm.runInContext(fs.readFileSync(root+'dist/app.js','utf8').split('function loadCatalog(){')[0],c);
vm.runInContext(fs.readFileSync(root+'dist/road-context.js','utf8'),c);
vm.runInContext(fs.readFileSync(root+'dist/route-segmentation.js','utf8'),c);
vm.runInContext(fs.readFileSync(root+'dist/truck-routing.js','utf8'),c);
c.regions=[...JSON.parse(fs.readFileSync(root+'dist/regions-na.json')).regions];vm.runInContext('regionFeatures=regions',c);
const catalog=JSON.parse(fs.readFileSync(root+'dist/cities-na.json')).cities.map(r=>({coord:[r[2],r[3]],country:r[4],name:r[1]}));c.loadCatalog=async()=>catalog;c.message=()=>{};
c.getJSON=async(url,options,timeout=30000)=>{calls++;const r=await fetch(url,{...options,signal:AbortSignal.timeout(timeout)});const data=await r.json();if(!r.ok)throw Object.assign(Error(data.message||'Routing service error'),{status:r.status,code:data.code,errorCode:data.error_code});return data;};
vm.runInContext("activeRouteVehicle='truck';activeTruckProfile={height:4.15,width:2.6,length:23,weight:39.5,axle_load:9,axle_count:5,hazmat:false}",c);
(async()=>{const result=await c.requestRoadRoutes([[-79.3832,43.6532],[-97.138,49.895]],0,30000,null,true);console.log('LIVE RESULT',JSON.stringify(result.map(r=>({distance:r.distance,duration:r.duration,segments:r.segmentCount,points:r.geometry.coordinates.length,legs:r.legs.length}))), 'requests',calls);const assert=require('node:assert/strict');const route=result[0];assert(route.segmentCount>1);assert(route.distance>2000000);assert.equal(route.legs.length,1);assert(Math.abs(route.legs.flatMap(l=>l.steps).reduce((n,s)=>n+s.distance,0)-route.distance)<2);assert(Math.abs(route.legs.flatMap(l=>l.steps).reduce((n,s)=>n+s.duration,0)-route.duration)<2);})().catch(e=>{console.log('LIVE ROUTE FAILURE',e.code||e.name,e.message,'requests',calls);process.exitCode=1});
