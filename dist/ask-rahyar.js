'use strict';
(() => {
 const panel=document.createElement('details');panel.className='panel cloud-panel';panel.innerHTML='<summary>Ask Rahyar</summary><p>Route-data answers · No AI model connected. No paid inference. Never use this assistant as proof of truck legality.</p><form id="ask-form"><label>Ask about your trip <input id="ask-input" maxlength="500" placeholder="Where is the next weigh station?" required></label><button type="submit" class="secondary">Ask</button><button type="button" class="secondary" id="ask-talk">Push to talk</button></form><p id="ask-answer" role="status"></p><button type="button" class="secondary" id="ask-action" hidden>Confirm map change</button><p id="ask-source" class="small"></p>';$('cloud-panel').after(panel);
 function context(){
  const describe=stop=>stop?stop.name+' · '+fa(roadDistance(stop.at-progress))+' '+distanceUnit()+' ahead':null;
  const flyingJ=roadFacilities.find(f=>f.at>=progress&&facilityVisible(f)&&fuelBrandKey(f)==='flying-j');
  const station=nextAlertStation();const status=station?window.RahyarCloud?.stationStatus(station,stationRouteBearing(station)):null;
  const end=dest?{...dest,at:routeLength}:null;const forecast=end?forecastAt(forecastCache.get(forecastKey(end))?.data,arrivalFor(end)):null;
  return {border:coords.length?$('border-distance').textContent+' '+$('border-unit').textContent+' · '+$('border-target').textContent:null,
   flyingJ:describe(flyingJ),station:station?describe(station)+' · '+(status?.status==='unknown'?'Status Unknown':status?.status?'Drivers report '+status.status+' (not official)':'Status Unknown'):null,
   weather:forecast?.temp!==undefined?formatTemperature(forecast.temp)+' · '+weatherCondition(forecast.code)[0]+' · Open-Meteo estimate at arrival':null,
   stops:roadFacilities.filter(f=>f.at>=progress&&facilityVisible(f)&&['truck','rest','diesel'].includes(f.kind)).slice(0,3).map(describe).join('; ')};
 }
 let action=null;
 $('ask-form').onsubmit=async event=>{
  event.preventDefault();const client=window.RahyarCloud?.client();if(!client){$('ask-answer').textContent='Account service unavailable.';return;}
  const {data}=await client.auth.getSession();if(!data.session){$('ask-answer').textContent='Sign in before using the data assistant.';return;}
  $('ask-answer').textContent='Checking loaded trip data…';$('ask-action').hidden=true;
  try{
   const response=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({question:$('ask-input').value,context:context()})});
   const result=await response.json();if(!response.ok)throw Error(result.error);
   $('ask-answer').textContent=result.text;$('ask-source').textContent='Source: '+result.source+' · Data lookup; no language model';action=result.action;$('ask-action').hidden=!action;
  }catch(error){$('ask-answer').textContent=error.message||'Assistant unavailable.';}
 };
 $('ask-action').onclick=()=>{if(action==='night'&&!navigationNight)$('map-night').click();if(action==='3d'&&!navigationPitch)$('map-dimension').click();$('ask-action').hidden=true;};
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){$('ask-talk').disabled=true;$('ask-talk').title='Speech recognition is not available in this browser. Use text input.';}
 else $('ask-talk').onclick=()=>{
  const recognition=new Speech();recognition.lang=spokenDirections[alertLanguage]?.locale||'en-CA';recognition.continuous=false;recognition.interimResults=false;
  recognition.onresult=event=>{$('ask-input').value=event.results[0][0].transcript;$('ask-answer').textContent='Transcribed. Tap Ask to submit.';};
  recognition.onerror=()=>{$('ask-answer').textContent='Voice input unavailable or permission denied. Use text instead.';};
  recognition.onend=()=>{$('ask-talk').disabled=false;};
  try{recognition.start();$('ask-talk').disabled=true;$('ask-answer').textContent='Listening… Browser speech services may process your audio.';}catch{$('ask-answer').textContent='Could not start voice input.';}
 };
})();
