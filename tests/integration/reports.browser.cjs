const {chromium}=require('@playwright/test');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const proxyUrl=process.env.HTTPS_PROXY||process.env.https_proxy;
 const proxy=proxyUrl?{server:new URL(proxyUrl).origin,bypass:'127.0.0.1,localhost'}:undefined;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox'],proxy});
 const testLatitude=43.65+Math.random()*.1;
 const baseURL=process.env.BASE_URL||'http://127.0.0.1:3000';
 const users=JSON.parse(fs.readFileSync(process.env.RAHYAR_TEST_USERS_FILE));const contexts=[],pages=[];const errors=[];
 try{
  for(let i=0;i<2;i++){
   const c=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:i?390:1024,height:i?844:768},geolocation:{latitude:testLatitude,longitude:-79.38},permissions:['geolocation']});contexts.push(c);
   const p=await c.newPage();pages.push(p);p.on('pageerror',e=>errors.push(e.message));
   await p.goto(baseURL,{waitUntil:'domcontentloaded',timeout:60000});
   console.log('Loaded local page:',await p.title());await p.locator('#notice-agree').check();await p.locator('#notice-confirm').click();
   await p.waitForFunction(()=>window.RahyarCloud?.client(),{timeout:30000});
   await p.locator('#cloud-panel summary').click();await p.locator('#cloud-email').fill(users[i].email);await p.locator('#cloud-password').fill(users[i].password);await p.locator('#cloud-auth button[value=signin]').click();
   await p.waitForFunction(()=>!!window.RahyarCloud?.user,{timeout:30000});
  }
  console.log('PASS actual browser account sign-in in two isolated contexts');
  const b=pages[1];await b.evaluate(async()=>{
   window.integrationEvents=[];
   await new Promise((resolve,reject)=>{
    window.integrationChannel=window.RahyarCloud.client().channel('integration-verification').on('postgres_changes',{event:'INSERT',schema:'public',table:'rahyar_road_reports'},payload=>window.integrationEvents.push(payload.new)).subscribe(status=>{if(status==='SUBSCRIBED')resolve();if(status==='CHANNEL_ERROR')reject(Error('Realtime failed'));});
    setTimeout(()=>reject(Error('Realtime subscribe timed out')),20000);
   });
  });
  const first=pages[0];await first.locator('#report-open').click();await first.locator('[data-report=police]').click();
  await b.waitForFunction(()=>window.integrationEvents.some(r=>r.category==='police'),{timeout:20000});
  await b.waitForFunction(()=>window.RahyarCloud.reports.some(r=>r.category==='police'),{timeout:10000});
  console.log('PASS independent browser B received browser A police report via real Supabase WebSocket and UI store');
  assert.equal(await first.locator('#report-dialog [data-report]').count(),4);
  assert.equal(await first.locator('#report-dialog [data-report=collision]').count(),0);
  console.log('PASS exactly four report categories');
  await contexts[0].setOffline(true);
  await first.locator('[data-report=construction]').click();
  await first.waitForFunction(()=>window.RahyarCloud.queueLength>0,{timeout:10000});
  assert(await first.evaluate(()=>JSON.parse(localStorage.getItem('rahyar.sharedReportQueue.v1')).length>0));
  await contexts[0].setOffline(false);
  await b.waitForFunction(()=>window.integrationEvents.some(r=>r.category==='construction'),{timeout:20000});
  await first.waitForFunction(()=>window.RahyarCloud.queueLength===0,{timeout:10000});
  console.log('PASS offline queue persists and automatically shares with browser B after reconnection');
  const health=await first.request.get(new URL('/api/health',baseURL).href);assert.equal(health.status(),200);
  console.log('PASS application health endpoint');
  await first.locator('#report-close').click();
  await first.locator('details').filter({has:first.locator('#ask-form')}).locator('summary').click();
  await first.locator('#ask-input').fill('Switch to night map');await first.locator('#ask-form button[type=submit]').click();
  await first.locator('#ask-action').waitFor({state:'visible'});await first.locator('#ask-action').click();assert(await first.evaluate(()=>navigationNight));
  assert.match(await first.locator('#ask-source').textContent(),/no language model/);
  console.log('PASS authenticated server-side data assistant and confirmed map command; no model is claimed');


  console.log('Page errors:',JSON.stringify(errors));assert.deepEqual(errors,[]);
 }finally{await Promise.all(contexts.map(c=>c.close()));await browser.close();}
})().catch(e=>{console.error('Browser check failed:',e.message.slice(0,1400));process.exitCode=1});
