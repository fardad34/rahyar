'use strict';
const screenAwakeReasons=new Set();
let screenAwakeEnabled=true;
function wantsScreenAwake(){return screenAwakeEnabled&&screenAwakeReasons.size>0}
let screenAwakeSentinel=null,screenAwakePending=false,screenAwakeState='idle';
function updateScreenAwakeStatus(){
  const labels={idle:'Screen sleep allowed',pending:'Keeping screen on…',active:'Screen stays on',unsupported:'Keep screen on unavailable',blocked:'Browser paused screen lock',hidden:'Screen lock paused'};
  const status=document.getElementById('screen-awake');
  if(!status)return;
  status.textContent=labels[screenAwakeState];
  status.dataset.state=screenAwakeState;
  const toggle=document.getElementById('stay-on-toggle');
  if(toggle){
    toggle.setAttribute('aria-pressed',String(screenAwakeState==='active'));
    toggle.disabled=screenAwakeState==='pending'||screenAwakeState==='unsupported';
    if(screenAwakeState==='unsupported')status.textContent='Unavailable in this browser. On iPad: Settings → Display & Brightness → Auto-Lock → Never.';
  }
}
function setScreenAwakeReason(reason,enabled){
  if(enabled)screenAwakeReasons.add(reason);else screenAwakeReasons.delete(reason);
  refreshScreenAwakeRequest();
}
function refreshScreenAwakeRequest(){
  if(!wantsScreenAwake()){const previous=screenAwakeSentinel;
    screenAwakeSentinel=null;
    screenAwakeState='idle';
    if(previous)Promise.resolve(previous.release()).catch(()=>{});
    updateScreenAwakeStatus();
    return}
  requestScreenAwake();
}
async function requestScreenAwake(){
  if(!wantsScreenAwake()||screenAwakePending)return;
  if(document.visibilityState!=='visible'){screenAwakeState='hidden';updateScreenAwakeStatus();return}
  if(screenAwakeSentinel&&!screenAwakeSentinel.released){screenAwakeState='active';updateScreenAwakeStatus();return}
  if(!navigator.wakeLock||typeof navigator.wakeLock.request!=='function'){screenAwakeState='unsupported';updateScreenAwakeStatus();return}
  screenAwakePending=true;screenAwakeState='pending';updateScreenAwakeStatus();
  try{
    const sentinel=await navigator.wakeLock.request('screen');
    if(!wantsScreenAwake()||document.visibilityState!=='visible'){await sentinel.release();screenAwakeState=wantsScreenAwake()&&document.visibilityState!=='visible'?'hidden':'idle';return}
    screenAwakeSentinel=sentinel;screenAwakeState='active';
    sentinel.addEventListener('release',()=>{if(screenAwakeSentinel!==sentinel)return;screenAwakeSentinel=null;screenAwakeState=!wantsScreenAwake()?'idle':document.visibilityState==='visible'?'blocked':'hidden';updateScreenAwakeStatus()});
  }catch{screenAwakeState=!wantsScreenAwake()?'idle':document.visibilityState==='visible'?'blocked':'hidden'}
  finally{screenAwakePending=false;if(wantsScreenAwake()&&document.visibilityState==='visible'&&screenAwakeState==='idle')requestScreenAwake();else updateScreenAwakeStatus()}
}
function initScreenAwake(){
  try{screenAwakeEnabled=localStorage.getItem('rahyar.stayOn')!=='off'}catch{}
  const toggle=document.getElementById('stay-on-toggle');
  if(toggle)toggle.onclick=()=>{
    screenAwakeEnabled=screenAwakeState!=='active';
    try{localStorage.setItem('rahyar.stayOn',screenAwakeEnabled?'on':'off')}catch{}
    refreshScreenAwakeRequest();
  };
  document.addEventListener('click',()=>{if(screenAwakeState==='blocked')requestScreenAwake()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')requestScreenAwake();else if(wantsScreenAwake()){screenAwakeState='hidden';updateScreenAwakeStatus()}});
  window.addEventListener('pageshow',requestScreenAwake);window.addEventListener('focus',requestScreenAwake);updateScreenAwakeStatus();
}
