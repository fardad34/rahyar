'use strict';
// Real Supabase data and WebSockets; GPS is emulated, not a physical road test.
const {chromium}=require('@playwright/test'),fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 const users=JSON.parse(fs.readFileSync(process.env.RAHYAR_TEST_USERS_FILE));
 const stations=JSON.parse(fs.readFileSync('dist/facility-catalog.json')).facilities.filter(s=>s.authority==='government'&&s.country==='CA');
 const raw=stations.find(s=>s.name==='Wasi South Truck Inspection Station');assert(raw);const station={...raw,osmType:raw.sourceType||'bts',osmId:raw.sourceId};
 const proxyUrl=process.env.HTTPS_PROXY||process.env.https_proxy;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox'],proxy:proxyUrl?{server:new URL(proxyUrl).origin,bypass:'127.0.0.1,localhost'}:undefined});
 const contexts=[],pages=[],errors=[];
 try{
  for(let i=0;i<2;i++){
   const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:i?{width:390,height:844}:{width:1024,height:768},permissions:['geolocation'],geolocation:{latitude:station.coord[1],longitude:station.coord[0],accuracy:5}});contexts.push(context);
   const page=await context.newPage();pages.push(page);page.on('pageerror',e=>errors.push(e.message));
   await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000',{waitUntil:'domcontentloaded'});
   await page.locator('#notice-agree').check();await page.locator('#notice-confirm').click();
   await page.waitForFunction(()=>window.RahyarCloud?.client());
   await page.locator('#cloud-panel summary').click();await page.locator('#cloud-email').fill(users[i].email);await page.locator('#cloud-password').fill(users[i].password);await page.locator('#cloud-auth button[value=signin]').click();await page.waitForFunction(()=>!!window.RahyarCloud?.user);
   await page.waitForFunction(()=>lastPos&&gpsTime);
   await page.evaluate(async()=>{window.weighEvents=[];await new Promise((resolve,reject)=>{window.RahyarCloud.client().channel('weigh-verification').on('postgres_changes',{event:'INSERT',schema:'public',table:'rahyar_road_reports'},payload=>window.weighEvents.push(payload.new)).subscribe(status=>{if(status==='SUBSCRIBED')resolve();if(status==='CHANNEL_ERROR')reject(Error('Realtime channel failed'));});setTimeout(()=>reject(Error('Realtime subscription timed out')),20000);});});
  }
  const submit=async(page,status)=>page.evaluate(async({station,status})=>window.RahyarCloud.submit({category:'weigh',station_key:window.RahyarCloud.stationKey(station),status,latitude:station.coord[1],longitude:station.coord[0],accuracy_m:5,heading:180}),{station,status});
  const state=async(page)=>page.evaluate(station=>window.RahyarCloud.stationStatus(station,180),station);
  const waitStatus=async(page,status)=>page.waitForFunction(({station,status})=>window.RahyarCloud.stationStatus(station,180).status===status,{station,status},{timeout:20000});
  await submit(pages[0],'open');await pages[1].waitForFunction(()=>window.weighEvents.some(r=>r.category==='weigh'),{timeout:20000});
  await pages[1].waitForFunction(station=>window.RahyarCloud.stationStatus(station,180).count>=1,station);
  assert.equal((await state(pages[1])).status,'unknown');console.log('PASS browser B receives browser A weigh observation via real WebSocket; one driver remains Unknown');
  await submit(pages[1],'open');await waitStatus(pages[0],'open');await waitStatus(pages[1],'open');assert.equal((await state(pages[0])).count,2);console.log('PASS two independent signed-in browsers corroborate Open with timestamps and driver provenance');
  await submit(pages[1],'closed');await waitStatus(pages[0],'unknown');await waitStatus(pages[1],'unknown');console.log('PASS conflicting latest observations return both browsers to Unknown');
  await submit(pages[0],'closed');await waitStatus(pages[0],'closed');await waitStatus(pages[1],'closed');console.log('PASS two independent latest Closed observations synchronize to both browsers');
  assert.equal(await pages[0].evaluate(station=>window.RahyarCloud.stationStatus(station,0).status,station),'unknown');
  const result=await state(pages[1]);assert.equal(result.latest.source,'driver');assert(Number.isFinite(Date.parse(result.latest.observed_at)));assert(Number.isFinite(Date.parse(result.latest.expires_at)));assert.deepEqual(errors,[]);console.log('PASS opposite direction is Unknown; capture/expiry/source metadata present; no page errors');
 }finally{
  for(const page of pages)try{await page.evaluate(()=>window.RahyarCloud?.client()?.auth.signOut());}catch{}
  await Promise.all(contexts.map(c=>c.close()));await browser.close();
 }
})().catch(error=>{console.error('Weigh browser verification failed:',error.message.slice(0,1600));process.exitCode=1;});
