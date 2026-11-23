'use strict';
// Real layout/sheet handlers, synthetic road text; no active trip/physical-device claims.
const {chromium}=require('@playwright/test'),assert=require('node:assert/strict');
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const p=await browser.newPage();try{
 await p.addInitScript(()=>{window.setInterval=()=>0;});
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:3055',{waitUntil:'domcontentloaded'});await p.locator('#notice-agree').check();await p.locator('#notice-confirm').click();await p.waitForSelector('#nav-shell');await p.evaluate(()=>document.fonts.ready);await p.evaluate(()=>{updateKilometreMarker=()=>{};});
 for(const size of [{width:1280,height:889},{width:1180,height:820},{width:390,height:844},{width:844,height:390}]){
  await p.setViewportSize(size);await p.evaluate(()=>{document.body.classList.add('driving');document.body.classList.remove('map-expanded');window.RahyarSheet.setState('collapsed');const e=$('focus-current-road');e.hidden=false;e.textContent='On PTH 1 East';let km=$('nav-km-marker');if(!km){km=document.createElement('div');km.id='nav-km-marker';km.className='nav-km-marker';$('nav-shell').append(km);}km.textContent='km —';km.hidden=false;window.rahyarLayoutRoadSlot();});await p.waitForTimeout(350);
  const road=p.locator('#focus-current-road'),short=await road.boundingBox();assert(short);assert(short.width<170,'short road name must shrink to its text');assert(short.height<40,'one line must not retain an empty second line');
  await p.evaluate(()=>{$('focus-current-road').textContent=currentRoadLabelText('Trans-Canada Highway; Route Transcanadienne · PTH 1 East');});
  const long=await road.boundingBox(),slot=await p.locator('#nav-road-slot').boundingBox();assert.equal(long.y,short.y);assert(long.height>short.height);assert(long.width<=slot.width+1);assert(Math.abs(long.x+long.width/2-(slot.x+slot.width/2))<1);
  const text=await road.evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return {rows:[...new Set([...r.getClientRects()].map(x=>Math.round(x.y)))],clamp:getComputedStyle(e).webkitLineClamp};});assert.equal(text.clamp,'2');assert(text.rows.length>=2);
  for(const state of ['half','full','collapsed']){await p.evaluate(s=>window.RahyarSheet.setState(s),state);await p.waitForTimeout(350);const sheet=await p.locator('#nav-trip-sheet').boundingBox(),km=await p.locator('#nav-km-marker').boundingBox();if(sheet.x+sheet.width>=size.width*.75&&state!=='collapsed'){assert.equal(await road.isVisible(),false,'no spare lower map space: hide label instead of covering full-width sheet');continue;}const box=await road.boundingBox();assert.equal(box.y,long.y,'sheet must not raise road label');assert.equal(box.x,long.x);assert(!overlap(box,km),'road label must not cover milestone');if(sheet.x+sheet.width<size.width*.75){assert(box.x>=sheet.x+sheet.width+10);assert(!overlap(box,sheet),'road label must not cover docked trip sheet');assert(box.x+box.width<=km.x-10);}}
  await p.evaluate(()=>navigationMap?.jumpTo({center:[-115.9,51.4],zoom:10}));assert.equal((await road.boundingBox()).y,long.y);
  if(size.width===1280)await p.screenshot({path:'/tmp/rahyar-road-gap-ipad.png'});
  console.log('PASS text-sized one/two-line road label in free gap, unchanged by sheet/pan: '+size.width+'x'+size.height);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
