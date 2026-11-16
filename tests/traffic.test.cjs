const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

function setup(status = 200, storageFails = false) {
  const elements = new Map();
  const $ = id => {
    if (!elements.has(id)) elements.set(id, {value:'', checked:false, hidden:false,
      setAttribute() {}, addEventListener() {}, reportValidity:()=>true});
    return elements.get(id);
  };
  const data = new Map();
  const storage = {getItem:key=>data.get(key), setItem(key,value) {
    if(storageFails) throw Error('unavailable');
    data.set(key,value);
  },removeItem:key=>data.delete(key)};
  let requests = 0;
  const ctx = vm.createContext({
    $, document:{querySelectorAll:()=>[],addEventListener(){}}, window:{},
    navigationMap:null,navigationReady:false,navigationNight:false,map:null,lastPos:[-122,49],
    isDemo:false,watch:1,gpsTime:Date.now(),lastAccuracyMeters:5,activeCityBoundaries:new Map(),
    loadCatalog:async()=>[],searchKey:s=>s.toLowerCase(),
    hav:(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])*111000,
    cityBoundaryContains:(rings,p)=>p[0]>=rings[0][0][0]&&p[0]<=rings[0][2][0]&&p[1]>=rings[0][0][1]&&p[1]<=rings[0][2][1],
    localStorage:storage,sessionStorage:storage,AbortController,
    setTimeout,clearTimeout,setInterval:()=>1,clearInterval(){},
    fetch:async()=>{requests++;return {ok:status===200,status,headers:{get:()=> 'image/png'},blob:async()=>new Blob(['tile'])};},Blob,
  });
  vm.runInContext(fs.readFileSync('dist/traffic.js','utf8')+'\ninitTraffic();',ctx);
  return {$,ctx,data,get requests(){return requests;}};
}

test('traffic stays off until a valid connection; rejected keys are not stored',async()=>{
  const app=setup(403);
  app.$('traffic-key').value='test-key-for-fixture';
    app.$('traffic-mode').value='on';
  app.$('traffic-daily-limit').value='500';
    app.$('traffic-monthly-limit').value='10000';
    await app.$('traffic-form').onsubmit({preventDefault(){}});
  assert.equal(app.requests,1);
  assert.equal(vm.runInContext('trafficEnabled',app.ctx),false);
  assert.equal(app.data.has('rahyar.tomtom-key'),false);
  assert.match(app.$('traffic-settings-status').textContent,/refused/);
});

test('connected key persists only by user choice and can be removed; storage failures are visible',async()=>{
  for(const fails of [false,true]){
    const app=setup(200,fails);
    app.$('traffic-key').value='test-key-for-fixture';
    app.$('traffic-mode').value='on';
    app.$('traffic-remember').checked=true;
    app.$('traffic-daily-limit').value='500';
    app.$('traffic-monthly-limit').value='10000';
    await app.$('traffic-form').onsubmit({preventDefault(){}});
    assert.equal(vm.runInContext('trafficEnabled',app.ctx),true);
    assert.equal(app.$('traffic-key').value,'');
    if(fails) assert.match(app.$('traffic-settings-status').textContent,/storage is unavailable/i);
    else assert.equal(app.data.get('rahyar.tomtom-key'),'test-key-for-fixture');
    app.$('traffic-forget').onclick();
    assert.equal(app.data.has('rahyar.tomtom-key'),false);
    assert.equal(vm.runInContext('trafficEnabled',app.ctx),false);
    assert.equal(vm.runInContext('trafficKey',app.ctx),'');
  }
});


test('traffic request budget stops requests before they reach the provider', () => {
  const app = setup();
  vm.runInContext("trafficLimits={daily:2,monthly:10};trafficEnabled=true;trafficMode='on'", app.ctx);
  const url = 'https://api.tomtom.com/maps/orbis/traffic/flow/raster/tile/10/1/1';
  app.ctx.tileURL=url;
  assert.equal(vm.runInContext('trafficTransformRequest(tileURL).url',app.ctx),url);
  assert.equal(vm.runInContext('trafficTransformRequest(tileURL).url',app.ctx),url);
  assert.match(vm.runInContext('trafficTransformRequest(tileURL).url',app.ctx),/^data:image/);
  assert.equal(vm.runInContext('trafficEnabled',app.ctx),false);
  assert.equal(vm.runInContext('trafficUsageNow().daily',app.ctx),2);
  assert.match(app.$('traffic-settings-status').textContent,/limit/);
});


test('city mode enters at 10km, exits beyond 12km, ignores unrelated boundaries and pauses on stale GPS', () => {
  const app=setup();
  vm.runInContext("trafficCities=[{en:'City',coord:[-122,49]}];trafficKey='fixture';trafficMode='city';applyTrafficMode()",app.ctx);
  assert.equal(vm.runInContext('trafficEnabled',app.ctx),true);
  app.ctx.lastPos=[-122,49.1];
  vm.runInContext('applyTrafficMode()',app.ctx);
  assert.equal(vm.runInContext('trafficEnabled',app.ctx),true);
  app.ctx.lastPos=[-122,49.12];
  vm.runInContext('applyTrafficMode()',app.ctx);
  assert.equal(vm.runInContext('trafficEnabled',app.ctx),false);
  app.ctx.lastPos=[-122,49];
  app.ctx.gpsTime=Date.now()-30000;
  vm.runInContext('applyTrafficMode()',app.ctx);
  assert.equal(vm.runInContext('trafficEnabled',app.ctx),false);
  app.ctx.gpsTime=Date.now();
  app.ctx.lastPos=[-122,49.2];
  app.ctx.activeCityBoundaries.set('County',[{bounds:[-123,48,-121,50],rings:[[[-123,48],[-121,48],[-121,50],[-123,50],[-123,48]]]}]);
  vm.runInContext('applyTrafficMode()',app.ctx);
  assert.equal(vm.runInContext('trafficEnabled',app.ctx),false);
  app.ctx.activeCityBoundaries.set('city',app.ctx.activeCityBoundaries.get('County'));
  vm.runInContext('applyTrafficMode()',app.ctx);
  assert.equal(vm.runInContext('trafficEnabled',app.ctx),true);
  vm.runInContext("trafficSuspended=true;trafficEnabled=false;applyTrafficMode()",app.ctx);
  assert.equal(vm.runInContext('trafficEnabled',app.ctx),false);
});
