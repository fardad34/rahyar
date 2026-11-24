const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',setAttribute(){},showModal(){this.open=true}});return nodes.get(id)};
const viewCalls=[],panCalls=[];let driving=true;
const ctx={facilityVisible:()=>true,isGovernmentFacility:f=>f.authority==='government',followNavigationPosition(){},updateCockpitBearing(){},$:get,document:{body:{classList:{contains:name=>name==='driving'&&driving}},documentElement:{}},navigator:{},window:{matchMedia:()=>({matches:false})},map:{getSize:()=>({y:500}),getZoom:()=>17,getZoomScale:()=>1,latLngToContainerPoint:coords=>({subtract:()=>coords}),containerPointToLatLng:coords=>coords,setView:(...x)=>viewCalls.push(x),panTo:(...x)=>panCalls.push(x)},isDemo:false,watch:1,gpsTime:Date.now(),setTimeout(){},Date};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/focus-dashboard.js','utf8'),ctx);
const cities=[{name:'Last',at:2000,final:true},{name:'Third',at:600},{name:'Passed',at:90},{name:'First',at:200},{name:'Second',at:400},{name:'Fourth',at:800}];
const stops=[{name:'Past rest',kind:'rest',at:90},{name:'Commercial only',kind:'diesel',at:110},{name:'Truck',kind:'truck',at:350},{name:'Rest',kind:'rest',at:250},{name:'Scale',kind:'weigh',at:105},{name:'Inspection',kind:'inspection',at:375,authority:'government'},{name:'Weigh station',kind:'weigh',at:450,authority:'government'}];
ctx.cities=cities;ctx.stops=stops;
const selected=vm.runInContext("selectFocusPlaces(cities,stops,100,{name:'Destination'},2000)",ctx);assert.equal(selected.final.name,'Last');assert.deepEqual(Array.from(selected.next,c=>c.name),['First','Second','Third']);assert.equal(selected.stop.name,'Rest');assert.equal(selected.inspection.name,'Inspection');
const empty=vm.runInContext("selectFocusPlaces([],[],100,{name:'End'},2000)",ctx);assert.equal(empty.final.at,2000);assert.equal(empty.next.length,0);assert.equal(empty.stop,null);
vm.runInContext('followCockpitPosition([-97,50],true)',ctx);assert.deepEqual(Array.from(viewCalls[0][0]),[50,-97]);assert.equal(viewCalls[0][1],17);
vm.runInContext('followCockpitPosition([-96,51])',ctx);assert.deepEqual(Array.from(panCalls[0][0]),[51,-96]);
vm.runInContext('cockpitMapFollow=false;followCockpitPosition([-95,52])',ctx);assert.equal(panCalls.length,1);
(async()=>{await vm.runInContext('requestFocusFullscreen(false)',ctx);assert(!get('fullscreen-help').open,'Denied/unsupported auto-fullscreen must not cover driving data');await vm.runInContext('requestFocusFullscreen(true)',ctx);assert(get('fullscreen-help').open);console.log('PASS: final destination first; next three in route order; passed cities excluded; nearest truck/rest; diesel-only and scales excluded from rest selection; sparse route; 17x initial map zoom; GPS panning; manual browsing; fullscreen fallback without blocking driving view.');})().catch(e=>{console.error(e);process.exitCode=1});

ctx.searchKey=value=>value.toLowerCase();
ctx.hav=()=>100;
const watchResult=vm.runInContext(`
  const ahead=cities.filter(c=>!c.final&&c.at>120).sort((a,b)=>a.at-b.at);
  focusWatchSlots=[addFocusWatchCity(ahead[3]),addFocusWatchCity({name:'Off route',coord:[0,0]})];
  focusWatchRows(ahead,cities,cities[0],100)
`,ctx);
assert.deepEqual(Array.from(watchResult,c=>c.name),['First','Fourth','Second']);
const after=vm.runInContext('focusWatchRows([],cities,cities[0],900)',ctx);
assert.equal(after.length,0);
assert.equal(vm.runInContext('focusWatchSlots[0]',ctx),'');
