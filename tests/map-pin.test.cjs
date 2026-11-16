const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('pin lookup fills the search box without replacing the destination coordinates', async () => {
  const fields = new Map();
  let result;
  const context = vm.createContext({
    URLSearchParams,
    $(id) {
      if (!fields.has(id)) fields.set(id, {closest:()=>({scrollIntoView(){}})});
      return fields.get(id);
    },
    document:{body:{classList:{contains:()=>false}}},
    map:null, navigationMap:null, requestId:0,
    regionAt:()=>({country:'CA'}),
    esriCountryCodes:new Map([['CAN','CA']]),
    setPlaceSearchMode(){context.requestId++},
    showCityResults(matches){result=JSON.parse(JSON.stringify(matches[0]))},
    getJSON:async()=>({address:{Match_addr:'301 Front St W, Toronto', Addr_type:'PointAddress', CountryCode:'CAN'}}),
  });
  vm.runInContext(fs.readFileSync('dist/map-pin.js','utf8'), context);
  await vm.runInContext('pickingMapPin=true; selectMapPin({lng:-79.3871,lat:43.6426})',context);
  assert.equal(fields.get('query').value, '301 Front St W, Toronto');
  assert.deepEqual(result.coord, [-79.3871,43.6426]);
  assert.equal(result.mapPin, true);

  context.getJSON = async()=>{throw new Error('Offline')};
  await vm.runInContext('selectMapPin({lng:-79.3,lat:43.6})',context);
  assert.equal(fields.get('query').value, '43.600000, -79.300000');
  assert.deepEqual(result.coord, [-79.3,43.6]);
});
