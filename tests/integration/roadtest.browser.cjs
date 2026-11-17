'use strict';
// Opt-in real provider checks. Emulated GPS and Chromium do not prove road legality or Safari behavior.
const {chromium}=require('@playwright/test'),assert=require('node:assert/strict');
const cases=[
 {country:'CA',start:[-79.3832,43.6532],query:'Hamilton Canada',match:/Hamilton, Ontario, Canada/},
 {country:'US',start:[-78.8784,42.8864],query:'Rochester',match:/Rochester, NY, United States/},
 {country:'GB',start:[-.1276,51.5072],query:'Cambridge United Kingdom',match:/Cambridge.*United Kingdom/},
 {country:'DE',start:[13.405,52.52],query:'Potsdam Germany',match:/Potsdam.*Germany/},
];
(async()=>{
 const proxy=process.env.HTTPS_PROXY||process.env.https_proxy;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox'],proxy:proxy?{server:new URL(proxy).origin,bypass:'localhost,127.0.0.1'}:undefined});
 const open=async options=>{const context=await browser.newContext({ignoreHTTPSErrors:process.env.BASE_URL?.startsWith('https:')?false:true,viewport:{width:768,height:1024},hasTouch:true,...options});const page=await context.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000',{waitUntil:'domcontentloaded'});await page.locator('#notice-agree').check();await page.locator('#notice-confirm').click();await page.waitForSelector('.vehicle-cards');return {context,page};};
 try{
  for(const testCase of cases)for(const vehicle of ['auto','truck']){
   const {context,page}=await open({permissions:['geolocation'],geolocation:{latitude:testCase.start[1],longitude:testCase.start[0],accuracy:5}}),errors=[],requests=[];
   page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().startsWith('https://valhalla1.openstreetmap.de/route?'))requests.push(JSON.parse(new URL(request.url()).searchParams.get('json')));});
   try{
    await page.locator('.vehicle-card[data-vehicle='+vehicle+']').click();
    if(vehicle==='truck'){
     for(const [name,value]of Object.entries({height:4,width:2.55,length:16.5,weight:32,axle_load:8,axle_count:5}))await page.locator('#truck-'+name).fill(String(value));
     await page.locator('#truck-save').click();await page.locator('#close-settings').click();
    }
    await page.locator('#query').fill(testCase.query);await page.locator('#search').click();const result=page.locator('#results button').filter({hasText:testCase.match}).first();await result.waitFor({timeout:20000});await result.click();
    if(await page.locator('#start').isVisible())await page.locator('#start').click();
    await page.waitForFunction(()=>coords.length>1&&!routeBusy&&routeLength>1000,null,{timeout:65000});
    assert(requests.length);assert(requests.every(request=>request.costing===vehicle));
    if(vehicle==='truck')assert(requests.every(request=>request.costing_options.truck.height===4&&request.costing_options.truck.weight===32));
    await page.waitForFunction(()=>navigationReady&&navigationMap?.isStyleLoaded()||document.querySelectorAll('.leaflet-tile-loaded').length>0,null,{timeout:45000});
    assert.match(await page.locator('#gps-status').textContent(),/GPS connected/);assert.notEqual((await page.locator('#total').textContent()).trim(),'—');
    for(const size of [{width:768,height:1024},{width:1024,height:768}]){await page.setViewportSize(size);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);}
    if(testCase.country==='CA'&&vehicle==='auto'){
     await page.waitForFunction(()=>[...forecastCache.values()].some(value=>value.status==='ready'),null,{timeout:30000});console.log('PASS real arrival-weather data received');const health=await page.request.get(new URL('/api/health',process.env.BASE_URL||'http://127.0.0.1:3000').href);assert.equal(health.status(),200);assert.equal(await page.locator('[data-report]').count(),4);assert.equal(await page.evaluate(async()=>{try{await window.RahyarCloud.submit({});return false;}catch{return !window.RahyarCloud.user;}}),true);console.log('PASS health API and signed-out report protection; four report categories');const length=await page.evaluate(()=>routeLength);await page.route('https://valhalla1.openstreetmap.de/route?**',route=>route.abort());await page.evaluate(()=>calculate(lastPos,session));assert.equal(await page.evaluate(()=>routeLength),length);assert(await page.evaluate(()=>coords.length>1));console.log('PASS network route failure preserves selected route');await page.unroute('https://valhalla1.openstreetmap.de/route?**');
    }
    assert.deepEqual(errors,[]);console.log('PASS '+testCase.country+' '+vehicle+': real route, loaded map, emulated GPS, distance and iPad portrait/landscape');
   }finally{await context.close();}
  }
  const pin=await open({permissions:['geolocation'],geolocation:{latitude:43.6532,longitude:-79.3832,accuracy:5}});try{await pin.page.locator('.vehicle-card[data-vehicle=auto]').click();await pin.page.waitForFunction(()=>navigationReady&&navigationMap?.isStyleLoaded(),null,{timeout:45000});await pin.page.locator('#navigation-map').click({position:{x:160,y:170}});await pin.page.waitForFunction(()=>!!pendingMapPin&&!mapPinLookupPending,null,{timeout:20000});await pin.page.locator('#results button').first().click();assert(await pin.page.evaluate(()=>!!dest?.mapPin));console.log('PASS direct map tap selects a destination without a Pick on Map button');}finally{await pin.context.close();}
  const {context,page}=await open({permissions:[]});try{await page.waitForFunction(()=>/denied|permission|allow/i.test(document.getElementById('gps-status').textContent),null,{timeout:25000});assert(await page.locator('#query').isEnabled());console.log('PASS denied GPS remains visible; destination search remains usable');}finally{await context.close();}
 }finally{await browser.close();}
})().catch(error=>{console.error('Road-test browser check failed:',error.message.slice(0,1800));process.exitCode=1;});
