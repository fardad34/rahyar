const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('speed change stages play one, two and three tones', () => {
  const starts = [];
  const gain = {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};
  const context = vm.createContext({audio:{
    state:'running',currentTime:1,createGain:()=>gain,
    createOscillator:()=>({frequency:{},connect:()=>gain,start:time=>starts.push(time),stop(){}}),
  }});
  vm.runInContext(fs.readFileSync('dist/navigation-alerts.js','utf8')+'\nnavigationAudio=audio',context);
  for (const [distance,count] of [[300,1],[200,2],[100,3]]) {
    starts.length = 0;
    vm.runInContext('announceSpeedStage('+distance+')',context);
    assert.equal(starts.length,count);
  }
});

test('arrival requires two distinct, reliable positions near the destination', () => {
  const context = vm.createContext({routeLength:1000,progress:970,lastAccuracyMeters:18,
    lastSpeedMps:2,routeBusy:false,dest:{coord:[0,0]},coords:[[0,0]],hav:()=>20});
  vm.runInContext(fs.readFileSync('dist/navigation-alerts.js','utf8'),context);
  const now = Date.now();
  const arrival = timestamp=>vm.runInContext('confirmTripArrival([0,0],'+timestamp+')',context);
  assert.equal(arrival(now-1),false);
  assert.equal(arrival(now-1),false);
  assert.equal(arrival(now),true);
  context.lastSpeedMps = 15;
  assert.equal(arrival(now),false);
  context.lastSpeedMps = 2;
  context.lastAccuracyMeters = 50;
  assert.equal(arrival(now),false);
});

test('road map markers distinguish signals and the two enforcement camera types', () => {
  const context = vm.createContext({elements:[
    {type:'node',id:1,lat:51,lon:-114,tags:{highway:'traffic_signals'}},
    {type:'node',id:2,lat:51,lon:-114,tags:{highway:'speed_camera'}},
    {type:'node',id:3,lat:51,lon:-114},
    {type:'relation',tags:{enforcement:'traffic_signals'},members:[{type:'node',role:'device',ref:3}]},
  ]});
  vm.runInContext(fs.readFileSync('dist/road-map-markers.js','utf8'),context);
  assert.deepEqual(Array.from(vm.runInContext('mappedRoadPoints(elements)',context),point=>point.kind),['signals','speed','redlight']);
});
