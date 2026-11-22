'use strict';
// Actual application styles and sheet interactions; no live routing or physical-device claims.
const {chromium}=require('@playwright/test'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const p=await browser.newPage();try{
 // Freeze periodic guidance refresh: this fixture has no active trip; test actual CSS/sheet handlers.
 await p.addInitScript(()=>{window.setInterval=()=>0;});
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:3055',{waitUntil:'domcontentloaded'});await p.locator('#notice-agree').check();await p.locator('#notice-confirm').click();await p.waitForSelector('#nav-shell');
 for(const size of [{width:1280,height:889},{width:1180,height:820},{width:390,height:844},{width:844,height:390}]){
  await p.setViewportSize(size);await p.evaluate(()=>{document.body.classList.add('driving');document.body.classList.remove('map-expanded');window.RahyarSheet.setState('collapsed');const e=$('focus-current-road');e.hidden=false;e.textContent='On PTH 1 East';});await p.waitForTimeout(350);
  const road=p.locator('#focus-current-road'),short=await road.boundingBox();assert(short);assert(Math.abs(short.x+short.width/2-size.width/2)<1);assert(Math.abs(short.y+short.height-(size.height-120))<1);
  await p.evaluate(()=>{$('focus-current-road').textContent='On Trans-Canada Highway; Autoroute Transcanadienne · Highway 1 and Highway 93';});
  const long=await road.boundingBox();assert.equal(long.y,short.y);assert.equal(long.height,short.height);
  const text=await road.evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return {rows:[...new Set([...r.getClientRects()].map(x=>Math.round(x.y)))],whiteSpace:getComputedStyle(e).whiteSpace,clamp:getComputedStyle(e).webkitLineClamp};});assert.equal(text.whiteSpace,'normal');assert.equal(text.clamp,'2');assert(text.rows.length>=2,'long name must actually wrap');
  for(const state of ['half','full','collapsed']){await p.evaluate(s=>window.RahyarSheet.setState(s),state);await p.waitForTimeout(350);const b=await road.boundingBox();assert.equal(b.y,short.y,'sheet must not move road label');assert.equal(b.x,short.x);}
  await p.evaluate(()=>{navigationMap?.jumpTo({center:[-115.9,51.4],zoom:10});});assert.equal((await road.boundingBox()).y,short.y);
  console.log('PASS fixed bottom-center road label, actual multiline wrap, all sheet states and map pan: '+size.width+'x'+size.height);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
