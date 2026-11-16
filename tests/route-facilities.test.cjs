const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={Intl,window:{},console};vm.createContext(c);vm.runInContext(fs.readFileSync('dist/app.js','utf8').split('function loadCatalog(){')[0],c);c.fixture=JSON.parse(fs.readFileSync('tests/fixtures/regina-calgary-route.json'));c.catalog=JSON.parse(fs.readFileSync('dist/facility-catalog.json'));
const stops=vm.runInContext('prepare(fixture.coordinates,fixture.distance);catalog.facilities.map(f=>({...f,...project(f.coord)})).filter(f=>f.off<2500&&f.along>=0&&f.along<=routeLength)',c);
for(const name of ['Petro-Pass · Moose Jaw','Petro-Pass · Chaplin','Petro-Pass · Swift Current','Petro-Pass · Medicine Hat Box Springs','Dunmore VIS · Alberta Sheriff Highway Patrol','Cheadle MIS · Alberta Sheriff Highway Patrol','Strathmore VIS · Alberta Sheriff Highway Patrol'])assert(stops.some(f=>f.name===name),'Missing route location: '+name);
assert(!stops.some(f=>f.kind==='scale'));
console.log('PASS actual OSRM Regina–Calgary route: 4 previously missing Petro-Pass cardlocks and 3 government inspection/scale stations retained; private scales absent.');
