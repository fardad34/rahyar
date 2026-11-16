const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync('dist/app.js', 'utf8');
const ctx = vm.createContext({
  hav: (a,b) => Math.hypot(a[0]-b[0], a[1]-b[1]) * 1000,
  searchKey: s => s.toLowerCase(),
});
vm.runInContext(app.match(/const CITY_(?:CORRIDOR|CENTER_FALLBACK)_METERS=\d+;/g).join('\n'),ctx);
vm.runInContext(fs.readFileSync('dist/route-cities.js','utf8'),ctx);
vm.runInContext(app.slice(app.indexOf('function routeCityCandidates'),app.indexOf('function setTargets')),ctx);
vm.runInContext(fs.readFileSync('dist/route-guidance.js','utf8'),ctx);
const result = vm.runInContext(`
  const via={name:'Waypoint',coord:[30,0]};
  const ring=[[9,-1],[16,-1],[16,1],[9,1],[9,-1]];
  const boundaries=new Map([['ring road city',[{rings:[ring],bounds:[9,-1,16,1]}]]]);
  const cities=[{name:'Ring road city',coord:[15,0]},{name:'Nearby only',coord:[5,0]},
    {name:'Centre crossing',coord:[.5,0]},{name:'Cross-border town',coord:[.7,0],country:'US'},via];
  const locate=([x])=>({off:x*1000,along:15000});
  routeCityCandidates(cities,{coord:[100,0]},100000,locate,via,20000,boundaries,[[10,0]],()=>[0,0],()=>({country:'CA'}))
`,ctx);
assert.deepEqual(Array.from(result,c=>[c.name,c.along]),[['Ring road city',15000],['Centre crossing',15000],['Waypoint',20000]]);
assert.equal(vm.runInContext(`
  routeCityCandidates(cities,{coord:[100,0]},100000,locate,null,null,boundaries,[[20,0]])
    .some(city=>city.name==='Ring road city')
`,ctx),false);
assert.equal(vm.runInContext(`
  routeCityCandidates([{name:'Riverton',coord:[5,0]}],{coord:[100,0]},100000,locate,
    null,null,new Map(),[],null,null,[{at:14000,road:'Riverton Bypass'}]).length
`,ctx),1);
const route = vm.runInContext(`
  buildRouteManeuvers({legs:[{steps:[
    {name:'Deerfoot Trail',ref:'2',distance:1200,maneuver:{type:'depart'}},
    {name:'Stoney Trail',ref:'201',exits:'271B',destinations:'Banff',distance:3000,maneuver:{type:'off ramp',modifier:'right'}}
  ]}]})
`,ctx);
assert.equal(route[0].instruction,'Take exit 271B on the right onto Stoney Trail · 201 · Toward Banff');
assert.equal(vm.runInContext('routeRoads[0].road',ctx),'Deerfoot Trail · 2');
assert.equal(vm.runInContext('routeRoads[1].at',ctx),1200);
assert.equal(vm.runInContext("maneuverInstruction({name:'Main Street',maneuver:{type:'off ramp',modifier:'right'}})",ctx),
  'Take the exit on the right onto Main Street');

assert.equal(vm.runInContext("maneuverInstruction({name:'Trans-Canada Highway',ref:'1',maneuver:{type:'fork',modifier:'right'}},{name:'Trans-Canada Highway',ref:'1'})",ctx),'Stay on Trans-Canada Highway · 1');
assert.match(vm.runInContext("maneuverInstruction({name:'Trans-Canada Highway',ref:'1',exits:'36',maneuver:{type:'fork',modifier:'right'}},{name:'Trans-Canada Highway',ref:'1'})",ctx),/^Take exit 36/);

const test = require('node:test');
test('Trans-Canada route samples recognize Moose Jaw, Regina and Brandon beyond the city-centre radius', async () => {
  ctx.getJSON = async file => JSON.parse(fs.readFileSync('dist/' + file));
  const boundaries = await ctx.loadMunicipalBoundaries('ca-municipalities.json');
  const cities = [
    {name: 'Moose Jaw', coord: [-105.53445, 50.40005], sample: [-105.515409, 50.418916]},
    {name: 'Regina', coord: [-104.6178, 50.45008], sample: [-104.497673, 50.438954]},
    {name: 'Brandon', coord: [-99.95306, 49.84692], sample: [-99.953091, 49.886789]},
  ];
  const locate = ([lon]) => ({off: 4000, along: (lon + 106) * 60000});
  const destination = {coord: [-97.138, 49.895]};
  const samples = cities.map(city => city.sample);
  assert.equal(ctx.routeCityCandidates(cities, destination, 600000, locate).length, 0);
  const found = ctx.routeCityCandidates(cities, destination, 600000, locate, null, null, boundaries, samples);
  assert.deepEqual(Array.from(found, city => city.name), ['Moose Jaw', 'Regina', 'Brandon']);
});
