const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map();const $=id=>{if(!nodes.has(id))nodes.set(id,{checked:true,textContent:'',setAttribute(){},after(){}});return nodes.get(id)};
const c={$};vm.createContext(c);vm.runInContext(fs.readFileSync('dist/fuel-filters.js','utf8'),c);vm.runInContext(fs.readFileSync('dist/road-context.js','utf8'),c);
for(const [name,key]of [['Petro-Pass Regina','petro-pass'],['Flying J Travel Center','flying-j'],['Pilot','pilot'],['Esso Cardlock','esso'],['BVD','bvd'],['Petro Stopping Center','ta-petro'],["Love’s Travel Stop",'loves']]){c.item={name,kind:'diesel'};assert.equal(vm.runInContext('fuelBrandKey(item)',c),key);$('brand-'+key).checked=false;assert.equal(vm.runInContext('facilityVisible(item)',c),false);$('brand-'+key).checked=true;assert.equal(vm.runInContext('facilityVisible(item)',c),true)}
c.item={kind:'scale'};assert.equal(vm.runInContext('facilityVisible(item)',c),false,'Private scales always excluded');
const jumps=[],data={};Object.assign(c,{document:{body:{classList:{contains:name=>name==='driving'}}},coords:[[0,0],[1,1]],targets:[{name:'Gov',kind:'weigh',authority:'government',coord:[.2,.2]},{name:'Scale',kind:'scale',coord:[.3,.3]}],isDemo:false,mapHeadingUp:true,mapDisplayHeading:87,gpsTravelHeading:90,cockpitMapFollow:true,session:1,routeRevision:1});
vm.runInContext(fs.readFileSync('dist/map-3d.js','utf8'),c);c.testMap={getContainer:()=>({clientHeight:500}),resize(){},jumpTo:x=>jumps.push(x),easeTo:x=>jumps.push(x),getSource:key=>({setData:v=>data[key]=v})};vm.runInContext('navigationMap=testMap;navigationMarker={setLngLat(){return this},setRotation(){return this}};navigationReady=true;syncNavigationData();followNavigationPosition([.5,.5],true)',c);
assert.equal(jumps[0].pitch,60);assert.equal(jumps[0].bearing,87);assert.equal(jumps[0].zoom,16.5);assert.equal(data.stops.features.length,1,'3D pins use same filters');assert.equal(data.journey.geometry.coordinates.length,2);
vm.runInContext('cockpitMapFollow=false;followNavigationPosition([.6,.6])',c);assert.equal(jumps.length,1,'Browsing does not recenter');
vm.runInContext('cockpitMapFollow=true;mapHeadingUp=false;navigationPitch=false;followNavigationPosition([.7,.7])',c);assert.equal(jumps[1].pitch,0);assert.equal(jumps[1].bearing,0);
const catalog=JSON.parse(fs.readFileSync('dist/facility-catalog.json'));assert(!catalog.facilities.some(f=>f.kind==='scale'));assert.equal(catalog.facilities.filter(f=>f.sourceType==='ab-sheriff').length,41);
console.log('PASS fuel brand filters; private scales removed; real 3D camera pitch; heading-up / north-up; browse preserved; filtered 3D route pins; 41 government Alberta stations.');

assert.equal(jumps[0].padding.top-jumps[0].padding.bottom,352);
assert.match(vm.runInContext('navigationStyle()',c),/liberty$/);
const satellite=vm.runInContext('navigationSatellite=true;navigationNight=true;navigationStyle()',c);
assert.match(satellite.sources.imagery.tiles[0],/World_Imagery/);
assert.equal(satellite.layers[0].paint['raster-brightness-max'],.65);

c.document.body.classList.contains=()=>false;
vm.runInContext('pauseMainMapFollow();followNavigationPosition([.8,.8])',c);
assert.equal(jumps.length,2,'Exploring the main map prevents GPS from recentering');
assert.deepEqual(Array.from(vm.runInContext('navigationLastPosition',c)),[.8,.8]);
vm.runInContext('mainMapBrowsing=false;followNavigationPosition([.9,.9],true)',c);
assert.equal(jumps.length,3,'Center on truck restores follow mode');

const pendingRecenters=new Map();let recenterSequence=0;
Object.assign(c,{
  document:{body:{classList:{contains:name=>name==='driving'}}},
  watch:1,pickingMapPin:false,lastPos:[.8,.8],updateCockpitMapState(){},
  setTimeout(fn,delay){assert.equal(delay,7000);pendingRecenters.set(++recenterSequence,fn);return recenterSequence},
  clearTimeout(id){pendingRecenters.delete(id)},
  followCockpitPosition(position,reset){assert.equal(reset,true);jumps.push(position)},
});
vm.runInContext('pauseMapForGesture();resumeMapAfterGesture();pauseMapForGesture()',c);
assert.equal(pendingRecenters.size,0,'A new gesture cancels the countdown');
vm.runInContext('resumeMapAfterGesture()',c);
assert.equal(pendingRecenters.size,1);
pendingRecenters.values().next().value();
assert.equal(vm.runInContext('cockpitMapFollow',c),true);
assert.equal(pendingRecenters.size,0);
assert.deepEqual(jumps.at(-1),[.8,.8]);
