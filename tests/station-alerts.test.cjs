const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('station alerts use separate 20 km and 3 km stages and filter opposing traffic', () => {
  const context = vm.createContext({pointOnRoute:d=>[d,0],bearingBetween:()=>90,routeLength:50000});
  vm.runInContext(fs.readFileSync('dist/station-alerts.js','utf8'),context);
  assert.equal(vm.runInContext("stationThreshold(20001,new Set())",context),0);
  assert.equal(vm.runInContext("stationThreshold(20000,new Set())",context),20);
  assert.equal(vm.runInContext("stationThreshold(8000,new Set([20]))",context),0);
  assert.equal(vm.runInContext("stationThreshold(3000,new Set([20]))",context),3);
  assert.equal(vm.runInContext("stationThreshold(3000,new Set([20,3]))",context),0);
  assert.equal(vm.runInContext("stationMatchesRoute({direction:'Highway 17 Eastbound',off:45,at:40000})",context),true);
  assert.equal(vm.runInContext("stationMatchesRoute({direction:'Highway 17 Westbound',off:45,at:40000})",context),false);
  assert.equal(vm.runInContext("stationMatchesRoute({direction:'Highway 17',off:45,at:40000})",context),false);
});

test('Beverley, Headingley and West Hawk Lake are listed for both directions with separate reports', () => {
  const {facilities} = JSON.parse(fs.readFileSync('dist/facility-catalog.json','utf8'));
  const context = vm.createContext({pointOnRoute:d=>[d,0],heading:55,bearingBetween:()=>context.heading,routeLength:50000});
  vm.runInContext(fs.readFileSync('dist/station-alerts.js','utf8'),context);
  for (const sourceId of ['beverley','headingley','west-hawk-lake']) {
    const station = facilities.find(item=>item.sourceId===sourceId);
    assert.equal(station.authority,'government');
    context.station = {...station,at:20000,off:40};
    context.heading = 55;
    assert.equal(vm.runInContext('stationMatchesRoute(station)',context),true);
    const east = vm.runInContext('stationIdentity(station)',context);
    context.heading = 235;
    assert.equal(vm.runInContext('stationMatchesRoute(station)',context),true);
    const west = vm.runInContext('stationIdentity(station)',context);
    assert.notEqual(east,west);
  }
});

test('Rush Bay remains an Ontario eastbound station', () => {
  const {facilities} = JSON.parse(fs.readFileSync('dist/facility-catalog.json','utf8'));
  const station = facilities.find(item=>item.name==='Rush Bay Truck Inspection Station');
  const context = vm.createContext({station:{...station,off:40,at:24000},
    pointOnRoute:d=>[d,0],heading:90,bearingBetween:()=>context.heading,routeLength:50000});
  vm.runInContext(fs.readFileSync('dist/station-alerts.js','utf8'),context);
  assert.equal(vm.runInContext('stationMatchesRoute(station)',context),true);
  context.heading=270;
  assert.equal(vm.runInContext('stationMatchesRoute(station)',context),false);
});
