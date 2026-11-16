const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('dist/road-context.js','utf8'),c);
for(const name of ['BVD CAT Scale','Petro-Pass','Flying J','Pilot']){c.tags={amenity:'weigh_station',name};assert.equal(vm.runInContext('classifyFacility(tags)',c),'scale');}
c.tags={amenity:'weigh_station',name:'CVSE Inspection Station'};assert.equal(vm.runInContext('classifyFacility(tags)',c),'weigh');
c.tags={amenity:'fuel',name:'Petro-Pass'};assert.equal(vm.runInContext('classifyFacility(tags)',c),'diesel');
c.isDemo=false;assert.equal(vm.runInContext("isGovernmentFacility({kind:'scale',authority:'commercial'})",c),false);
assert.equal(vm.runInContext("isGovernmentFacility({kind:'weigh',authority:'government'})",c),true);
const catalog=JSON.parse(fs.readFileSync('dist/facility-catalog.json'));assert(catalog.facilities.filter(f=>['weigh','inspection'].includes(f.kind)).every(f=>f.authority==='government'));assert(catalog.facilities.filter(f=>f.kind==='scale').every(f=>f.authority!=='government'));
console.log('PASS commercial scales separated from government enforcement; Petro-Pass fuel classification; catalog authority metadata.');
