const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const facilities=JSON.parse(fs.readFileSync('dist/facility-catalog.json')).facilities;
test('existing Wasi South matches Ontario 511 inventory identity/coordinates and opposite directions are excluded',()=>{
 const station=facilities.find(s=>s.name==='Wasi South Truck Inspection Station');assert(station);assert.equal(station.sourceId,'20');assert.deepEqual(station.coord,[-79.359774,46.171362]);assert.equal(station.authority,'government');assert.match(station.direction,/Southbound/);
 const c={station:{...station,off:50,at:10000},pointOnRoute:d=>[d,0],bearingBetween:()=>c.heading,heading:180,routeLength:20000};vm.createContext(c);vm.runInContext(fs.readFileSync('dist/station-alerts.js','utf8'),c);assert.equal(vm.runInContext('stationMatchesRoute(station)',c),true);c.heading=0;assert.equal(vm.runInContext('stationMatchesRoute(station)',c),false);
});
test('Wassi spelling finds the existing Wasi station without adding a duplicate or claiming operating status',()=>{
 const c={supportedGeocodingCountries:{CA:'CAN',US:'USA'}};vm.createContext(c);vm.runInContext(fs.readFileSync('dist/place-search.js','utf8'),c);c.facilities=facilities;
 const matches=vm.runInContext("localFacilityMatches('Wassi South',facilities)",c);assert.equal(matches.length,1);assert.equal(matches[0].name,'Wasi South Truck Inspection Station');assert.match(matches[0].matchNote,/Operating status is not supplied/);assert.equal(facilities.filter(s=>s.name==='Wasi South Truck Inspection Station').length,1);
});
