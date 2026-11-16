const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map(['screen-awake','focus-screen-awake'].map(id=>[id,{dataset:{}}])),events={},winEvents={};let calls=0,fail=false,pendingResolve=null,held=[];
function sentinel(){const listeners={};return {released:false,addEventListener(k,fn){listeners[k]=fn},async release(){this.released=true;listeners.release?.()}}}
const ctx={document:{visibilityState:'visible',getElementById:id=>nodes.get(id),addEventListener:(n,fn)=>events[n]=fn},window:{addEventListener:(n,fn)=>winEvents[n]=fn},navigator:{wakeLock:{async request(){calls++;if(fail)throw Error('denied');if(pendingResolve===true)return new Promise(r=>pendingResolve=r);const s=sentinel();held.push(s);return s}}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/screen-awake.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),flush=async()=>{await new Promise(setImmediate)};
(async()=>{
run('initScreenAwake();setScreenAwakeReason("trip",true)');await flush();assert.equal(nodes.get('screen-awake').textContent,'Screen stays on');assert.equal(calls,1);
run('setScreenAwakeReason("focus",true)');await flush();assert.equal(calls,1);
run('setScreenAwakeReason("focus",false)');assert(!held[0].released,'Exiting focus must not release an active trip');
ctx.document.visibilityState='hidden';events.visibilitychange();await held[0].release();assert.equal(nodes.get('screen-awake').textContent,'Screen lock paused');
ctx.document.visibilityState='visible';events.visibilitychange();await flush();assert.equal(calls,2);assert.equal(nodes.get('screen-awake').textContent,'Screen stays on');
run('setScreenAwakeReason("trip",false)');await flush();assert(held[1].released);assert.equal(nodes.get('screen-awake').textContent,'Screen sleep allowed');
const before=calls;winEvents.focus();await flush();assert.equal(calls,before,'Idle focus event must not request a lock');
fail=true;run('setScreenAwakeReason("trip",true)');await flush();assert.equal(nodes.get('screen-awake').textContent,'Browser paused screen lock');fail=false;events.click();await flush();assert.equal(nodes.get('screen-awake').textContent,'Screen stays on');
run('setScreenAwakeReason("trip",false)');await flush();pendingResolve=true;run('setScreenAwakeReason("trip",true)');await flush();run('setScreenAwakeReason("trip",false)');const late=sentinel();pendingResolve(late);await flush();assert(late.released,'Late request must be released after trip ends');assert.equal(nodes.get('screen-awake').textContent,'Screen sleep allowed');
ctx.navigator.wakeLock=undefined;run('setScreenAwakeReason("trip",true)');await flush();assert.equal(nodes.get('screen-awake').textContent,'Keep screen on unavailable');
ctx.navigator.wakeLock={async request(){const s=sentinel();held.push(s);return s}};
run('setScreenAwakeReason("app",true);setScreenAwakeReason("trip",false)');
await flush();
assert.equal(nodes.get('screen-awake').textContent,'Screen stays on');
console.log('PASS: trip activation; focus shares lock; focus exit preserves active trip; return from background reacquires; stop releases; idle does not lock; denial is visible and retry works; stopped pending request releases; unsupported browser is reported.');
})().catch(e=>{console.error(e);process.exitCode=1});
