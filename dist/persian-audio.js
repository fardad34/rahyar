'use strict';
// Bundled fixed Persian prompts; no system voice, remote TTS, keys or paid API.
(function(root){
 const buffers=new Map();let active=null,revision=0;
 function phrase(text){const s=String(text||'').trim();if(/^راهنمای صوتی/.test(s))return 'enabled';if(/^به مقصد رسید/.test(s))return 'reached';if(/^به مقصد نزدیک/.test(s))return 'arrive';if(/^حد سرعت/.test(s))return 'speed';if(/^در میدان/.test(s))return 'roundabout';if(/^از خروجی/.test(s))return 'exit';if(/^به چپ بپیچید/.test(s))return 'left';if(/^به راست بپیچید/.test(s))return 'right';if(/^(ادامه دهید|در مسیر بمانید)/.test(s))return 'continue';return null;}
 function cancel(){++revision;const old=active;active=null;if(old){old.finish(false);try{old.source?.stop();}catch{}}}
 function speak(text,{volume=1,onStart,onEnd,onError}={}){
  const key=phrase(text);if(!key)return false;
  cancel();const id=revision;let done=false,timer;
  const task={source:null,finish(ok){if(done)return;done=true;clearTimeout(timer);try{task.source?.disconnect();task.gain?.disconnect();}catch{}if(active===task)active=null;if(ok)onEnd?.();else onError?.();}};active=task;
  timer=setTimeout(()=>{task.finish(false);try{task.source?.stop();}catch{}},15000);
  // Called from Test Voice's user gesture; automatic instructions reuse that context.
  unlockNavigationAudio().then(async ready=>{
   if(!ready)throw Error('Audio context blocked');
   if(id!==revision||done)return;
   if(!buffers.has(key))buffers.set(key,fetch('audio/fa/'+key+'.mp3').then(r=>{if(!r.ok)throw Error('Missing Persian prompt');return r.arrayBuffer();}).then(b=>navigationAudio.decodeAudioData(b)).catch(error=>{buffers.delete(key);throw error;}));
   const buffer=await buffers.get(key);if(id!==revision||done)return;
   if(navigationAudio.state!=='running')throw Error('Audio context suspended');
   const source=navigationAudio.createBufferSource(),gain=navigationAudio.createGain();task.source=source;task.gain=gain;source.buffer=buffer;gain.gain.value=Math.max(0,Math.min(1,volume));source.connect(gain).connect(navigationAudio.destination);source.onended=()=>task.finish(true);source.start();onStart?.();
  }).catch(()=>task.finish(false));return true;
 }
 root.RahyarPersianAudio={speak,cancel,phrase};if(typeof module==='object'&&module.exports)module.exports={phrase};
})(typeof window==='object'?window:globalThis);
