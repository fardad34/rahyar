const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/coverage.js','utf8'),ctx);vm.runInContext(fs.readFileSync('dist/place-search.js','utf8'),ctx);
ctx.data=JSON.parse(fs.readFileSync('tests/fixtures/calgary-address.json'));const match=vm.runInContext("parseAddressCandidates(data,'5620 68 Ave SE, Calgary, AB T2C 4N8')",ctx);assert.equal(match.length,1);assert.equal(match[0].name,'5620 68 Ave SE');assert(match[0].postalMismatch);assert.equal(match[0].addressLabel,'5620 68 Ave SE, Calgary, AB T2C 4N8');assert.equal(match[0].coord.length,2);
assert.equal(vm.runInContext("parseAddressCandidates(data,'9999 68 Ave SE, Calgary').length",ctx),0);assert(vm.runInContext("looksLikeAddress('5620 68 Ave SE, Calgary')",ctx));assert(!vm.runInContext("looksLikeAddress('Calgary')",ctx));
let angle;Object.assign(ctx,{map:{setBearing:x=>angle=x},document:{body:{classList:{contains:()=>true}}},coords:[],progress:0,routeLength:0,hav:(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])*111000});vm.runInContext(fs.readFileSync('dist/map-heading.js','utf8'),ctx);
assert(Math.abs(vm.runInContext('bearingBetween([0,0],[1,0])',ctx)-90)<.001);assert(Math.abs(vm.runInContext('bearingBetween([0,0],[-1,0])',ctx)-270)<.001);
ctx.fix={accuracy:5,speed:20,heading:90};ctx.position=[0,0];vm.runInContext('recordGpsHeading(fix,position);updateCockpitBearing()',ctx);assert.equal(angle,-90);
ctx.fix={accuracy:5,speed:0,heading:210};vm.runInContext('recordGpsHeading(fix,position);updateCockpitBearing()',ctx);assert.equal(angle,-90,'Stopped GPS must not rotate map');
assert(vm.runInContext('blendBearing(359,1)',ctx)>358,'Heading wrap must not spin through 180 degrees');vm.runInContext('mapHeadingUp=false;updateCockpitBearing()',ctx);assert.equal(angle,0);
const app=fs.readFileSync('dist/app.js','utf8');assert(app.includes('let dest=null'));assert(/initSiteNotice\(\(\) => \{[\s\S]*initStartScreen\(\);\s*\}\);\s*$/.test(app));assert(!app.includes('&layer=city'));
console.log('PASS exact numbered address; original postal code preserved; wrong house rejected; city/address query distinction; heading-up rotation; stationary heading held; shortest-angle smoothing; north-up toggle; no default destination or auto-demo.');

const test = require('node:test');
test('UK and European endpoints resolve to their countries and road units', async () => {
  const eu = vm.createContext({getJSON: async url => JSON.parse(fs.readFileSync('dist/' + url.split('?')[0]))});
  for (const file of ['coverage.js', 'road-context.js', 'place-search.js']) {
    vm.runInContext(fs.readFileSync('dist/' + file, 'utf8'), eu);
  }
  await eu.loadRegions();
  for (const [coord, country, distance, speed, temperature] of [
    [[-0.08, 51.5149], 'GB', 'mi', 'mph', '°C'],
    [[2.3514, 48.8573], 'FR', 'km', 'km/h', '°C'],
    [[4.352, 50.8499], 'BE', 'km', 'km/h', '°C'],
    [[-114.07, 51.0447], 'CA', 'km', 'km/h', '°C'],
    [[-73.98, 40.75], 'US', 'mi', 'mph', '°F'],
  ]) {
    eu.coord = coord;
    assert.equal(eu.regionAt(coord).country, country);
    assert.equal(vm.runInContext('currentCountry=regionAt(coord).country; [distanceUnit(),speedUnit(),temperatureUnit()].join(" ")',eu),
      [distance,speed,temperature].join(' '));
  }
  const result = eu.parseAddressCandidates({
    candidates: [{address:'Downing Street 10', location:{x:-0.1276,y:51.5034}, score:99,
      attributes:{Country:'GBR', AddNum:'10', Addr_type:'PointAddress', City:'London'}}],
  }, '10 Downing Street, London');
  assert.equal(result[0].country, 'GB');
});
