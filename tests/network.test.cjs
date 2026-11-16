const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const code=fs.readFileSync('dist/network.js','utf8');
function load(fetch,abort=true){const ctx={fetch,setTimeout,clearTimeout,AbortSignal:{}};if(abort)ctx.AbortController=AbortController;vm.createContext(ctx);vm.runInContext(code,ctx);return ctx}
(async()=>{
  let called=0;
  const legacy=load(async()=>{called++;return {ok:true,json:async()=>({regions:['Ontario']})}});
  assert.equal(typeof legacy.AbortSignal.timeout,'undefined');
  assert.equal(JSON.stringify(await vm.runInContext("getJSON('regions-na.json')",legacy)),JSON.stringify({regions:['Ontario']}));assert.equal(called,1);
  const ancient=load(async()=>({ok:true,json:async()=>({code:'Ok',routes:[{distance:100}]})}),false);
  assert.equal((await vm.runInContext("getJSON('route')",ancient)).code,'Ok');
  const failed=load(async()=>({ok:false,status:503}));await assert.rejects(vm.runInContext("getJSON('route')",failed),e=>e.status===503);
  const broken=load(async()=>({ok:true,json:async()=>{throw new SyntaxError('invalid JSON')}}));await assert.rejects(vm.runInContext("getJSON('data')",broken),e=>e.name==='SyntaxError');
  let aborted=false;const stalled=load((u,o)=>new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'))})));
  await assert.rejects(vm.runInContext("getJSON('stalled',{},10)",stalled),e=>e.name==='TimeoutError');assert(aborted);
  const stalledBody=load(async()=>({ok:true,json:()=>new Promise(()=>{})}),false);await assert.rejects(vm.runInContext("getJSON('slow-body',{},10)",stalledBody),e=>e.name==='TimeoutError');
  let timerActive=0;const completed=load(async()=>({ok:true,json:async()=>({ok:true})}));completed.setTimeout=(fn,ms)=>{timerActive++;return setTimeout(fn,ms)};completed.clearTimeout=id=>{timerActive--;clearTimeout(id)};await vm.runInContext("getJSON('success')",completed);assert.equal(timerActive,0);
  console.log('PASS: missing AbortSignal.timeout; absent AbortController; HTTP errors; malformed JSON; request timeout and abort; body timeout; timer cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1});
