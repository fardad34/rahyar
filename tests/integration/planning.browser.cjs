'use strict';
const {chromium}=require('@playwright/test'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const proxyUrl=process.env.HTTPS_PROXY||process.env.https_proxy;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox'],proxy:proxyUrl?{server:new URL(proxyUrl).origin,bypass:'127.0.0.1,localhost'}:undefined});
 const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844},permissions:['geolocation'],geolocation:{latitude:43.65,longitude:-79.38}});const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(process.env.BASE_URL||'http://127.0.0.1:3000',{waitUntil:'domcontentloaded'});await p.locator('#notice-agree').check();await p.locator('#notice-confirm').click();
  await p.waitForSelector('.vehicle-cards');assert.equal(await p.locator('.vehicle-card').count(),2);assert.equal(await p.locator('#route-vehicle').isVisible(),false);assert.equal(await p.locator('#pick-map-pin').isVisible(),false);
  await p.locator('.vehicle-card[data-vehicle=auto]').click();assert.equal(await p.locator('#route-vehicle').inputValue(),'auto');
  await p.locator('.vehicle-card[data-vehicle=truck]').click();await p.locator('#app-settings').waitFor({state:'visible'});assert.equal(await p.locator('#truck-profile').getAttribute('open'),'');
  await p.locator('#app-settings summary').filter({hasText:'Display & app'}).click();
  assert.equal(await p.locator('#app-theme option').count(),6);
  for(const theme of ['light','original','graphite','forest','sand','contrast']){await p.locator('#app-theme').selectOption(theme);assert.equal(await p.locator('html').getAttribute('data-theme'),theme);}
  for(const language of ['en','fr','fa','hi','es','de']){await p.locator('#interface-language').selectOption(language);assert.equal(await p.locator('html').getAttribute('lang'),language);}
  await p.locator('#interface-language').selectOption('en');await p.locator('#close-settings').click();
  await p.evaluate(()=>{for(let i=0;i<35;i++)selectDestination({name:'History fixture '+i,coord:[-79+i*.001,44]},false);});
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('rahyar.destinationHistory.v1')).length),30);
  console.log('PASS vehicle cards, first truck configuration, six themes/languages and bounded destination history');
  for(const width of [390,768,1024,1440]){await p.setViewportSize({width,height:900});const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,'Horizontal overflow at '+width);}
  console.log('PASS no horizontal page overflow at mobile/tablet/desktop widths (Chromium, not physical Safari)');
  const fixture=JSON.parse(fs.readFileSync('tests/fixtures/regina-calgary-route.json'));
  await p.evaluate(async fixture=>{selectDestination({name:'Calgary fixture',coord:fixture.coordinates.at(-1)},false);activeRouteVehicle='truck';activeTruckProfile={height:4.15,width:2.6,length:23,weight:39.5,axle_load:9,axle_count:5,hazmat:false};routeManeuvers=[{at:100,instruction:'Fixture turn instruction'}];await window.rahyarPersistTrip({geometry:{type:'LineString',coordinates:fixture.coordinates},distance:fixture.distance,duration:10000,legs:[{steps:[]}]},null);},fixture);
  if(await p.locator('#nav-shell').count()){await p.locator('[aria-label="More controls"]').click();await p.locator('.nav-menu-item').filter({hasText:'Offline route & storage'}).click();}else await p.locator('details').filter({has:p.locator('#prepare-offline')}).locator('summary').click();
  p.on('dialog',dialog=>dialog.accept());await p.locator('#prepare-offline').click();await p.waitForFunction(()=>document.getElementById('offline-status').textContent.includes('Basic route/app files prepared'),{timeout:60000});
  await context.setOffline(true);await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.getElementById('offline-status').textContent.includes('Calgary fixture'),{timeout:15000});
  if(await p.locator('#nav-shell').count()){await p.locator('[aria-label="More controls"]').click();await p.locator('.nav-menu-item').filter({hasText:'Offline route & storage'}).click();}else await p.locator('details').filter({has:p.locator('#review-saved-route')}).locator('summary').click();await p.locator('#review-saved-route').click();assert.equal(await p.locator('#offline-directions li').count(),1);assert.match(await p.locator('#offline-status').textContent(),/Review only/);
  assert(await p.evaluate(()=>coords.length>1));
  console.log('PASS prepared app reloads offline; route preview/profile/guidance survive reload without offline rerouting claims');
  await context.setOffline(false);console.log('Browser page errors:',JSON.stringify(errors));assert.deepEqual(errors,[]);
 }finally{await context.close();await browser.close();}
})().catch(error=>{console.error('Planning browser check failed:',error.message.slice(0,1800));process.exitCode=1;});
