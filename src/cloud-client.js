import {createClient} from '@supabase/supabase-js';
import model from './report-model.cjs';
const {stationKey,stationStatus,activeReports,pruneQueue,relevantReport}=model;
const $=id=>document.getElementById(id);
const state={client:null,user:null,reports:[],queue:[],channel:null,flushing:false,started:false,layer:null,rejections:new Map()};
const queueKey='rahyar.sharedReportQueue.v1';
function message(text){$('cloud-status').textContent=text;}
function saveQueue(){localStorage.setItem(queueKey,JSON.stringify(state.queue));}
function notify(){document.dispatchEvent(new CustomEvent('rahyar:reports'));renderReports();}
function sessionLabel(){ $('cloud-account').textContent=state.user?'Signed in':'Sign in to share reports';$('cloud-signout').hidden=!state.user;$('cloud-auth').hidden=!!state.user; }
async function fetchReports(){
 if(!state.user)return;
 let q=state.client.from('rahyar_road_reports').select('*').gt('expires_at',new Date().toISOString()).order('observed_at',{ascending:false}).limit(500);
 const context=window.rahyarReportContext?.()||{};
 if(context.bounds){const b=context.bounds;q=q.gte('latitude',b.south).lte('latitude',b.north).gte('longitude',b.west).lte('longitude',b.east);}
 const {data,error}=await q;
 if(error){message('Shared reports unavailable. Cached observations expire normally; retrying.');return;}
 state.reports=data;message(data.length===500?'Showing 500 most recent reports in this area. Narrow the map for more.':'Shared reports connected · '+state.queue.length+' queued');notify();
}
async function connectReports(){
 if(state.channel){await state.client.removeChannel(state.channel);state.channel=null;}
 if(!state.user){state.reports=[];notify();return;}
 state.channel=state.client.channel('rahyar-road-reports').on('postgres_changes',{event:'*',schema:'public',table:'rahyar_road_reports'},()=>fetchReports()).subscribe(status=>{
  if(status==='SUBSCRIBED')fetchReports();
  else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')message('Live updates interrupted; checking every 30 seconds.');
 });
 const language=localStorage.getItem('rahyar.uiLanguage')||'en';
 await state.client.from('rahyar_profiles').upsert({user_id:state.user.id,language:['en','fr','fa','hi','es','de'].includes(language)?language:'en'},{onConflict:'user_id'});
 await fetchReports();await flush();
}
async function flush(){
 if(state.flushing||!state.user||!navigator.onLine)return;
 state.flushing=true;
 try{
  const pending=pruneQueue(state.queue,state.user.id);
  const other=state.queue.filter(r=>r.owner!==state.user.id);
  state.queue=[...other,...pending];saveQueue();
  for(const row of [...pending]){
   const {error}=await state.client.from('rahyar_road_reports').insert(row.payload);
   if(error){
    if(['22023','42501','23514','23503','23502'].includes(error.code)){
     state.queue=state.queue.filter(r=>r!==row);state.rejections.set(row.payload.client_id,error.message);saveQueue();message('Report rejected: '+error.message);continue;
    }
    message('Report queued for retry: '+(error.code==='P0001'?'Submission limit reached.': 'Connection unavailable.'));break;
   }
   state.queue=state.queue.filter(r=>r!==row);saveQueue();message('Report shared with other drivers.');
  }
  await fetchReports();
 }finally{state.flushing=false;}
}
async function submit(payload){
 if(!state.user){$('cloud-panel').open=true;$('cloud-email').focus();throw Error('Sign in before sharing. Navigation works without an account.');}
 if(!Number.isFinite(payload.latitude)||!Number.isFinite(payload.longitude)||!Number.isFinite(payload.accuracy_m)||payload.accuracy_m>100)throw Error('A precise GPS fix is required.');
 if(state.queue.filter(r=>r.owner===state.user.id).length>=40)throw Error('Offline queue is full. Reconnect before submitting more reports.');
 const row={owner:state.user.id,payload:{...payload,client_id:crypto.randomUUID(),observed_at:new Date().toISOString()}};
 state.queue.push(row);
 try{saveQueue();}catch{state.queue.pop();throw Error('Storage unavailable. Report was not queued.');}
 message(navigator.onLine?'Sharing report…':'Saved offline; will share after reconnection.');await flush();
 if(state.rejections.has(row.payload.client_id)){const error=state.rejections.get(row.payload.client_id);state.rejections.delete(row.payload.client_id);throw Error(error);}
 return {queued:state.queue.some(r=>r.payload.client_id===row.payload.client_id)};
}
function currentReports(){return activeReports(state.reports);}
function relevantRows(){
 const c=window.rahyarReportContext?.()||{};
 return currentReports().filter(r=>relevantReport(r,c));
}
function reportLabel(r){return ({police:'Police',closed:'Road Closed',construction:'Construction',weigh:'Weigh Station'})[r.category];}
function renderReports(){
 const box=$('shared-report-list');if(!box)return;
 box.replaceChildren();
 const rows=relevantRows().slice(0,60);
 if(!rows.length){const p=document.createElement('p');p.textContent=state.user?'No fresh relevant reports. Station status remains Unknown.':'Sign in to view reports from other drivers.';box.append(p);}
 for(const r of rows){
  const item=document.createElement('li'),text=document.createElement('span'),flag=document.createElement('button');
  text.textContent=reportLabel(r)+(r.status?' · '+r.status+' (driver observation, not official)':'')+' · Driver '+r.user_id.slice(0,8)+' · '+new Date(r.observed_at).toLocaleTimeString()+' · expires '+new Date(r.expires_at).toLocaleTimeString();
  flag.type='button';flag.className='secondary';flag.textContent='Flag incorrect';flag.onclick=async()=>{const {error}=await state.client.from('rahyar_report_flags').insert({report_id:r.id,reason:'incorrect'});message(error?'Could not flag report (or already flagged).':'Flag recorded for moderator review.');};
  item.append(text,flag);box.append(item);
 }
 window.rahyarRenderReportMarkers?.(rows);
}
async function init(){
 if(state.started)return;state.started=true;
 try{
  state.queue=JSON.parse(localStorage.getItem(queueKey)||'[]');if(!Array.isArray(state.queue))state.queue=[];
  const response=await fetch('/api/config');if(!response.ok)throw Error('Backend configuration unavailable');const config=await response.json();
  state.client=createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const {data}=await state.client.auth.getSession();state.user=data.session?.user||null;sessionLabel();
  state.client.auth.onAuthStateChange((event,session)=>{
   state.user=session?.user||null;sessionLabel();
   // Avoid calling another auth method while its internal lock is held.
   setTimeout(()=>connectReports(),0);
  });
  await connectReports();
 }catch{message('Shared reports unavailable. Existing navigation remains usable.');}
}
$('cloud-auth').onsubmit=async event=>{
 event.preventDefault();if(!state.client){message('Backend unavailable. Try reloading after reconnecting.');return;}
 const email=$('cloud-email').value.trim(),password=$('cloud-password').value;
 const signup=event.submitter?.value==='signup';
 const result=signup?await state.client.auth.signUp({email,password,options:{emailRedirectTo:location.origin}}):await state.client.auth.signInWithPassword({email,password});
 $('cloud-password').value='';message(result.error?result.error.message:signup&&!result.data.session?'Check your email to confirm your account, then sign in.':'Signed in.');
};
$('cloud-signout').onclick=async()=>{
 if(!state.client)return;
 const {error}=await state.client.auth.signOut();if(error){message('Sign out failed. Retry when connected.');return;}
 state.user=null;state.reports=[];sessionLabel();notify();
};
$('shared-retry').onclick=async()=>{await flush();await fetchReports();};
window.addEventListener('online',flush);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){fetchReports();flush();}});
setInterval(()=>{if(state.user){fetchReports();flush();notify();}},30000);
window.RahyarCloud={init,submit,refresh:fetchReports,stationKey,stationStatus:(station,heading)=>stationStatus(state.reports,stationKey(station),heading),get user(){return state.user;},get reports(){return currentReports();},get queueLength(){return state.queue.length;},client:()=>state.client};
if(!document.body.classList.contains('notice-required'))init();
else new MutationObserver((_,observer)=>{if(!document.body.classList.contains('notice-required')){observer.disconnect();init();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
