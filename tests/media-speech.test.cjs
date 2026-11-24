'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const nodes=new Map(),timers=new Map();let timer=0,plays=0,rejectPlay=false;
 const node=()=>({textContent:'',firstElementChild:{innerHTML:''},replaceChildren(){},setAttribute(){},removeAttribute(){},load(){}});
 const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 const audio=get('road-audio');Object.assign(audio,{paused:true,ended:false,src:'',volume:1,pause(){this.paused=true;},play(){plays++;if(rejectPlay)return Promise.reject(Error('NotAllowedError'));this.paused=false;return Promise.resolve();}});
 const c={window:{},document:{getElementById:get,querySelectorAll:()=>[]},Option:class{},URL,crypto:{randomUUID:()=>String(Math.random())},setTimeout(f,ms){timers.set(++timer,{f,ms});return timer;},clearTimeout(id){timers.delete(id);}};
 vm.createContext(c);const source=fs.readFileSync('dist/road-media.js','utf8').replace('  initializeLibrary();','  window.fixture={selectMedia,pausePlayback,togglePlayback};');vm.runInContext(source,c);
 const entry={id:'one',name:'Test stream',url:'https://example.test/audio'},list={entries:[entry]};
 return {c,audio,get,select(e=entry){c.window.fixture.selectMedia(list,e);},get plays(){return plays;},deny(){rejectPlay=true;},flush(){for(const [id,t]of timers)if(t.ms===150){timers.delete(id);t.f();}}};
}
test('Safari speech pause resumes same media without reloading or changing position',async()=>{const s=setup();s.select();await Promise.resolve();s.audio.currentTime=42;const finish=s.c.window.RahyarMedia.beginNavigationSpeech();s.audio.paused=true;finish();s.flush();await Promise.resolve();assert.equal(s.plays,2);assert.equal(s.audio.paused,false);assert.equal(s.audio.currentTime,42);});
test('explicit Pause while Safari has interrupted media cancels automatic resumption',async()=>{const s=setup();s.select();await Promise.resolve();const finish=s.c.window.RahyarMedia.beginNavigationSpeech();s.audio.paused=true;s.c.window.fixture.togglePlayback();finish();s.flush();assert.equal(s.plays,1);assert.equal(s.audio.paused,true);});
test('source replacement, ended media and initially paused media are not restarted',async()=>{for(const scenario of ['source','ended','paused']){const s=setup();s.select();await Promise.resolve();if(scenario==='paused')s.c.window.fixture.pausePlayback();const finish=s.c.window.RahyarMedia.beginNavigationSpeech();s.audio.paused=true;if(scenario==='source')s.select({id:'two',name:'Other',url:'https://example.test/other'});if(scenario==='ended')s.audio.ended=true;const before=s.plays;finish();s.flush();assert.equal(s.plays,before,scenario);}});
test('autoplay-denied media restoration is bounded and offers an explicit Play retry',async()=>{const s=setup();s.select();await Promise.resolve();const finish=s.c.window.RahyarMedia.beginNavigationSpeech();s.audio.paused=true;s.deny();finish();s.flush();await Promise.resolve();await Promise.resolve();s.flush();assert.equal(s.plays,2);assert.match(s.get('media-status').textContent,/Tap Play to retry/);});

test('another instruction during Safari audio-focus release still restores the radio once',async()=>{const s=setup();s.select();await Promise.resolve();const one=s.c.window.RahyarMedia.beginNavigationSpeech();s.audio.paused=true;one();const two=s.c.window.RahyarMedia.beginNavigationSpeech();s.flush();assert.equal(s.plays,1);two();s.flush();assert.equal(s.plays,2);});
