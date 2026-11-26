'use strict';
// Genuine Valhalla responses, no synthetic production routes or database writes.
const {chromium}=require('@playwright/test'),assert=require('node:assert/strict');
(async()=>{
 const proxy=process.env.HTTPS_PROXY||process.env.https_proxy;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox'],proxy:proxy?{server:new URL(proxy).origin,bypass:'localhost,127.0.0.1'}:undefined});
 const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1180,height:820}}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).pathname==='/api/route')requests.push(r.postDataJSON());});
 try{
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:3049');await page.locator('#notice-agree').check();await page.locator('#notice-confirm').click();await page.waitForSelector('#nav-shell');
  const cases=[['Calgary crossings',[[-114.65,51.08],[-113.4,51.03]]],['Vancouver Winnipeg',[[-123.116,49.246],[-97.1384,49.8951]]],['Golden to Medicine Hat',[[-116.97,51.30],[-110.68,50.04]]],['Calgary via point',[[-114.31,51.085],[-113.85,51.04],[-110.68,50.04]]],['Vancouver long journey',[[-123.116,49.246],[-110.68,50.04]]]];
  for(const [label,points]of cases.filter(c=>!process.env.ROUTE_CASE||c[0]===process.env.ROUTE_CASE)){
   const start=requests.length;
   const result=await page.evaluate(async points=>{
    await loadRegions();activeRouteVehicle='truck';activeTruckProfile={height:4.15,width:2.6,length:23,weight:39.5,axle_load:9,axle_count:5,hazmat:false};
    const routes=await requestRoadRoutes(points,2,undefined,undefined,true);
    return routes.map(r=>({distance:r.distance,duration:r.duration,legs:r.legs.length,segmented:r.segmented,line:r.geometry.coordinates,foreign:routeEntersUnitedStates(r),urbanRoads:[...new Set(r.legs.flatMap(l=>l.steps||[]).filter(s=>/Stoney|22X|201|16 Avenue/i.test((s.name||'')+' '+(s.ref||''))).map(s=>(s.ref||'')+' '+(s.name||'')))]}));
   },points);
   assert(result.length>=1&&result.length<=3);assert(requests.length-start<=48);
   for(const r of result){assert(r.distance>0&&r.duration>0);assert.equal(r.legs,points.length-1);if(label==='Vancouver long journey')assert.equal(r.segmented,true);assert(r.line.length>10);assert.equal(r.foreign,false);}
   for(const r of requests.slice(start)){assert.equal(r.costing,'truck');assert.equal(r.costing_options.truck.height,4.15);assert.equal(r.alternates,2);}
   if(label==='Calgary crossings')console.log('Crossing diagnostic:',JSON.stringify(result.map(r=>({km:r.distance/1000,minutes:r.duration/60,centralMeridian:r.line.flatMap((p,i)=>{const a=r.line[i-1];return a&&(a[0]+114.07)*(p[0]+114.07)<=0&&a[0]!==p[0]?[a[1]+(-114.07-a[0])/(p[0]-a[0])*(p[1]-a[1])]:[];})}))));
   if(label==='Vancouver Winnipeg'||label==='Calgary crossings')console.log('Calgary-area road references by option:',JSON.stringify(result.map(r=>r.urbanRoads)));
   assert.equal(new Set(result.map(r=>JSON.stringify(r.line))).size,result.length);
   console.log('PASS '+label+': '+result.length+' genuine distinct truck routes, '+(requests.length-start)+' requests, original waypoint legs and dimensions retained');
  }
  assert.deepEqual(errors,[]);console.log('PASS no browser page errors; no guarantee of three alternatives when provider returns fewer');
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e.stack?.slice(0,1800)||e.message);process.exitCode=1;});
